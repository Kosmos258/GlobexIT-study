/*Тестовая страница Backend*/

// =require ./modules/devmode.ts
// =require ./modules/req_headers.ts

import { log } from "./modules/log"; // .
import { IRequestBody } from "./types/RequestBody";
import { selectAll } from "./utils/query"; // .

const GLOBAL = {
	PRINT_ID: OptInt((Param.PRINT_ID)),
};

/* --- types --- */
interface ICertificate {
	id: XmlElem<number>;
	type_name: XmlElem<string>;
}

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

interface ICertificate {
	id: XmlElem<number>;
	type_name: XmlElem<string>;
	downloadUrl: string;
}

/* --- logic --- */
function getCertificates() {
	try {
		const certs = selectAll<ICertificate>(`
			SELECT 
				cert.id, 
				cert.type_name 
			FROM 
				dbo.certificates cert; 
		`);

		return certs.map((item) => ({
			id: item.id,
			type_name: item.type_name,
			downloadUrl: `view_print_form.html?print_form_id=${GLOBAL.PRINT_ID}&object_id=${item.id}&sid=${tools_web.get_sum_sid(String(GLOBAL.PRINT_ID), Session.sid)}`,
		}));
	} catch (e) {
		err("getCertificates", e);
	}
}

function handler(body: object, method: string) {
	const response = {
		success: true,
		error: false,
		data: [] as unknown,
	};

	if (method === "getCertificates") {
		response.data = getCertificates();
	}

	return response;
}

/* --- start point --- */
function main(req: Request, res: Response) {
	try {
		const body: IRequestBody = tools.read_object(req.Body);
		const method = tools_web.convert_xss(body.GetOptProperty("method") as string);

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
				message: "Произошла ошибка на стороне сервера",
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

