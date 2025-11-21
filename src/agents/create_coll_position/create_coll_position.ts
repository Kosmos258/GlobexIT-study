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

const FILE_IMPORT = OptInt(Param.FILE_IMPORT);
const IS_DEBUG = tools_web.is_true(true);

interface IColl {
	code: string;
	login: string;
	lastname: string;
	firstname: string;
	middlename: string;
	sex: string;
	position_name: string;
}

const logConfig = {
	code: "globex_log",
	type: "AGENT",
	agentId: "",
};

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

function log(message: any, type?: string) {
	type = IsEmptyValue(type) ? "INFO" : StrUpperCase(type!);

	if (
		ObjectType(message) === "JsObject" ||
		ObjectType(message) === "JsArray" ||
		ObjectType(message) === "XmLdsSeq"
	) {
		message = tools.object_to_text(message, "json");
	}

	const logStr = `[${type}][${logConfig.type}][${logConfig.agentId}]: ${message}`;

	if (LdsIsServer) {
		LogEvent(logConfig.code, logStr);
	} else if (IS_DEBUG) {
		// eslint-disable-next-line no-alert
		alert(logStr);
	}
}

function createPersonCard(cardData: IColl): void {
	try {
		const newCollabDoc = tools.new_doc_by_name("collaborator", false);
		newCollabDoc.BindToDb();

		newCollabDoc.TopElem.code = cardData.code;
		newCollabDoc.TopElem.login = cardData.login;
		newCollabDoc.TopElem.lastname = cardData.lastname;
		newCollabDoc.TopElem.middlename = cardData.middlename;
		newCollabDoc.TopElem.firstname = cardData.firstname;
		newCollabDoc.TopElem.sex = cardData.sex;

		newCollabDoc.TopElem.position_name = cardData.position_name;

		newCollabDoc.Save();
		const collaboratorId = newCollabDoc.TopElem.id;

		log(
			`Создан сотрудник: ${cardData.lastname} (ID: ${collaboratorId})`,
			"info",
		);

		if (cardData.position_name !== "") {
			try {
				const newPosDoc = tools.new_doc_by_name("position", false);
				newPosDoc.BindToDb();

				newPosDoc.TopElem.name = cardData.position_name;
				newPosDoc.TopElem.basic_collaborator_id = collaboratorId;
				newPosDoc.TopElem.position_date = Date();

				newPosDoc.Save();
				const positionId = newPosDoc.TopElem.id;

				log(
					`Создана должность: ${cardData.position_name} (ID: ${positionId})`,
					"info",
				);

				newCollabDoc.TopElem.position_id = positionId;
				newCollabDoc.TopElem.position_name = newPosDoc.TopElem.name;
				newCollabDoc.TopElem.position_date = newPosDoc.TopElem.position_date;

				newCollabDoc.Save();
			} catch (posError) {
				log(
					`Ошибка создания должности для ${cardData.lastname}: ${(posError as Error).message
					}`,
					"error",
				);
			}
		}
	} catch (e) {
		throw new Error(
			`Ошибка создания карточки для ${cardData.login}: ${(e as Error).message}`,
		);
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
					code === "" &&
					login === "" &&
					lastname === "" &&
					firstname === ""
				) {
					bEmptyRows = true;
				} else {
					try {
						createPersonCard({
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

export { };