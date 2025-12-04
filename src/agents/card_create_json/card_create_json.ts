const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
	parentSectionId: OptInt(Param.parentSectionId),
};

interface IError {
	code: number;
	message: string;
}

interface IJson {
	date: string;
	name: string;
	desc: string;
	group: string;
}

/**
 * Создает поток ошибки с объектом error
 * @param {string} source - источник ошибки
 * @param {object} errorObject - объект ошибки
 */
function HttpError(source: string, errorObject: IError): never {
	throw new Error(source + " -> " + errorObject.message);
}

/**
 * Читает данные из JSON файла
 * @returns {IJson[]} массив данных из JSON
 */
function readJSONFile(): IJson[] {
	try {
		const jsonData = tools.read_object<IJson[]>(
			LoadFileData(UrlToFilePath("x-local://wt/web/exampleJSON.json")),
		);

		if (jsonData === undefined || jsonData === null) {
			HttpError("readJSONFile", {
				code: 400,
				message: "Файл JSON не найден",
			});
		}

		log(
			`Успешно прочитан JSON файл. Найдено записей: ${jsonData.length}`,
			"info",
		);

		return jsonData;
	} catch (error) {
		HttpError("readJSONFile", {
			code: 500,
			message: error instanceof Error ? error.message : String(error),
		});
	}
}

/**
 * Создает карточку раздела портала из данных JSON
 * @param {IJson} cardData - данные карточки из JSON
 * @param {string} parentSectionId - ID родительского раздела портала
 */
function createPortalCard(cardData: IJson, parentSectionId: number): void {
	try {
		const newCard = tools.new_doc_by_name<DocumentDocument>("document");

		newCard.BindToDb();

		newCard.TopElem.name.Value = cardData.name;
		newCard.TopElem.text_area.Value = cardData.desc;

		newCard.TopElem.create_date.Value = Date();

		if (cardData.group) {
			const accessGroup = newCard.TopElem.access.access_groups.Add();
			accessGroup.group_id.Value = OptInt(cardData.group);
		}

		if (!IsEmptyValue(parentSectionId)) {
			newCard.TopElem.parent_document_id.Value = parentSectionId;
		}

		newCard.Save();

		log(
			`Успешно создана карточка: ${cardData.name} (ID: ${newCard.TopElem.id})`,
			"info",
		);
	} catch (error) {
		HttpError("createPortalCard", {
			code: 500,
			message: error instanceof Error ? error.message : String(error),
		});
	}
}

function main() {
	try {
		const jsonData = readJSONFile();
		const parentSectionId = GLOBAL.parentSectionId;

		for (const cardData of jsonData) {
			createPortalCard(cardData, parentSectionId);
		}
	} catch (error) {
		log("Выполнение прервано из-за ошибки: main -> " + error.message, "error");
	}
}

const logConfig = {
	code: "globex_log",
	type: "AGENT",
	agentId: "7220634631655119450",
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

log(
	"--- Начало. Агент #55435.Агент «Создание карточек раздела портала из файла json». ---",
);

main();

log(
	"--- Конец. Агент #55435.Агент «Создание карточек раздела портала из файла json». ---",
);

export {};
