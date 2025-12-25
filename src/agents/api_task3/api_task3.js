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
 * @function Get_All_Employees
 * @memberof Websoft.WT.Person_API
 * @description Получение списка сотрудников.
 * @returns {string} JSON-строка с объектом
 */

function Get_All_Employees() {
	var oRes = {
		array: [],
	};

	try {
		var xarrCollaborators = tools.xquery("for $elem in collaborators return $elem");
		var Collaborator, objItem;

		for (Collaborator in xarrCollaborators) {
			objItem = {
				id: Collaborator.id.Value,
				code: Collaborator.code.Value,
				fullname: Collaborator.fullname.Value,
				login: Collaborator.login.Value,
				email: Collaborator.email.Value,
				position_name: Collaborator.position_name.Value,
			};
			oRes.array.push(objItem);
		}
	} catch (err) {
		throw new Error("Ошибка запроса сотрудников");
	}

	return oRes;
}

/**
 * @typedef {Object} EmployeeEntry
 * @description Структура объекта сотрудника во входном массиве
 * @property {string} code - Код сотрудника (обязательно)
 * @property {string} fullname - ФИО сотрудника
 * @property {string} login - Логин сотрудника
 * @property {string} password - Пароль сотрудника
 */

/**
 * @typedef {Object} ImportResult
 * @property {boolean} success - Успешность операции
 * @property {number} created - Количество созданных записей
 * @property {number} updated - Количество обновленных записей
 * @property {Object[]} errors - Массив ошибок
 */

/**
 * @function Import_Employees
 * @memberof Websoft.WT.Person_API
 * @description Обработка данных для создания или обновления сотрудников. Принимает массив или объект {employees: []}.
 * @param {Object|EmployeeEntry[]|string} employees - Массив, Объект-обертка или JSON-строка
 * @returns {ImportResult} Результат импорта
 */
function Import_Employees(employees) {
	var result = {
		success: true,
		created: 0,
		updated: 0,
		errors: [],
	};

	var arrData;
	var i, k;
	var employee;
	var docCollaborator, isNew, docId;
	var query;
	var te, parts, mName;
	var errCode;

	try {
		arrData = employees;

		if (DataType(arrData) == "string" && arrData != "") {
			try {
				arrData = tools.read_object(arrData);
			} catch (parseError) {
				throw "Ошибка парсинга JSON: " + parseError;
			}
		}

		if (
			DataType(arrData) == "object" &&
      !IsArray(arrData) &&
      arrData != undefined &&
      arrData.employees != undefined
		) {
			arrData = arrData.employees;
		}

		if (arrData == undefined) {
			arrData = [];
		}

		if (!IsArray(arrData)) {
			throw "Входные данные не являются массивом. Type: " + DataType(employees);
		}

		if (ArrayCount(arrData) == 0) {
			result.success = false;
			result.errors.push({
				message: "Входящий массив пуст. Проверьте передаваемые данные.",
			});

			return result;
		}

		for (i = 0; i < arrData.length; i++) {
			try {
				employee = arrData[i];

				if (employee.code == undefined || employee.code == "") {
					result.errors.push({
						index: i,
						message: "Отсутствует код сотрудника (поле 'code')",
					});
					continue;
				}

				isNew = false;
				docCollaborator = undefined;

				try {
					query = ArrayOptFirstElem(tools.xquery("for $elem in collaborators where $elem/code = '" + employee.code + "' return $elem"));

					if (query != undefined) {
						docId = Int(query.id);
						docCollaborator = tools.open_doc(docId);

						if (docCollaborator == undefined) {
							throw "Документ с ID " + docId + " найден, но не открывается";
						}
						isNew = false;
					} else {
						docCollaborator = tools.new_doc_by_name("collaborator", false);
						docCollaborator.BindToDb();
						isNew = true;
					}
				} catch (docError) {
					result.errors.push({
						index: i,
						code: employee.code,
						step: "open_or_create_doc",
						message: docError,
					});
					continue;
				}

				try {
					te = docCollaborator.TopElem;

					if (employee.code != undefined) {
						te.code = employee.code;
					}

					if (
						employee.fullname != undefined &&
            employee.fullname != ""
					) {
						parts = employee.fullname.split(" ");
						if (parts.length > 0) te.lastname = parts[0];
						if (parts.length > 1) te.firstname = parts[1];
						if (parts.length > 2) {
							mName = "";
							for (k = 2; k < parts.length; k++) {
								mName += (mName == "" ? "" : " ") + parts[k];
							}
							te.middlename = mName;
						}
					}

					if (employee.login != undefined) {
						te.login = employee.login;
					}

					if (employee.password != undefined) {
						te.password = employee.password;
					}
				} catch (fillError) {
					result.errors.push({
						index: i,
						code: employee.code,
						step: "fill_fields",
						message: fillError,
					});
					continue;
				}

				try {
					docCollaborator.Save();

					if (isNew) {
						result.created++;
					} else {
						result.updated++;
					}
				} catch (saveError) {
					result.errors.push({
						index: i,
						code: employee.code,
						step: "save_doc",
						message: saveError,
					});
					continue;
				}
			} catch (itemError) {
				errCode = arrData[i] && arrData[i].code ? arrData[i].code : "unknown";
				result.errors.push({
					index: i,
					code: errCode,
					step: "general",
					message: itemError,
				});
			}
		}

		if (result.errors.length > 0) {
			result.success = false;
		}
	} catch (error) {
		result.success = false;
		result.errors.push({
			message: "Критическая ошибка: " + error,
		});
	}

	return result;
}
