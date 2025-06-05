declare global {
    interface Window {
        _app: { backendCode: string; backendID: string; appPath: string; baseServerPath: string };
    }
    
}

// Для локального тестирования без подключения к WEBSOFT'у
export const backendID = window._app?.backendID ?? "7156651799976068397";
export const BACKEND_URL = `/custom_web_template.html?object_id=${backendID}`;