/* --- types --- */
interface IError {
	code: number;
	message: string;
}

/* --- utils --- */

/**
 * Создает поток ошибки с объектом error
 * @param {string} source - источник ошибки
 * @param {object} errorObject - объект ошибки
 */
function HttpError(source: string, errorObject: IError) {
	throw new Error(source + " -> " + errorObject.message);
}

/* --- logic --- */

/**
 * Меняет пароль сотруднику по ID
 * @param {string} id - Идентификатор сотрудника
 */
function changePassword(id: string) {
	try {
		const collabDoc = tools.open_doc<CollaboratorDocument>(OptInt(id));
		if (collabDoc !== undefined) {
			const teCollab = collabDoc.TopElem;

			const newPass = tools.make_password(String(Random(10000, 100000)), true);
			teCollab.password.Value = newPass;
			collabDoc.Save();

			log(`Пароль успешно изменён для сотрудника ID: ${id}`, "info");
		} else {
			log(`Не удалось открыть документ сотрудника ID: ${id}`, "error");
		}
	} catch (e) {
		HttpError("changePassword", e);
	}
}

/* --- start point --- */
function main() {
	try {
		const idArr = OBJECTS_ID_STR.split(";");

		for (let i = 0; i < idArr.length; i++) {
			const id = idArr[i];
			if (!IsEmptyValue(id)) {
				changePassword(id);
			}
		}
	} catch (error) {
		log("Выполнение прервано из-за ошибки: main -> " + error.message, "error");
	}
}

/* --- system --- */
const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG)
};

const logConfig = {
	code: "globex_log",
	type: "AGENT",
	agentId: ""
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

log("--- Начало. Агент {Тестовый агент 1} ---");

main();

log("--- Конец. Агент {Тестовый агент 1} ---");

export { };
