/**
 * Запрос на логин. Бекенд должен установить HttpOnly cookie.
 * @param {{username: string, password: string}} creds
 */
export declare function login(creds: any): Promise<any>;
/**
 * Регистрация
 * @param {{username:string,password:string}} data
 */
export declare function register(data: any): Promise<any>;
/**
 * Проверка сессии (например GET /api/session возвращает user или null)
 */
export declare function checkSession(): Promise<any>;
/**
 * Logout (бикуканье бекенда удалить cookie)
 */
export declare function logout(): Promise<any>;
