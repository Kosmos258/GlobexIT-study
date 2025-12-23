/*Тестовая страница Backend*/

// =require ./modules/devmode.ts
// =require ./modules/req_headers.ts

import { log } from "./modules/log"; // .
import { IRequestBody } from "./types/RequestBody"; // .

/* --- types --- */
interface IUser {
	id: number;
	name: string;
	username: string;
	email: string;
	address: {
		street: string;
		suite: string;
		city: string;
		zipcode: string;
		geo: {
			lat: string;
			lng: string;
		};
	};
	phone: string;
	website: string;
	company: {
		name: string;
		catchPhrase: string;
		bs: string;
	};
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

/* --- logic --- */
function getUsers(): IUser[] {
	try {
		const apiUrl = "https://jsonplaceholder.typicode.com/users";

		const httpResponse = HttpRequest(apiUrl, "get");

		const responseBody = httpResponse.Body;

		const users: IUser[] = tools.read_object(responseBody);

		return users;
	} catch (e) {
		err("getUsers", e, "Ошибка при получении пользователей из внешнего API");

		return [];
	}
}

function handler(body: object, method: string) {
	const response = { success: true, error: false, data: [] as unknown };

	if (method == "getUsers") {
		response.data = getUsers();
	}

	return response;
}

/* --- start point --- */
function main(req: Request, res: Response) {
	try {
		// const params = req.Query;

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
