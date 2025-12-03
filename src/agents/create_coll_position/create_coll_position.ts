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
	code: number;
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
		log(`loadExcel: Файл открыт`, "info");

		const worksheet = oExcelDoc.GetWorksheet(0);
		log(`loadExcel: Worksheet получен`, "info");

		const cells = worksheet.Cells;

		return cells;
	} catch (e) {
		throw HttpError("loadExcel ", {
			code: 404,
			message: `Ошибка загрузки файла Excel: ${e.message}`,
		});
	}
}

/**
 * Функция преобразует числовые индексы колонки и строки в адрес Excel (например A1, C5, AA10)
 * @param {number} columnNum - индекс столбца (0-based)
 * @param {number} rowNum - индекс строки (0-based)
 */
function getCellName(columnNum: number, rowNum: number): string {
	try {
		if (columnNum < 0 || rowNum < 0) {
			return "";
		}

		let result = "";
		let index = columnNum;
		let remainder;

		while (index >= 0) {
			remainder = index % 26;
			result = String.fromCharCode(65 + remainder) + result;
			index = OptInt(index / 26) - 1;
		}

		return result + (rowNum + 1);
	} catch (e) {
		throw HttpError("getCellName ", {
			code: 404,
			message: "Ошибка получения ячеек таблицы",
		});
	}
}

function getCellValue(cells: any, row: number, col: number): string {
	const cell = cells.GetCell(getCellName(col, row));

	if (cell == undefined) return "";

	const val = cell.Value;

	if (val == null) return "";

	const strVal = Trim(String(val));

	if (strVal === "undefined") return "";

	return strVal;
}

function readExcel(sFileUrl: string) {
	try {
		const _cells = loadExcel(sFileUrl);
		const bEmptyRows = false;

		if (!_cells) {
			throw HttpError("readExcel ", {
				code: 404,
				message: "Не удалось получить таблицу: readExcel()",
			});
		}

		let row = 1;

		let codeExcel;
		let person: IColl;

		while (!bEmptyRows) {
			codeExcel = getCellValue(_cells, row, 0);

			if (codeExcel === "" || codeExcel === "undefined") break;

			person = {
				code: getCellValue(_cells, row, 0),
				login: getCellValue(_cells, row, 1),
				lastname: getCellValue(_cells, row, 2),
				firstname: getCellValue(_cells, row, 3),
				middlename: getCellValue(_cells, row, 4),
				sex: getCellValue(_cells, row, 5),
				position_name: getCellValue(_cells, row, 6),
			};

			try {
				createOrUpdatePersonCard(person);
			} catch (err) {
				throw HttpError("readExcel ", {
					code: 404,
					message: `Ошибка в строке ${row}: ${err.message}`,
				});
			}

			row++;
		}
	} catch (e) {
		throw HttpError("readExcel ", {
			code: 404,
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
		throw HttpError("findCollaborator ", {
			code: 404,
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
		throw HttpError("findPosition ", {
			code: 404,
			message: "Не найдена должность",
		});
	}
}

function createOrUpdateCollaborator(cardData: IColl) {
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
}

function createOrUpdatePosition(
	collaboratorId: number,
	positionName: string,
	lastname: string,
) {
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
		log(`Создана должность: ${positionName} (ID: ${positionId})`, "info");
	}

	return positionId;
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

			log(
				`Обновлена информация о должности в карточке сотрудника ${cardData.lastname}`,
				"info",
			);
		}
	} catch (e) {
		throw HttpError("createOrUpdatePersonCard ", {
			code: 404,
			message: `Ошибка обработки карточки для ${cardData.login}`,
		});
	}
}

function main() {
	try {
		if (GLOBAL.FILE_IMPORT == undefined) {
			throw HttpError("main ", {
				code: 404,
				message: "Ошибка: необходимо указать ссылку на файл в параметрах агента.",
			});
		}

		const docImportFile = tools.open_doc(
			GLOBAL.FILE_IMPORT,
		) as ResourceDocument;

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
		throw HttpError("main ", {
			code: 404,
			message: `Выполнение прервано из-за ошибки: ${e.message}`,
		});
	}
}

log("--- Начало. #55435 Агент импорта сотрудников из файла Excel ---");

main();

log("--- Конец. #55435 Агент импорта сотрудников из файла Excel ---");

export {};
