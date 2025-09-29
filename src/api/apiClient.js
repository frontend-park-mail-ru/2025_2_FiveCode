import { apiFetch } from "../api.js";
import { login, register, logout, checkSession } from "../auth.js";
import { saveUser, clearUser } from "../utils/session.js";


/**
 * Клиент для работы с API приложения
 * @namespace apiClient
 */
export const apiClient = {
  /**
   * Авторизация пользователя
   * @param {Object} creds данные для входа
   * @returns {Promise<Object>} объект пользователя
   */
  async login(creds) {
    const user = await login(creds);
    saveUser(user);
    return user;
  },

  /**
   * Регистрация пользователя
   * @param {Object} data данные для регистрации
   * @returns {Promise<Object>} объект пользователя
   */
  async register(data) {
    const user = await register(data);
    return user;
  },

  /**
   * Выход пользователя
   * @returns {Promise<void>}
   */
  async logout() {
    await logout();
    clearUser();
  },

  /**
   * Получить текущую сессию пользователя
   * @returns {Promise<Object|null>} объект пользователя или null
   */
  async me() {
    return await checkSession();
  },

  /**
   * Получить заметки пользователя по id
   * @param {string|number} userId id пользователя
   * @returns {Promise<Array>} массив заметок
   */
  async getNotesForUser(userId) {
    if (!userId) throw new Error('userId required');
    return apiFetch(`/api/user/${userId}/notes`, { method: 'GET' });
  },
};
