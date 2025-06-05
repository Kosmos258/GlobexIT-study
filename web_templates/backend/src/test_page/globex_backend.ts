/*Тестовая страница Backend*/

//=require ./modules/devmode.ts
//=require ./modules/req_headers.ts

import { log } from "./modules/log"; //.
import { IRequestBody } from "./types/RequestBody";
import { selectAll } from "./utils/query" //.

/* --- types --- */
interface ISubdivision {
	dep_id: XmlElem<number>;
	dep_name: XmlElem<string>;
	parent_object_id: XmlElem<string>;
}

interface ICollaborator {
	id: XmlElem<number>;
	fullname: XmlElem<string>;
}

/* --- utils --- */
function getParam(name: string, defaultVal: string = undefined) {
	return tools_web.get_web_param(curParams, name, defaultVal, true, "");
}

function err(source: string, error: { message: string }, text = "") {
	throw new Error(`${source} -> ${text ? text + " " : ""}${error.message}`);
}

/* --- global --- */
const curUserId: number = DEV_MODE ? OptInt("7000000000000000") : OptInt(curUserID);
const DEBUG_MODE = tools_web.is_true(getParam("IS_DEBUG", undefined))

/* --- logic --- */
type DepsType = {
	dep_id: number;
	dep_name: string;
	parent_object_id: string;
}

function getDepartments() {
	try {
		const deps = selectAll<ISubdivision>(`
      SELECT
        (xpath('//id/text()', dep))[1]::text AS dep_id,
        (xpath('//name/text()', dep))[1]::text AS dep_name,
				(xpath('//parent_object_id/text()', dep))[1]::text AS parent_object_id
			FROM dbo.subdivision s
			CROSS JOIN LATERAL unnest(
				xpath('/subdivision', s.data)
			) AS deps(dep)
    `);

		const result: DepsType[] = [];

		deps.map(item => result.push({
			dep_id: RValue(item.dep_id),
			dep_name: RValue(item.dep_name),
			parent_object_id: RValue(item.parent_object_id)
		}));

		return result;
	} catch (e) {
		err("getDepartments", e);

		return [];
	}
}

type EmployeeType = {
	id: number;
	name: string;
};

function getEmployeesByDepartmentName(depName: string): EmployeeType[] {
	try {
		const collaborators = selectAll<ICollaborator>(`
      SELECT
        id,
        fullname
      FROM dbo.collaborators
      WHERE position_parent_name = N'${depName}'
    `);

		const result: EmployeeType[] = collaborators.map(item => ({
			id: RValue(item.id),
			name: RValue(item.fullname)
		}));

		return result;
	} catch (e) {
		err("getEmployeesByDepartmentName", e);

		return [];
	}
}

function getAllEmployees() {
	try {
		const collaborators = selectAll<ICollaborator>(`
      SELECT
        id,
        fullname
      FROM dbo.collaborators
    `);

		const result: EmployeeType[] = collaborators.map(item => ({
			id: RValue(item.id),
			name: RValue(item.fullname)
		}));

		return result;
	} catch (e) {
		err("getAllEmployees", e);

		return [];
	}
}

type ChangeLog = {
	change_id: number;
	position_name: string;
	department: string;
	organization: string;
	change_date: string;
};

function getHistoryChange(collaboratorId: number): ChangeLog[] {
	try {
		const histState = selectAll<ChangeLog>(
			`
      SELECT
				c.id AS collaborator_id,
				(xpath('//id/text()', log))[1]::text AS change_id,
				(xpath('//position_name/text()', log))[1]::text AS position_name,
				(xpath('//position_parent_name/text()', log))[1]::text AS department,
				(xpath('//org_name/text()', log))[1]::text AS organization,
				(xpath('//date/text()', log))[1]::text AS change_date
			FROM dbo.collaborator c
			CROSS JOIN LATERAL unnest(
				xpath('/collaborator/change_logs/change_log', c.data)
			) AS logs(log)
			WHERE c.id = ${collaboratorId}
			ORDER BY (xpath('//date/text()', log))[1]::text DESC;
      `
		);

		const result: ChangeLog[] = histState.map(item => ({
			change_id: RValue(item.change_id),
			position_name: RValue(item.position_name),
			department: RValue(item.department),
			organization: RValue(item.organization),
			change_date: RValue(item.change_date)
		}));

		return result;
	} catch (e) {
		err("getHistoryChange", e);

		return [];
	}
}

type StateLog = {
	code_id: number;
	state_id: string;
	start_date: string;
	finish_date: string;
	komment: string;
}

function getStateChange(collaboratorId: number): StateLog[] {
	try {
		const histState = selectAll<StateLog>(
			`
      SELECT
				c.id AS collaborator_id,
				(xpath('//id/text()', state))[1]::text AS code_id,
				(xpath('//state_id/text()', state))[1]::text AS state_id,         
				(xpath('//start_date/text()', state))[1]::text AS start_date,    
				(xpath('//finish_date/text()', state))[1]::text AS finish_date,      
				(xpath('//comment/text()', state))[1]::text AS komment      
			FROM dbo.collaborator c
			CROSS JOIN LATERAL unnest(
				xpath('/collaborator/history_states/history_state', c.data)
			) AS states(state)
			WHERE c.id = ${collaboratorId}
      `
		);

		const result: StateLog[] = histState.map(item => ({
			code_id: RValue(item.code_id),
			state_id: RValue(item.state_id),
			start_date: RValue(item.start_date),
			finish_date: RValue(item.finish_date),
			komment: RValue(item.komment)
		}));

		return result;
	} catch (e) {
		err("getStateChange", e);

		return [];
	}
}


function handler(body: object, method: string) {
	const response = { success: true, error: false, data: [] as unknown };

	switch (method) {
		case "getDepartments": {
			response.data = getDepartments();
			break;
		}

		case "getEmployeesByDepartmentName": {
			const depName = (body as any).depName;
			response.data = getEmployeesByDepartmentName(depName);
			break;
		}

		case "getAllEmployees": {
			response.data = getAllEmployees();
			break;
		}

		case "getHistoryChange": {
			const collaboratorId = (body as any).collaboratorId;
			response.data = getHistoryChange(collaboratorId);
			break;
		}

		case "getStateChange": {
			const collaboratorId = (body as any).collaboratorId;
			response.data = getStateChange(collaboratorId);
			break;
		}

		default: {
			response.success = false;
			response.error = true;
			response.data = `Unknown method: ${method}`;
		}
	}

	return response;
}


/* --- start point --- */
function main(req: Request, res: Response) {
	try {
		//const params = req.Query;

		const body: IRequestBody = tools.read_object(req.Body)

		const method = tools_web.convert_xss(body.GetOptProperty("method") as string)

		if (IsEmptyValue(method) || method === 'undefined') {
			err("main", { message: "Не найдено поле method в body" });
		}

		const payload = handler(body, method);

		res.Write(tools.object_to_text(payload, "json"));

	} catch (error) {
		if (DEV_MODE) {
			Response.Write(error.message);
		} else {
			log(`[uid:${curUserId}] -> ${error.message}`, "error")
			Request.SetRespStatus(500, "");
			const res = {
				data: [] as [],
				success: false,
				error: true,
				message: "Произошла ошибка на стороне сервера",
				log: logConfig.code,
				errorMessage: error.message
			}
			Response.Write(tools.object_to_text(res, "json"));
		}
	}
}

export const logConfig = {
	code: "globex_web_log",
	type: "web",
	objectId: customWebTemplate.id
}
EnableLog(logConfig.code, DEBUG_MODE);

main(Request, Response);

export { }