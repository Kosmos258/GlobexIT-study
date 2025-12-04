interface IError {
	code: number;
	message: string;
}

const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
	ID_TEMPLATE: String(Param.ID_TEMPLATE),
};

const logConfig = {
	code: "globex_log",
	type: "AGENT",
	agentId: "7220634631655119588",
};

EnableLog(logConfig.code, GLOBAL.IS_DEBUG);

/**
 * Создает поток ошибки с объектом error
 * @param {string} source - источник ошибки
 * @param {object} errorObject - объект ошибки
 */
function HttpError(source: string, errorObject: IError): never {
	throw new Error(source + " -> " + errorObject.message);
}

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

interface InfoPers {
	id: XmlElem<number>;
	manager_id: XmlElem<number>;
}

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

function findAndSendPerson(): InfoPers[] {
	try {
		const persons = selectAll<InfoPers>(`
            SELECT 
				c.id AS id,
				c.hire_date,
				(xpath('//func_managers/func_manager/person_id/text()', collab.data))[1]::text AS manager_id
			FROM dbo.collaborators c
			JOIN dbo.collaborator collab ON c.id = collab.id
			WHERE c.hire_date = CURRENT_DATE - 1
			OR c.hire_date = CURRENT_DATE;
        `);

		const result = persons.map((item) => ({
			id: item.id.Value,
			manager_id: item.manager_id.Value,
		}));

		if (result.length === 0) {
			log("Сотрудники не найдены");
		} else {
			for (const person of result) {
				const personId = OptInt(person.id);
				const managerId = OptInt(person.manager_id);

				tools.create_notification(GLOBAL.ID_TEMPLATE, personId, "", managerId);

				log(`Уведомление отправлено сотруднику ${personId} ${
					managerId ? "с руководителем " + managerId : "без руководителя"
				}`);
			}
			log(`Найдено сотрудников и отправлено уведомлений: ${result.length}`);
		}

		return;
	} catch (error) {
		HttpError("findAndSendPerson", {
			code: 400,
			message: error.message,
		});
	}
}

function main() {
	findAndSendPerson();
}

log("--- Начало. #55435 Агент отправки уведомления новым сотрудникам ---");

main();

log("--- Конец. #55435 Агент отправки уведомления новым сотрудникам ---");

export {};
