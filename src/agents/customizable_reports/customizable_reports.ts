const FILTERED_GROUP = { PARAM1 };

interface Pers {
	employee_id: XmlElem<string>;
	employee_code: XmlElem<string>;
	employee_fullname: XmlElem<string>;
	employee_email: XmlElem<string>;
	employee_position: XmlElem<string>;
	employee_department: XmlElem<string>;
	manager_name: XmlElem<string>;
	manager_position: XmlElem<string>;
	manager_email: XmlElem<string>;
}

function selectAll<T>(query: string) {
	return ArraySelectAll<T>(tools.xquery(`sql: ${query}`));
}

try {
	const getSQL = selectAll<Pers>(`
        SELECT DISTINCT
			cs.id as employee_id,
			cs.code as employee_code,
			cs.fullname as employee_fullname,
			cs.email as employee_email,
			cs.position_name as employee_position,
			cs.position_parent_name as employee_department,
			fms.person_fullname as manager_name,
			manager.position_name as manager_position,
			manager.email as manager_email
		FROM dbo.collaborators cs
		INNER JOIN dbo.group_collaborators gcs
			ON cs.id = gcs.collaborator_id
			AND gcs.group_id = ${FILTERED_GROUP}
		INNER JOIN dbo.func_managers fms 
			ON cs.id = fms.object_id 
			AND fms.catalog = 'collaborator'
		LEFT JOIN dbo.collaborators manager 
			ON manager.id = fms.person_id;
`);

	const aRes: any[] = [];

	for (const respElem of getSQL) {
		const r: any = {};

		r.PrimaryKey = respElem.employee_id;

		r.employee_id = respElem.employee_id + "";
		r.employee_code = respElem.employee_code + "";
		r.employee_fullname = respElem.employee_fullname + "";
		r.employee_email = respElem.employee_email + "";
		r.employee_position = respElem.employee_position + "";
		r.employee_department = respElem.employee_department + "";
		r.manager_name = respElem.manager_name + "";
		r.manager_position = respElem.manager_position + "";
		r.manager_email = respElem.manager_email + "";

		aRes.push(r);
	}

	columns.Clear();

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "employee_id";
	column.column_value = "ListElem.employee_id";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "employee_code";
	column.column_value = "ListElem.employee_code";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "employee_fullname";
	column.column_value = "ListElem.employee_fullname";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "employee_email";
	column.column_value = "ListElem.employee_email";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "employee_position";
	column.column_value = "ListElem.employee_position";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "employee_department";
	column.column_value = "ListElem.employee_department";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "manager_name";
	column.column_value = "ListElem.manager_name";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "manager_position";
	column.column_value = "ListElem.manager_position";
	column.datatype = "string";

	column = columns.AddChild();
	column.flag_formula = true;
	column.column_title = "manager_email";
	column.column_value = "ListElem.manager_email";
	column.datatype = "string";

	return aRes;
} catch (error) {
	throw new Error(error.message);
}
