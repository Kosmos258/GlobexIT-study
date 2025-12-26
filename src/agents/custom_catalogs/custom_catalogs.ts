const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
	FILE_IMPORT: OptInt(Param.FILE_IMPORT),
	GROUP_ID: OptInt(Param.GROUP_ID),
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

interface ICollaboratorId {
	id: number;
}

interface IGroupCollaborator {
	collaborator_id: number;
}

/**
 * Создает поток ошибки с объектом error
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

	const logText = `[${type}][${logConfig.type}][${logConfig.agentId}]: ${message}`;
	if (LdsIsServer) {
		LogEvent(logConfig.code, logText);
	} else if (GLOBAL.IS_DEBUG) {
		alert(logText);
	}
}

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

/**
 * Получение id сотрудника по code (из Excel)
 */
function getCollaboratorIdByCode(code: string): number | null {
	const rows = selectAll<ICollaboratorId>(`
		SELECT 
			id
		FROM dbo.collaborators
		WHERE code = '${code}';
	`);

	return rows.length ? OptInt(rows[0].id) : null;
}

/**
 * Проверка: состоит ли сотрудник в группе
 */
function isCollaboratorInGroup(groupId: number, collaboratorId: number): boolean {
	const rows = selectAll<IGroupCollaborator>(`
		SELECT 
			collaborator_id
		FROM dbo.group_collaborators
		WHERE group_id = ${groupId}
		AND collaborator_id = ${collaboratorId};
	`);

	return rows.length > 0;
}

/**
 * Проверка сотрудника по code
 */
function isCollaboratorAllowed(code: string): boolean {
	if (IsEmptyValue(code)) {
		return false;
	}

	const collaboratorId = getCollaboratorIdByCode(code);
	if (collaboratorId == null) {
		return false;
	}

	return isCollaboratorInGroup(GLOBAL.GROUP_ID, collaboratorId);
}

function loadExcel(sFileUrl: string) {
	try {
		const filePath = UrlToFilePath(sFileUrl);
		const excel = tools.get_object_assembly("Excel");
		excel.Open(filePath);

		const worksheet = excel.GetWorksheet(0);

		return worksheet.Cells;
	} catch (e) {
		HttpError("loadExcel", {
			code: 500,
			message: `Ошибка загрузки Excel: ${e.message}`,
		});
	}
}

function getCellValue(cells: any, row: number, col: number): string {
	try {
		let columnName = "";
		let index = col;

		while (index >= 0) {
			columnName = String.fromCharCode(65 + (index % 26)) + columnName;
			index = OptInt(index / 26) - 1;
		}

		const cell = cells.GetCell(columnName + (row + 1));
		if (!cell || cell.Value == null) return "";

		const value = Trim(String(cell.Value));

		return value === "undefined" ? "" : value;
	} catch (e) {
		HttpError("getCellValue", {
			code: 404,
			message: `Ошибка чтения ячейки [${row}, ${col}]: ${e.message}`,
		});

		return "";
	}
}

function readExcel(sFileUrl: string) {
	try {
		const cells = loadExcel(sFileUrl);

		let row = 1;
		const processedLogins: string[] = [];

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const codeExcel = getCellValue(cells, row, 0);
			if (!codeExcel) break;

			try {
				const personData: IColl = {
					code: codeExcel,
					login: getCellValue(cells, row, 1),
					fullname: getCellValue(cells, row, 2),
					code_position: getCellValue(cells, row, 3),
					position_name: getCellValue(cells, row, 4),
					code_group: getCellValue(cells, row, 5),
				};

				if (!isCollaboratorAllowed(personData.code)) {
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
	const query =
		`for $e in cc_adaptation_catalogs
		 where $e/code_cc = '${code_cc}'
		   and $e/login_cc = '${login_cc}'
		 return $e`;

	const result = tools.xquery(query);

	return ArrayOptFirstElem(result);
}

function createOrUpdateCollaborator(cardData: IColl) {
	const exists = findCollaborator(cardData.code, cardData.login);
	if (exists) {
		log(`Карточка ${cardData.login} уже существует`, "info");

		return;
	}

	const doc: CcAdaptationCatalogDocument =
		tools.new_doc_by_name("cc_adaptation_catalog");
	doc.BindToDb();

	doc.TopElem.code_cc.Value = cardData.code;
	doc.TopElem.login_cc.Value = cardData.login;
	doc.TopElem.full_name_cc.Value = cardData.fullname;
	doc.TopElem.code_position_cc.Value = cardData.code_position;
	doc.TopElem.name_position_cc.Value = cardData.position_name;
	doc.TopElem.code_group_cc.Value = cardData.code_group;

	doc.Save();
}

function main() {
	if (GLOBAL.FILE_IMPORT == undefined) {
		HttpError("main", {
			code: 500,
			message: "Не указан файл импорта",
		});
	}

	const doc = tools.open_doc<ResourceDocument>(GLOBAL.FILE_IMPORT);
	if (!doc) {
		log("Файл не найден", "error");

		return;
	}

	const fileUrl = doc.TopElem.file_url.Value;
	const tempUrl = ObtainSessionTempFile(StrLowerCase(UrlPathSuffix(fileUrl)));

	doc.TopElem.get_data(tempUrl);
	readExcel(tempUrl);
}

log("--- Начало импорта сотрудников ---");
main();
log("--- Конец импорта сотрудников ---");

export {};
