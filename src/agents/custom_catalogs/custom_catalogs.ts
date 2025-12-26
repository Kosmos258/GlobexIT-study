const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
	FILE_IMPORT: OptInt(Param.FILE_IMPORT),
};

interface IColl {
	code: string;
	login: string;
	fullname: string;
	code_position: string;
	position_name: string;
	code_group: string;
}

interface CcAdaptationCatalogDocument extends XmlDocument {
	TopElem: XmlTopElem & {
		code_cc: XmlElem<string>;
		login_cc: XmlElem<string>;
		full_name_cc: XmlElem<string>;
		code_position_cc: XmlElem<string>;
		name_position_cc: XmlElem<string>;
		code_group_cc: XmlElem<string>;
	};
}

interface IError {
	code: number;
	message: string;
}

interface IOutsourceCollaborator {
	collaborator_id: string;
}

/**
 * Создает поток ошибки с объектом error
 * @param {object} source - источник ошибки
 * @param {object} errorObject - объект ошибки
 */
function HttpError(source: string, errorObject: IError) {
	throw new Error(source + " " + errorObject.message);
}

const logConfig = {
	code: "globex_log",
	type: "AGENT",
	agentId: "7231682973502668375",
};

EnableLog(logConfig.code, GLOBAL.IS_DEBUG);

/**
 * Вывод сообщения в журнал
 * @param {string} message - Сообщение
 * @param {string} type - Тип сообщения info/error
 */
function log(message: string, type?: string) {
	type = IsEmptyValue(type) ? "INFO" : StrUpperCase(type);

	if (
		ObjectType(message) === "JsObject"
		|| ObjectType(message) === "JsArray"
		|| ObjectType(message) === "XmLdsSeq"
	) {
		message = tools.object_to_text(message, "json");
	}

	const log = `[${type}][${logConfig.type}][${logConfig.agentId}]: ${message}`;
	if (LdsIsServer) {
		LogEvent(logConfig.code, log);
	} else if (GLOBAL.IS_DEBUG) {
		alert(log);
	}
}

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

function loadExcel(sFileUrl: string) {
	try {
		const filePath = UrlToFilePath(sFileUrl);
		const oExcelDoc = tools.get_object_assembly("Excel");
		oExcelDoc.Open(filePath);

		const worksheet = oExcelDoc.GetWorksheet(0);

		const cells = worksheet.Cells;

		return cells;
	} catch (e) {
		HttpError("loadExcel ", {
			code: 500,
			message: `Ошибка загрузки файла Excel: ${e.message}`,
		});
	}
}

/**
 * Функция получает значение ячейки по индексам строки и столбца
 * @param {any} cells - объект ячеек Excel
 * @param {number} row - индекс строки (0-based)
 * @param {number} col - индекс столбца (0-based)
 * @returns {string} - значение ячейки или пустая строка
 */
function getCellValue(cells: any, row: number, col: number): string {
	try {
		if (col < 0 || row < 0) {
			return "";
		}

		let columnName = "";
		let index = col;
		let remainder;

		while (index >= 0) {
			remainder = index % 26;
			columnName = String.fromCharCode(65 + remainder) + columnName;
			index = OptInt(index / 26) - 1;
		}

		const cellAddress = columnName + (row + 1);

		const cell = cells.GetCell(cellAddress);

		if (cell == undefined) return "";

		const val = cell.Value;

		if (val == null) return "";

		const strVal = Trim(String(val));

		if (strVal === "undefined") return "";

		return strVal;
	} catch (e) {
		HttpError("getCellValue", {
			code: 404,
			message: `Ошибка получения значения ячейки [${row}, ${col}]: ${e.message}`,
		});

		return "";
	}
}

function getOutsourceCollaboratorIds(): string[] {
	const result = selectAll<IOutsourceCollaborator>(`
		SELECT 
			(xpath('//collaborator_id/text()', collab_xml.collaborator))[1]::text AS collaborator_id
		FROM groups g
		CROSS JOIN LATERAL unnest(xpath('//collaborators/collaborator', g.data)) AS collab_xml(collaborator)
		WHERE (xpath('//name/text()', g.data))[1]::text = 'OutSource'
	`);

	return result.map(row => row.collaborator_id);
}

function readExcel(sFileUrl: string) {
	try {
		const _cells = loadExcel(sFileUrl);

		const outsourceCollaboratorIds = getOutsourceCollaboratorIds();

		let row = 1;
		let codeExcel;
		let personData: IColl;
		const processedLogins: string[] = [];

		// eslint-disable-next-line no-constant-condition
		while (true) {
			codeExcel = getCellValue(_cells, row, 0);

			if (!codeExcel) {
				break;
			}

			try {
				personData = {
					code: codeExcel,
					login: getCellValue(_cells, row, 1),
					fullname: getCellValue(_cells, row, 2),
					code_position: getCellValue(_cells, row, 3),
					position_name: getCellValue(_cells, row, 4),
					code_group: getCellValue(_cells, row, 5),
				};

				if (!outsourceCollaboratorIds.includes(personData.code)) {
					row++;
					continue;
				}

				if (processedLogins.indexOf(personData.login) !== -1) {
					row++;
					continue;
				}

				processedLogins.push(personData.login);
				createOrUpdateCollaborator(personData);
			} catch (err) {
				HttpError("readExcel", {
					code: 500,
					message: `Ошибка в строке ${row}: ${err.message}`,
				});
			}

			row++;
		}
	} catch (e) {
		HttpError("readExcel", {
			code: 500,
			message: `Ошибка чтения файла: ${e.message}`,
		});
	}
}

function findCollaborator(code_cc: string, login_cc: string): any {
	try {
		const queryStr =
			`for $elem in cc_adaptation_catalogs where $elem/code_cc = '${code_cc}' and $elem/login_cc = '${login_cc}' return $elem`;
		const objArray = tools.xquery(queryStr);

		const firstElem = ArrayOptFirstElem(objArray);

		return firstElem;
	} catch (e) {
		log(`Ошибка поиска сотрудника ${login_cc}: ${e.message}`, "error");

		return undefined;
	}
}

function createOrUpdateCollaborator(cardData: IColl) {
	try {
		const existingCollab = findCollaborator(cardData.code, cardData.login);

		if (existingCollab != undefined) {
			log(
				`Карточка сотрудника ${cardData.login} (код ${cardData.code}) уже существует. Пропуск.`,
				"info",
			);

			return;
		}

		const collabDoc: CcAdaptationCatalogDocument = tools.new_doc_by_name("cc_adaptation_catalog");
		collabDoc.BindToDb();

		const tecollabDoc = collabDoc.TopElem;

		tecollabDoc.code_cc.Value = cardData.code;
		tecollabDoc.login_cc.Value = cardData.login;
		tecollabDoc.full_name_cc.Value = cardData.fullname;
		tecollabDoc.code_position_cc.Value = cardData.code_position;
		tecollabDoc.name_position_cc.Value = cardData.position_name;
		tecollabDoc.code_group_cc.Value = cardData.code_group;

		collabDoc.Save();

		return collabDoc;
	} catch (error) {
		HttpError("createOrUpdateCollaborator ", {
			code: 500,
			message: `Ошибка обработки карточки для ${cardData.login}: ${error.message}`,
		});
	}
}

function main() {
	try {
		if (GLOBAL.FILE_IMPORT == undefined) {
			HttpError("main ", {
				code: 500,
				message: "Ошибка: необходимо указать ссылку на файл в параметрах агента.",
			});
		}

		const docImportFile = tools.open_doc<ResourceDocument>(GLOBAL.FILE_IMPORT);

		if (docImportFile == undefined) {
			log("Ошибка: файл не найден в системе.", "error");

			return;
		}

		const fileUrl = docImportFile.TopElem.file_url.Value;

		if (!StrContains(UrlPathSuffix(fileUrl), ".xls")) {
			log("Ошибка: необходимо выбрать файл '.xls' или '.xlsx'", "error");

			return;
		}

		const sTempFileUrl = ObtainSessionTempFile(
			StrLowerCase(UrlPathSuffix(fileUrl)),
		);

		docImportFile.TopElem.get_data(sTempFileUrl);

		readExcel(sTempFileUrl);
	} catch (e) {
		log(`Ошибка в main: ${e.message}`, "error");
		HttpError("main ", {
			code: 500,
			message: `Выполнение прервано из-за ошибки: ${e.message}`,
		});
	}
}

log("--- Начало. #55435 Агент импорта сотрудников из файла Excel ---");

main();

log("--- Конец. #55435 Агент импорта сотрудников из файла Excel ---");

export {};
