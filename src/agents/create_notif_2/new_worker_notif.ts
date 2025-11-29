interface IError {
	code: number;
	message: string;
}

const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
	ID_TEMPLATE: String(Param.ID_TEMPLATE),
	ID_TEMPLATE_BOSS: String(Param.ID_TEMPLATE_BOSS),
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

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

interface InfoPers {
	person_id: number;
	manager_id: number;
	obj_fullname: string;
	per_fullname: string;
}

function findAndSendPerson(): InfoPers[] {
	try {
		const histState = selectAll<InfoPers>(`
			SELECT
				c.id as person_id,
				fm.object_name as obj_fullname,
				fm.person_id as manager_id,
				fm.person_fullname as per_fullname
			FROM dbo.collaborators c
			LEFT JOIN dbo.func_managers fm ON c.id = fm.object_id
			WHERE c.hire_date = CURRENT_DATE
			   OR c.hire_date = CURRENT_DATE - 1
		`);

		const result: InfoPers[] = histState.map((item) => ({
			person_id: RValue(item.person_id),
			obj_fullname: RValue(item.obj_fullname),
			manager_id: RValue(item.manager_id),
			per_fullname: RValue(item.per_fullname),
		}));

		if (result.length === 0) {
			log("Сотрудники не найдены");
		} else {
			for (const person of result) {
				tools.create_notification(
					GLOBAL.ID_TEMPLATE,
					person.person_id,
					"",
					person.manager_id,
				);
				log("Уведомление отправлено сотруднику " + person.person_id);
			}

			const managerGroups: Array<{ managerId: number; employees: string[]; }> = [];

			for (const item of result) {
				let found = false;
				for (const group of managerGroups) {
					if (group.managerId === item.manager_id) {
						group.employees.push(item.obj_fullname);
						found = true;
						break;
					}
				}

				if (!found) {
					managerGroups.push({
						managerId: item.manager_id,
						employees: [item.obj_fullname],
					});
				}
			}

			log("Количество групп руководителей: " + managerGroups.length);

			for (const group of managerGroups) {
				const employeesList = group.employees.join("\n");

				log("Отправка руководителю ID: " + group.managerId);
				log("Сотрудники: " + group.employees.join(", "));

				tools.create_notification(
					GLOBAL.ID_TEMPLATE_BOSS,
					group.managerId,
					employeesList,
				);
				log("Уведомление отправлено руководителю " + group.managerId);
			}
		}

		return result;
	} catch (error) {
		log("КРИТИЧЕСКАЯ ОШИБКА: " + error);
		HttpError("NotFoundPers", {
			code: 400,
			message: "error",
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
