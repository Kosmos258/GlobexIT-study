/**
 * @namespace Websoft.WT.Person_API
 * @description API для работы со списком сотрудников
 */

/**
 * @property {bigint} id - ID сотрудника
 * @property {string} code - Код сотрудника
 * @property {string} fullname - Полное имя
 * @property {string} login - Логин
 * @property {string} email - Email
 * @property {string} position_name - Название должности
 */

/**
 * @function GetAllUsers
 * @memberof Websoft.WT.Person_API
 * @description Получение списка сотрудников.
 * @returns {string} JSON-строка с объектом
 */

function GetAllUsers() {
	var oRes = {
		array: [],
	};

	try {
		var xarrCollaborators = tools.xquery(
			"for $elem in collaborators return $elem",
		);
		var collaborator, objItem;

		for (collaborator in xarrCollaborators) {
			objItem = {
				id: collaborator.id.Value,
				code: collaborator.code.Value,
				fullname: collaborator.fullname.Value,
				login: collaborator.login.Value,
				email: collaborator.email.Value,
				position_name: collaborator.position_name.Value,
			};
			oRes.array.push(objItem);
		}
	} catch (e) {
		throw new Error("GetAllUsers -> " + e.message);
	}

	return oRes;
}

/**
 * @typedef {Object} EmployeeEntry
 * @typedef {number} integer
 * @typedef {number} int
 * @description Добавление сотрудников из массива JSON
 * @property {string} code - Код сотрудника (обязательно)
 * @property {string} fullname - ФИО сотрудника
 * @property {string} login - Логин сотрудника
 * @property {string} password - Пароль сотрудника
 * @property {number} query - ID искомого документа
 */

/**
 * @typedef {Object} ImportResult
 * @property {number} created - Количество созданных записей
 * @property {number} updated - Количество обновленных записей
 */

/**
 * @function ImportAndUpdateUsers
 * @memberof Websoft.WT.Person_API
 * @description Обработка данных для создания или обновления сотрудников. Принимает массив или объект {employees: []}.
 * @param {Object|EmployeeEntry[]|string} employees - Массив, Объект-обертка или JSON-строка
 * @returns {ImportResult} Результат импорта
 */

function ImportAndUpdateUsers(employees) {
	var result = {
		created: 0,
		updated: 0,
	};

	var arrData;
	var i, k;
	var docCollaborator, isNew;
	var query;
	var te, parts, mName;

	try {
		arrData = employees;

		if (!IsArray(arrData)) {
			throw new Error(
				"Входные данные не являются массивом. Type:-> " + DataType(employees),
			);
		}

		if (ArrayCount(arrData) == 0) {
			throw new Error(
				"Входящий массив пуст. Проверьте передаваемые данные -> " + e.message,
			);
		}

		for (i in arrData) {

			if (i.code == undefined || i.code == "") {
				throw new Error(
					"Отсутствует код сотрудника (поле 'code') -> " + e.message,
				);
			}

			isNew = false;
			docCollaborator = undefined;

			try {
				query = ArrayOptFirstElem(
					tools.xquery(
						"for $elem in collaborators where $elem/code = '" +
                i.code +
                "' return $elem",
					),
				);

				if (query != undefined) {
					docCollaborator = tools.open_doc(query.id);

					isNew = false;
				} else {
					docCollaborator = tools.new_doc_by_name("collaborator", false);
					docCollaborator.BindToDb();
					isNew = true;
				}
			} catch (docError) {
				throw new Error("open_or_create_doc -> " + e.message);
			}

			te = docCollaborator.TopElem;
			parts = i.fullname.split(" ");
			if (parts.length > 0) te.lastname = parts[0];
			if (parts.length > 1) te.firstname = parts[1];
			if (parts.length > 2) {
				mName = "";
				for (k = 2; k < parts.length; k++) {
					mName += (mName == "" ? "" : " ") + parts[k];
				}
				te.middlename = mName;
				te.login = i.login;
				te.password = i.password;
			}

			try {
				docCollaborator.Save();

				if (isNew) {
					result.created++;
				} else {
					result.updated++;
				}
			} catch (saveError) {
				throw new Error("save_doc -> " + e.message);
			}
		}

	} catch (e) {
		throw new Error("ImportAndUpdateUsers -> " + e.message);
	}

	return result;
}
