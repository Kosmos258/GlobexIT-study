interface IError {
  code: number;
  message: string;
}

interface IJson {
  name: string;
  date: string;
  desc: string;
  group: string;
}

/**
 * Создает поток ошибки с объектом error
 * @param {string} source - источник ошибки
 * @param {object} errorObject - объект ошибки
 */
function HttpError(source: string, errorObject: IError) {
	throw new Error(source + " -> " + errorObject.message);
}

/**
 * Читает данные из JSON файла
 * @param {string} filePath - путь к файлу JSON
 * @returns {IJson[]} массив данных из JSON
 */
function readJSONFile(): IJson[] {
	try {
		const jsonData = tools.read_object<IJson[]>(
			LoadFileData(UrlToFilePath("x-local://wt/web/exampleJSON.json")),
		);

		if (jsonData === undefined || jsonData === null) {
			throw new Error("Не удалось прочитать данные из JSON файла");
		}

		log(
			`Успешно прочитан JSON файл. Найдено записей: ${jsonData.length}`,
			"info",
		);

		return jsonData;
	} catch (error) {
		HttpError("readJSONFile", error);
	}
}

/**
 * Создает карточку раздела портала из данных JSON
 * @param {IJson} cardData - данные карточки из JSON
 * @param {string} parentSectionId - ID родительского раздела портала
 */
function createPortalCard(cardData: IJson, parentSectionId?: string): void {
	try {
		const newCard = tools.new_doc_by_name("document", false);

		newCard.BindToDb();

		newCard.TopElem.name = cardData.name;
		newCard.TopElem.text_area = cardData.desc;

		if (cardData.date) {
			newCard.TopElem.doc_info.creation.date = cardData.date;
		}

		if (cardData.group) {
			const accessGroup =
        newCard.TopElem.access.access_groups.access_group.Add();
			accessGroup.group_id = cardData.group;
		}

		if (
			parentSectionId !== undefined &&
      parentSectionId !== null &&
      parentSectionId !== ""
		) {
			newCard.TopElem.parent_document_id = parentSectionId;
		}

		newCard.Save();

		log(
			`Успешно создана карточка: ${cardData.name} (ID: ${newCard.TopElem.id})`,
			"info",
		);
	} catch (error) {
		HttpError("createPortalCard", error);
	}
}

function main() {
	try {
		const jsonData = readJSONFile();
		const parentSectionId = "0x5F77063758493DDB";

		for (let i = 0; i < jsonData.length; i++) {
			const cardData = jsonData[i];

			createPortalCard(cardData, parentSectionId);
		}
	} catch (error) {
		log("Выполнение прервано из-за ошибки: main -> " + error.message, "error");
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
		ObjectType(message) === "JsObject" ||
    ObjectType(message) === "JsArray" ||
    ObjectType(message) === "XmLdsSeq"
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
