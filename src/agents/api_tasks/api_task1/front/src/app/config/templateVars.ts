declare global {
	interface Window {
		_app_123456: {
			backendID: string;
			baseServerPath: string;
		};
	}
}

// Для локального тестирования без подключения к WEBSOFT'у
export const backendID = window._app_123456?.backendID ?? '7234079525863105466';
export const baseServerPath =
	window?._app_123456?.baseServerPath || 'http://localhost';
export const BACKEND_URL = `${baseServerPath}/custom_web_template.html?object_id=${backendID}`;
