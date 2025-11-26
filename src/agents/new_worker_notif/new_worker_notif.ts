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
	id?: string;
	manager_id?: string;
}

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

function findAndSendPerson(): InfoPers[] {
	try {
		const histState = selectAll<InfoPers>(`
            SELECT 
                (xpath('//id/text()', data))[1]::text AS id,
                (xpath('//func_managers/func_manager/person_id/text()', data))[1]::text AS manager_id
            FROM dbo.collaborator
            WHERE (xpath('//hire_date/text()', data))[1]::text::date = CURRENT_DATE - 1
               OR (xpath('//hire_date/text()', data))[1]::text::date = CURRENT_DATE;
        `);

		const result: InfoPers[] = histState.map((item) => ({
			id: RValue(item.id),
			manager_id: RValue(item.manager_id),
		}));

		if (result.length === 0) {
			log("Сотрудники не найдены");
		} else {
			for (const person of result) {
				const personId = Int(person.id);
				const managerId = Int(person.manager_id);

				tools.create_notification(GLOBAL.ID_TEMPLATE, personId, "", managerId);

				log(`Уведомление отправлено сотруднику ${personId} ${
					managerId ? "с руководителем " + managerId : "без руководителя"
				}`);
			}
			log(`Найдено сотрудников и отправлено уведомлений: ${result.length}`);
		}

		return result;
	} catch (error) {
		HttpError("NotFoundPers", {
			code: 400,
			message: "Сотрудник не найден",
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
