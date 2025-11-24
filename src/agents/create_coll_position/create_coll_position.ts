declare const tools: any;
declare const tools_web: any;
declare const Param: any;
declare const OptInt: (v: any) => number;
declare const UrlToFilePath: (url: string) => string;
declare const Real: (n: number) => number;
declare const Int: (n: number) => number;
declare const IsEmptyValue: (v: any) => boolean;
declare const StrUpperCase: (s: string) => string;
declare const ObjectType: (v: any) => string;
declare const LdsIsServer: boolean;
declare const LogEvent: (code: string, msg: string) => void;
declare const Trim: (s: string) => string;
declare const ObtainSessionTempFile: (ext: string) => string;
declare const UrlPathSuffix: (url: string) => string;
declare const StrLowerCase: (s: string) => string;
declare const StrContains: (str: string, substr: string) => boolean;
declare const Sleep: (ms: number) => void;
declare const Date: () => string;
declare const ArrayOptFirstElem: (arr: any[]) => any;

const FILE_IMPORT = OptInt(Param.FILE_IMPORT);

interface IColl {
	code: string;
	login: string;
	lastname: string;
	firstname: string;
	middlename: string;
	sex: string;
	position_name: string;
}

function loadExcel(sFileUrl: string) {
	try {
		const oExcelDoc = tools.get_object_assembly("Excel");
		oExcelDoc.Open(UrlToFilePath(sFileUrl));

		return oExcelDoc.GetWorksheet(0).Cells;
	} catch (e) {
		throw Error("loadExcel -> " + (e as Error).message);
	}
}

function getCellName(columnNum: number, rowNum: number): string {
	try {
		if (columnNum < 0 || rowNum < 0) return "";
		const columnLetterCodes: number[] = [];
		const lettersInAlphabet = Real(26);
		let columnNumRem = columnNum;

		while (columnNumRem >= lettersInAlphabet) {
			columnLetterCodes.push(columnNumRem % lettersInAlphabet);
			columnNumRem = Int(columnNumRem / lettersInAlphabet) - 1;
		}
		columnLetterCodes.push(columnNumRem);

		let columnLetter = "";

		for (let i = 0; i < columnLetterCodes.length; i++) {
			const letterCode = columnLetterCodes[i];
			columnLetter = String.fromCharCode(65 + letterCode) + columnLetter;
		}

		return columnLetter + (rowNum + 1);
	} catch (e) {
		throw Error("getCellName -> " + (e as Error).message);
	}
}

const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
};

const logConfig = {
	code: "globex_log",
	type: "AGENT",
	agentId: "",
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
		// eslint-disable-next-line no-alert
		alert(log);
	}
}

function readExcel(sFileUrl: string) {
	try {
		const _cells = loadExcel(sFileUrl);
		let bEmptyRows = false;

		if (_cells != undefined) {
			let i = 0;

			const getVal = (colIndex: number): string => {
				const cell = _cells.GetCell(getCellName(colIndex, i));

				return cell.Value != undefined ? Trim(String(cell.Value)) : "";
			};

			let code = "";
			let login = "";
			let lastname = "";
			let firstname = "";
			let middlename = "";
			let sex = "";
			let position_name = "";

			while (!bEmptyRows) {
				i++;
				if (i > 10000) break;

				code = getVal(0);
				login = getVal(1);
				lastname = getVal(2);
				firstname = getVal(3);
				middlename = getVal(4);
				sex = getVal(5);
				position_name = getVal(6);

				if (
					code === ""
					&& login === ""
					&& lastname === ""
					&& firstname === ""
				) {
					bEmptyRows = true;
				} else {
					try {
						createOrUpdatePersonCard({
							code: code,
							login: login,
							lastname: lastname,
							firstname: firstname,
							middlename: middlename,
							sex: sex,
							position_name: position_name,
						});
					} catch (err) {
						log(`Ошибка в строке ${i}: ${(err as Error).message}`, "error");
					}
				}
			}

			log("Всего обработано строк в Excel: " + (i - 1));
		} else {
			log("Не удалось получить таблицу: readExcel()", "error");
		}
	} catch (e) {
		throw Error("readExcel -> " + (e as Error).message);
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
		throw Error("findCollaborator -> " + (e as Error).message);
	}
}

function findPosition(collaboratorId: number): any {
	try {
		const queryStr = `for $elem in positions where $elem/basic_collaborator_id = ${collaboratorId} return $elem`;
		const objArray = tools.xquery(queryStr);

		return ArrayOptFirstElem(objArray);
	} catch (e) {
		throw Error("findPosition -> " + (e as Error).message);
	}
}

function createOrUpdatePersonCard(cardData: IColl): void {
	try {
		const existingCollab = findCollaborator(cardData.code, cardData.login);

		let collabDoc: any;
		let collaboratorId: number;
		let isNewCollab = false;

		if (existingCollab != undefined) {
			collabDoc = tools.open_doc(existingCollab.id);
			collaboratorId = existingCollab.id;

			log(
				`Обновление сотрудника: ${cardData.lastname} (ID: ${collaboratorId})`,
				"info",
			);
		} else {
			collabDoc = tools.new_doc_by_name("collaborator", false);
			collabDoc.BindToDb();
			isNewCollab = true;

			log(`Создание нового сотрудника: ${cardData.lastname}`, "info");
		}

		collabDoc.TopElem.code = cardData.code;
		collabDoc.TopElem.login = cardData.login;
		collabDoc.TopElem.lastname = cardData.lastname;
		collabDoc.TopElem.middlename = cardData.middlename;
		collabDoc.TopElem.firstname = cardData.firstname;
		collabDoc.TopElem.sex = cardData.sex;
		collabDoc.TopElem.position_name = cardData.position_name;

		collabDoc.Save();

		if (isNewCollab) {
			collaboratorId = collabDoc.TopElem.id;
			log(
				`Создан сотрудник: ${cardData.lastname} (ID: ${collaboratorId})`,
				"info",
			);
		}

		if (cardData.position_name !== "") {
			try {
				const existingPosition = findPosition(collaboratorId);

				let posDoc: any;
				let positionId: number;

				if (existingPosition != undefined) {
					posDoc = tools.open_doc(existingPosition.id);
					positionId = existingPosition.id;

					log(
						`Обновление должности для ${cardData.lastname} (ID: ${positionId})`,
						"info",
					);
				} else {
					posDoc = tools.new_doc_by_name("position", false);
					posDoc.BindToDb();

					log(`Создание новой должности для ${cardData.lastname}`, "info");
				}

				posDoc.TopElem.name = cardData.position_name;
				posDoc.TopElem.basic_collaborator_id = collaboratorId;
				posDoc.TopElem.position_date = Date();

				posDoc.Save();

				if (existingPosition == undefined) {
					positionId = posDoc.TopElem.id;
					log(
						`Создана должность: ${cardData.position_name} (ID: ${positionId})`,
						"info",
					);
				}

				collabDoc.TopElem.position_id = positionId;
				collabDoc.TopElem.position_name = posDoc.TopElem.name;
				collabDoc.TopElem.position_date = posDoc.TopElem.position_date;

				collabDoc.Save();
			} catch (posError) {
				log(
					`Ошибка работы с должностью для ${cardData.lastname}: ${(posError as Error).message}`,
					"error",
				);
			}
		}
	} catch (e) {
		throw new Error(
			`Ошибка обработки карточки для ${cardData.login}: ${(e as Error).message}`,
		);
	}
}

function main() {
	try {
		if (FILE_IMPORT == undefined || FILE_IMPORT === 0) {
			log(
				"Ошибка: необходимо указать ссылку на файл в параметрах агента.",
				"error",
			);

			return;
		}

		const docImportFile = tools.open_doc(FILE_IMPORT);

		if (docImportFile == undefined) {
			log("Ошибка: файл не найден в системе.", "error");

			return;
		} else if (
			!StrContains(UrlPathSuffix(docImportFile.TopElem.file_name), ".xls")
		) {
			log("Ошибка: необходимо выбрать файл '.xls' или '.xlsx'", "error");

			return;
		}

		const sTempFileUrl = ObtainSessionTempFile(
			StrLowerCase(UrlPathSuffix(docImportFile.TopElem.file_url)),
		);
		docImportFile.TopElem.get_data(sTempFileUrl);

		Sleep(1000);

		readExcel(sTempFileUrl);
	} catch (e) {
		log(
			"Выполнение прервано из-за ошибки: main -> " + (e as Error).message,
			"error",
		);
	}
}

log("--- Начало. #55435 Агент импорта сотрудников из файла Excel ---");
main();
log("--- Конец. #55435 Агент импорта сотрудников из файла Excel ---");

export {};
