const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
	FILE_IMPORT: OptInt(Param.FILE_IMPORT),
};

interface IColl {
	code: string;
	login: string;
	lastname: string;
	firstname: string;
	middlename: string;
	sex: string;
	position_name: string;
}

interface IError {
	message: string;
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
	agentId: "7228402166165122121",
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
			message: `Ошибка получения значения ячейки [${row}, ${col}]: ${e.message}`,
		});

		return "";
	}
}

function readExcel(sFileUrl: string) {
	try {
		const _cells = loadExcel(sFileUrl);

		if (!_cells) {
			HttpError("readExcel", {
				message: "Не удалось получить таблицу: readExcel()",
			});
		}

		let row = 1;
		let codeExcel;
		let personData: IColl;

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
					lastname: getCellValue(_cells, row, 2),
					firstname: getCellValue(_cells, row, 3),
					middlename: getCellValue(_cells, row, 4),
					sex: getCellValue(_cells, row, 5),
					position_name: getCellValue(_cells, row, 6),
				};

				createOrUpdatePersonCard(personData);
			} catch (err) {
				HttpError("readExcel", {
					message: `Ошибка в строке ${row}: ${err.message}`,
				});
			}

			row++;
		}

	} catch (e) {
		HttpError("readExcel", {
			message: `Ошибка чтения файла: ${e.message}`,
		});
	}
}

function findCollaborator(code: string, login: string): any {
	try {
		const queryStr =
			`for $elem in collaborators where $elem/code = '${code}' and $elem/login = '${login}' return $elem`;
		const objArray = tools.xquery(queryStr);

		const firstElem = ArrayOptFirstElem(objArray);

		return firstElem;
	} catch (e) {
		HttpError("findCollaborator ", {
			message: "Не найден сотрудник",
		});
	}
}

function findPosition(collaboratorId: number): any {
	try {
		const queryStr = `for $elem in positions where $elem/basic_collaborator_id = ${collaboratorId} return $elem`;
		const objArray = tools.xquery(queryStr);

		return ArrayOptFirstElem(objArray);
	} catch (e) {
		HttpError("findPosition ", {
			message: "Не найдена должность",
		});
	}
}

function createOrUpdateCollaborator(cardData: IColl) {
	try {
		const existingCollab = findCollaborator(cardData.code, cardData.login);

		let collabDoc: CollaboratorDocument;

		if (existingCollab != undefined) {
			collabDoc = tools.open_doc(existingCollab.id);
		} else {
			collabDoc = tools.new_doc_by_name("collaborator", false);
			collabDoc.BindToDb();
		}

		const tecollabDoc = collabDoc.TopElem;

		tecollabDoc.code.Value = cardData.code;
		tecollabDoc.login.Value = cardData.login;
		tecollabDoc.lastname.Value = cardData.lastname;
		tecollabDoc.middlename.Value = cardData.middlename;
		tecollabDoc.firstname.Value = cardData.firstname;
		tecollabDoc.sex.Value = cardData.sex;
		tecollabDoc.position_name.Value = cardData.position_name;

		collabDoc.Save();

		return collabDoc;
	} catch (error) {
		HttpError("createOrUpdateCollaborator ", {
			message: "Не найден сотрудник",
		});
	}
}

function createOrUpdatePosition(
	collaboratorId: number,
	positionName: string,
	lastname: string,
) {
	try {
		const existingPosition = findPosition(collaboratorId);

		let posDoc: PositionDocument;
		let positionId;

		if (existingPosition != undefined) {
			posDoc = tools.open_doc(existingPosition.id);
			positionId = existingPosition.id;
		} else {
			posDoc = tools.new_doc_by_name("position", false);
			posDoc.BindToDb();
			log(`Создание новой должности для ${lastname}`, "info");
		}

		const tePosDoc = posDoc.TopElem;

		tePosDoc.name.Value = positionName;
		tePosDoc.position_date.Value = Date();

		tePosDoc.basic_collaborator_id.Value = collaboratorId;

		posDoc.Save();

		if (existingPosition == undefined) {
			positionId = tePosDoc.id;
		}

		return positionId;
	} catch (error) {
		HttpError("findPosition ", {
			message: "Не найдена должность",
		});
	}
}

function createOrUpdatePersonCard(cardData: IColl) {
	try {
		const collabDoc = createOrUpdateCollaborator(cardData);

		if (cardData.position_name !== "") {
			const positionId = createOrUpdatePosition(
				collabDoc.TopElem.id,
				cardData.position_name,
				cardData.lastname,
			);

			collabDoc.TopElem.position_id.Value = positionId;
			collabDoc.TopElem.position_name.Value = cardData.position_name;

			collabDoc.Save();
		}
	} catch (e) {
		HttpError("createOrUpdatePersonCard ", {
			message: `Ошибка обработки карточки для ${cardData.login}`,
		});
	}
}

function main() {
	try {
		if (GLOBAL.FILE_IMPORT == undefined) {
			HttpError("main ", {
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
			message: `Выполнение прервано из-за ошибки: ${e.message}`,
		});
	}
}

log("--- Начало. #55435 Агент импорта сотрудников из файла Excel ---");

main();

log("--- Конец. #55435 Агент импорта сотрудников из файла Excel ---");

export {};
