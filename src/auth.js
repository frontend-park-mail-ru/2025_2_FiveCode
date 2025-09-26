import { apiFetch } from './api.js';

/**
 * Запрос на логин. Бекенд должен установить HttpOnly cookie.
 * @param {{username: string, password: string}} creds
 */
export async function login(creds){
  return apiFetch('/auth/login', { method: 'POST', body: creds });
}

/**
 * Регистрация
 * @param {{username:string,password:string}} data
 */
export async function register(data){
  return apiFetch('/auth/register', { method: 'POST', body: data });
}

/**
 * Проверка сессии (например GET /auth/session возвращает user или null)
 */
export async function checkSession(){
  return apiFetch('/auth/session', { method: 'GET' });
}

/**
 * Logout (бикуканье бекенда удалить cookie)
 */
export async function logout(){
  return apiFetch('/auth/logout', { method: 'POST' });
}
