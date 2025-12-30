/*Тестовая страница Backend*/

// =require ./modules/devmode.ts
// =require ./modules/req_headers.ts

import { log } from "./modules/log"; // .
import { IRequestBody } from "./types/RequestBody"; // .
import { selectAll } from "./utils/query"; // .

/* --- types --- */
interface IProcedureWithRelationsType {
	procedure_id: XmlElem<number>;
	name: XmlElem<string>;
	start_date: XmlElem<string>;
	end_date: XmlElem<string>;
	plan_id: XmlElem<number>;
	person_fullname: XmlElem<string>;
	workflow_state_name: XmlElem<string>;
	questionnaire_id: XmlElem<number>;
	expert_person_fullname: XmlElem<string>;
	overall: XmlElem<string>;
	assessment_appraise_id: XmlElem<number>;
	assessment_plan_id: XmlElem<number>;
}

interface IDateFormatResult {
	date_str: string;
	error: number;
}

type ProcedureWithRelationsType = {
	questionnaire_id: number;
	expert_person_fullname: string;
	overall: string;
	assessment_plan_id: number;
	plan_id: number;
	person_fullname: string;
	workflow_state_name: string;
	assessment_appraise_id: number;
	procedure_id: number;
	name: string;
	start_date: string;
	end_date: string;
};

/* --- utils --- */
function getParam(name: string, defaultVal: string = undefined) {
	return tools_web.get_web_param(curParams, name, defaultVal, true, "");
}

function err(source: string, error: { message: string; }, text = "") {
	throw new Error(`${source} -> ${text ? text + " " : ""}${error.message}`);
}

/* --- global --- */
const curUserId: number = DEV_MODE
	? OptInt("7000000000000000")
	: OptInt(curUserID);
const DEBUG_MODE = tools_web.is_true(getParam("IS_DEBUG", undefined));

/* --- logic --- */
function getAllData(): ProcedureWithRelationsType[] {
	try {
		const data = selectAll<IProcedureWithRelationsType>(`
			SELECT 
				pas.id AS questionnaire_id,
				pas.assessment_plan_id,  
				pas.expert_person_fullname,
				pas.overall,
				ap.id AS plan_id,
				ap.assessment_appraise_id,
				ap.person_fullname, 
				ap.workflow_state_name,
				aa.id AS procedure_id, 
				aa.name, 
				aa.start_date, 
				aa.end_date 
			FROM 
				dbo.pas
			LEFT JOIN 
				dbo.assessment_plans ap ON pas.assessment_plan_id = ap.id
			LEFT JOIN 
				dbo.assessment_appraises aa ON ap.assessment_appraise_id = aa.id;
		`);

		return data.map((item) => {
			const startDate = item.start_date.Value;
			const endDate = item.end_date.Value;

			let startDateFormatted = "";
			let endDateFormatted = "";

			if (startDate) {
				const startResult: IDateFormatResult = tools.call_code_library_method(
					"libSchedule",
					"get_str_date_from_date",
					[startDate],
				);
				startDateFormatted = startResult.date_str;
			}

			if (endDate) {
				const endResult: IDateFormatResult = tools.call_code_library_method(
					"libSchedule",
					"get_str_date_from_date",
					[endDate],
				);
				endDateFormatted = endResult.date_str;
			}

			return {
				questionnaire_id: item.questionnaire_id.Value,
				expert_person_fullname: item.expert_person_fullname.Value,
				overall: item.overall.Value,
				assessment_plan_id: item.assessment_plan_id.Value,
				plan_id: item.plan_id.Value,
				person_fullname: item.person_fullname.Value,
				workflow_state_name: item.workflow_state_name.Value,
				assessment_appraise_id: item.assessment_appraise_id.Value,
				procedure_id: item.procedure_id.Value,
				name: item.name.Value,
				start_date: startDateFormatted,
				end_date: endDateFormatted,
			};
		});
	} catch (e) {
		err("getAllData", e);
	}
}

function handler(body: object, method: string) {
	const response = { success: true, error: false, data: [] as unknown };

	switch (method) {
		case "getAllData":
			response.data = getAllData();
			break;

		default:
			throw new Error(`Неизвестный метод: ${method}`);
	}

	return response;
}

/* --- start point --- */
function main(req: Request, res: Response) {
	try {
		const body: IRequestBody = tools.read_object(req.Body);

		const method = tools_web.convert_xss(
			body.GetOptProperty("method") as string,
		);

		if (IsEmptyValue(method) || method === "undefined") {
			err("main", { message: "Не найдено поле method в body" });
		}

		const payload = handler(body, method);

		res.Write(tools.object_to_text(payload, "json"));
	} catch (error) {
		if (DEV_MODE) {
			Response.Write(error.message);
		} else {
			log(`[uid:${curUserId}] -> ${error.message}`, "error");
			Request.SetRespStatus(500, "");
			const res = {
				data: [] as [],
				success: false,
				error: true,
				message: "Произошла ошибка на стороне сервера" + error.message,
				log: logConfig.code,
			};
			Response.Write(tools.object_to_text(res, "json"));
		}
	}
}

export const logConfig = {
	code: "globex_web_log",
	type: "web",
	objectId: customWebTemplate.id,
};
EnableLog(logConfig.code, DEBUG_MODE);

main(Request, Response);

export {};
