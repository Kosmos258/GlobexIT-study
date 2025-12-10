declare global {
	interface Window {
		_app: {
			backendCode: string;
			baseServerPath: string;
		};
	}
}

// Для локального тестирования без подключения к WEBSOFT'у
export const backendCode = window._app?.backendCode ?? '0000000000000000000';
export const baseServerPath =
	window?._app?.baseServerPath || 'https://localhost';
export const BACKEND_URL = `${baseServerPath}/custom_web_template.html?object_code=${backendCode}`;
