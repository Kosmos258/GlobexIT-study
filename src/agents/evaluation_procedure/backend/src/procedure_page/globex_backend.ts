/*Тестовая страница Backend*/

// =require ./modules/devmode.ts
// =require ./modules/req_headers.ts

import { log } from "./modules/log"; // .
import { IRequestBody } from "./types/RequestBody"; // .
import { selectAll } from "./utils/query"; // .

/* --- types --- */
interface ISubdivision {
	procedure_id: XmlElem<string>;
	name: XmlElem<string>;
	start_date: XmlElem<string>;
	end_date: XmlElem<string>;
	plan_id: XmlElem<string>;
	person_fullname: XmlElem<string>;
	workflow_state_name: XmlElem<string>;
	questionnaire_id: XmlElem<string>;
	expert_person_fullname: XmlElem<string>;
	overall: XmlElem<string>;
	assessment_appraise_id: XmlElem<string>;
	assessment_plan_id: XmlElem<string>;
}

interface IDateFormatResult {
	date_str: string;
	error: number;
}

type ProcedureType = {
	procedure_id: string;
	name: string;
	start_date: string;
	end_date: string;
};

type PlanType = {
	plan_id: string;
	person_fullname: string;
	workflow_state_name: string;
};

type QuestionnaireType = {
	questionnaire_id: string;
	expert_person_fullname: string;
	overall: string;
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

// Получаем все процедуры оценки
function getProcedures(): ProcedureType[] {
	try {
		const procedure = selectAll<ISubdivision>(`
			SELECT 
				id procedure_id, 
				name, 
				start_date, 
				end_date 
			FROM 
				dbo.assessment_appraises;
		`);

		return procedure.map((item) => {
			const startDate = RValue(item.start_date);
			const endDate = RValue(item.end_date);

			const startDateFormatted: IDateFormatResult = tools.call_code_library_method(
				"libSchedule",
				"get_str_date_from_date",
				[startDate],
			);

			const endDateFormatted: IDateFormatResult = tools.call_code_library_method(
				"libSchedule",
				"get_str_date_from_date",
				[endDate],
			);

			return {
				procedure_id: RValue(item.procedure_id),
				name: RValue(item.name),
				start_date: startDateFormatted.date_str,
				end_date: endDateFormatted.date_str,
			};
		});
	} catch (e) {
		err("getProcedures", e);
	}
}

// Получаем все планы оценки
function getPlans(): PlanType[] {
	try {
		const plan = selectAll<ISubdivision>(`
            SELECT 
                id plan_id,
                assessment_appraise_id,  
                person_fullname, 
                workflow_state_name
            FROM 
                dbo.assessment_plans;
        `);

		return plan.map((item) => ({
			plan_id: RValue(item.plan_id),
			assessment_appraise_id: RValue(item.assessment_appraise_id),
			person_fullname: RValue(item.person_fullname),
			workflow_state_name: RValue(item.workflow_state_name),
		}));
	} catch (e) {
		err("getPlans", e);
	}
}

// Получаем все анкеты
function getQuestionnaires(): QuestionnaireType[] {
	try {
		const questionnaire = selectAll<ISubdivision>(`
            SELECT 
                id questionnaire_id,
                assessment_plan_id,  
                expert_person_fullname,
                overall
            FROM 
                dbo.pas;
        `);

		return questionnaire.map((item) => ({
			questionnaire_id: RValue(item.questionnaire_id),
			assessment_plan_id: RValue(item.assessment_plan_id),
			expert_person_fullname: RValue(item.expert_person_fullname),
			overall: RValue(item.overall),
		}));
	} catch (e) {
		err("getQuestionnaires", e);
	}
}

function handler(body: object, method: string) {
	const response = { success: true, error: false, data: [] as unknown };

	switch (method) {
		case "getProcedures":
			response.data = getProcedures();
			break;

		case "getPlans":
			response.data = getPlans();
			break;

		case "getQuestionnaires":
			response.data = getQuestionnaires();
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
