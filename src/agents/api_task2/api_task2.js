/**
 * @namespace Websoft.WT.Person_API
 * @description API для работы со списком сотрудников
 */

/**
 * @typedef {Object} Employee
 * @property {bigint} id - ID сотрудника
 * @property {string} code - Код сотрудника
 * @property {string} fullname - Полное имя
 * @property {string} login - Логин
 * @property {string} email - Email
 * @property {string} position_name - Название должности
 */

/**
 * @typedef {Object} GetEmployeesResult
 * @property {number} error – код ошибки (0 - успешно)
 * @property {string} errorText – текст ошибки
 * @property {boolean} result – результат выполнения
 * @property {Employee[]} array – массив сотрудников
 */

/**
 * @function Get_All_Employees
 * @memberof Websoft.WT.Person_API
 * @description Получение списка сотрудников.
 * @returns {string} JSON-строка с объектом GetEmployeesResult
 */
function Get_All_Employees() {
	var oRes = {
		array: [],
	};

	try {
		var xarrCollaborators = tools.xquery("for $elem in collaborators return $elem");
		var catCollaborator, objItem;

		for (catCollaborator in xarrCollaborators) {
			objItem = {
				id: String(catCollaborator.id.Value),
				code: String(catCollaborator.code.Value),
				fullname: String(catCollaborator.fullname.Value),
				login: String(catCollaborator.login.Value),
				email: String(catCollaborator.email.Value),
				position_name: String(catCollaborator.position_name.Value),
			};
			oRes.array.push(objItem);
		}
	} catch (err) {
		throw new Error("Ошибка запроса сотрудников");

	}

	return oRes;
}