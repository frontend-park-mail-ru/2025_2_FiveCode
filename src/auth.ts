import { apiFetch } from "./api";

/**
 * Запрос на логин. Бекенд должен установить HttpOnly cookie.
 * @param {{username: string, password: string}} creds
 */
export async function login(creds: any) {
  return apiFetch("/login", { method: "POST", body: creds });
}

/**
 * Регистрация
 * @param {{username:string,password:string}} data
 */
export async function register(data: any) {
  return apiFetch("/register", { method: "POST", body: data });
}

/**
 * Проверка сессии (например GET /session возвращает user или null)
 */
export async function checkSession() {
  return apiFetch("/session", { method: "GET" });
}

/**
 * Logout (бикуканье бекенда удалить cookie)
 */
export async function logout() {
  return apiFetch("/logout", { method: "POST" });
}
