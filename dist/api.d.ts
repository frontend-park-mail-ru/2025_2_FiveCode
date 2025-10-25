interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
    path?: string;
    body?: BodyInit | null;
}
/**
 * Базовая обёртка fetch
 * Всегда включает credentials: 'include' для cookie-based сессии
 * @param {string} path
 * @param {object} options
 */
export declare function apiFetch(path: string, options?: ApiFetchOptions): Promise<any>;
export {};
