<%
var body = tools.read_object(Request.Body);
var web_directory = "\\wt\\web\\" + body.GetOptProperty("directory");

function uploadFiles(files) {
	try {
		var folder, name, content;

		for(var i = 0; i < ArrayCount(files); i++) {
			folder = files[i].GetOptProperty("folder");
			name = files[i].GetOptProperty("name");
			content = Base64Decode(String(files[i].GetOptProperty("content")));
			
			ObtainDirectory(AppDirectoryPath() + web_directory + folder, true);
			PutFileData(AppDirectoryPath() + web_directory + folder + "\\" + name, content );
		}
	
		log("Frontend files were saved by hook by User: "+curUserID)
	
		return "files successfully saved"

	} catch (e) {
		throw new Error("uploadFiles -> " + e.message);
	}

}

/**
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
function handle(req, res) {
	var body = tools.read_object(req.Body);
	var files = body.GetOptProperty("files");
	
	var result = uploadFiles(files)

	Response.Write(tools.object_to_text(result, "json"));
}

/* --- system --- */
IS_DEBUG = tools_web.is_true(tools_web.get_web_param( curParams, 'IS_DEBUG', '', true ))

var logConfig = {
	code: "globex_frontend_hooks_log",
	type: "web_template",
	agentId: customWebTemplate.id
};

EnableLog(logConfig.code, IS_DEBUG);

/**
 * Вывод сообщения в журнал
 * @param {string} message - Сообщение
 * @param {string} type - Тип сообщения info/error
 */
function log(message, type) {
	type = IsEmptyValue(type) ? "INFO" : StrUpperCase(type);

	if (ObjectType(message) === "JsObject" || ObjectType(message) === "JsArray" || ObjectType(message) === "XmLdsSeq") {
		message = tools.object_to_text(message, "json");
	}

	var log = "[" + type + "][" + logConfig.type + "][" + logConfig.agentId + "]: " + message;

	LogEvent(logConfig.code, log);
}

function checkAccess() {
	return curUser.access.access_role.Value === "admin"
}

try {
	if(!checkAccess()) {
		Request.SetRespStatus(403, "Bad Request");
		Response.Write("access denied");
	}

	handle(Request, Response);
} catch (error) {
	Request.SetRespStatus(500, "");
	Response.Write(error);
}
%>