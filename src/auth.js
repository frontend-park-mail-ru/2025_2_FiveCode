import { apiFetch } from './api.js';

/**
 * Запрос на логин. Бекенд должен установить HttpOnly cookie.
 * @param {{email: string, password: string}} creds
 */
export async function login(creds){
  return apiFetch('/api/login', { method: 'POST', body: creds });
}

/**
 * Регистрация
 * @param {{email:string,password:string}} data
 */
export async function register(data){
  return apiFetch('/api/register', { method: 'POST', body: data });
}

/**
 * Проверка сессии (например GET /api/session возвращает user или null)
 */
export async function checkSession(){
  return apiFetch('/api/session', { method: 'GET' });
}

/**
 * Logout (бикуканье бекенда удалить cookie)
 */
export async function logout(){
  return apiFetch('/api/logout', { method: 'POST' });
}
