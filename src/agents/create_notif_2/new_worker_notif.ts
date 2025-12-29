interface IError {
	code: number;
	message: string;
}

const GLOBAL = {
	IS_DEBUG: tools_web.is_true(Param.IS_DEBUG),
	ID_TEMPLATE: OptInt(Param.ID_TEMPLATE),
	ID_TEMPLATE_BOSS: OptInt(Param.ID_TEMPLATE_BOSS),
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
	person_id: XmlElem<number>;
	manager_id: XmlElem<number>;
	obj_fullname: XmlElem<string>;
	per_fullname: XmlElem<string>;
}

function findAndSendPerson(): InfoPers[] {
	try {
		const newCollaborators = selectAll<InfoPers>(`
			SELECT
				coll.id as person_id,
				fm.object_name as obj_fullname,
				fm.person_id as manager_id,
				fm.person_fullname as per_fullname
			FROM dbo.collaborators coll
			LEFT JOIN dbo.func_managers fm 
			ON coll.id = fm.object_id
			WHERE coll.hire_date = CURRENT_DATE
			OR coll.hire_date = CURRENT_DATE - 1;
		`);

		const result: InfoPers[] = newCollaborators.map((item) => ({
			person_id: item.person_id.Value,
			obj_fullname: item.obj_fullname.Value,
			manager_id: item.manager_id.Value,
			per_fullname: item.per_fullname.Value,
		}));


		for (const person of result) {
			tools.create_notification(
				GLOBAL.ID_TEMPLATE,
				person.person_id,
				"",
				person.manager_id,
			);
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


		for (const group of managerGroups) {
			const employeesList = group.employees.join("\n");

			tools.create_notification(
				GLOBAL.ID_TEMPLATE_BOSS,
				group.managerId,
				employeesList,
			);

		}

		return result;
	} catch (error) {
		HttpError("findAndSendPerson", {
			code: 400,
			message: "Ошибка -> " + error.message,
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
