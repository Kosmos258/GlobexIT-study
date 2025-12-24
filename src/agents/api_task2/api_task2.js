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
 * @returns {string} JSON-строка с объектом GetEmployeesResult
 */

function Get_All_Employees() {
	var oRes = {
		array: [],
	};

	try {
		var xarrCollaborators = tools.xquery(
			"for $elem in collaborators return $elem",
		);
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
 * @function Import_Employees
 * @memberof Websoft.WT.Person_API
 * @description Обработка массива данных для создания или обновления сотрудников.
 * @param {string} employeesJson - JSON строка с массивом объектов
 * @returns {string} JSON-строка результата
 */

function Import_Employees(employeesJson) {
	var result = {
		success: true,
		created: 0,
		updated: 0,
		errors: [],
	};

	try {
		var arrData;

		if (employeesJson == undefined || employeesJson == "") {
			arrData = [];
		} else {
			try {
				arrData = tools.read_object(employeesJson, "json");
			} catch (e) {
				throw "Невалидный JSON формат";
			}
		}

		if (!IsArray(arrData)) {
			throw "Входные данные не являются массивом";
		}

		for (var i = 0; i < arrData.length; i++) {
			try {
				var employee = arrData[i];

				if (employee.code == undefined || String(employee.code) == "") {
					result.errors.push({
						index: i,
						message: "Отсутствует код сотрудника",
					});
					continue;
				}

				var docCollaborator;
				var isNew = false;

				try {
					var query =
            "for $elem in collaborators where $elem/code = '" +
            employee.code +
            "' return $elem";

					var existingArray = tools.xquery(query);
					var existingItem = ArrayOptFirstElem(existingArray);

					if (existingItem != undefined) {
						var docId = Int(existingItem.id);

						docCollaborator = tools.open_doc(docId);

						if (docCollaborator == undefined) {
							throw (
								"Документ с ID " + docId + " найден в базе, но не открывается"
							);
						}

						isNew = false;
					} else {
						docCollaborator = tools.new_doc_by_name("collaborator", false);
						docCollaborator.BindToDb(DefaultDb);
						isNew = true;
					}
				} catch (docError) {
					result.errors.push({
						index: i,
						code: employee.code,
						step: "open_or_create_doc",
						message: String(docError),
					});
					continue;
				}

				try {
					var te = docCollaborator.TopElem;

					if (employee.code != undefined) {
						te.code = employee.code;
					}

					if (
						employee.fullname != undefined &&
            String(employee.fullname) != ""
					) {
						var parts = String(employee.fullname).split(" ");
						if (parts.length > 0) te.lastname = parts[0];
						if (parts.length > 1) te.firstname = parts[1];
						if (parts.length > 2) {
							var mName = "";
							for (var k = 2; k < parts.length; k++) {
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
						message: String(fillError),
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
						message: String(saveError),
					});
					continue;
				}
			} catch (itemError) {
				var errCode =
          arrData[i] && arrData[i].code ? arrData[i].code : "unknown";
				result.errors.push({
					index: i,
					code: errCode,
					step: "general",
					message: String(itemError),
				});
			}
		}

		if (result.errors.length > 0) {
			result.success = false;
		}
	} catch (error) {
		result.success = false;
		result.errors.push({
			message: "Критическая ошибка: " + String(error),
		});
	}

	return result;
}
