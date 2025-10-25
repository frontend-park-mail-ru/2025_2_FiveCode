import { apiFetch } from "../api";
import { login, register, logout, checkSession } from "../auth";
import { saveUser, clearUser } from "../utils/session";


interface UserCredentials {
  email: string;
  password: string;
}

interface User{
  id?: number;
  username?: string;
  password?: string;
  email?: string;
}


/**
 * Клиент для работы с API приложения
 * @namespace apiClient
 */
export const apiClient = {
  /**
   * Авторизация пользователя
   * @param {User} creds данные для входа
   * @returns {Promise<User>} объект пользователя
   */
  async login(creds : User) : Promise<User> {
    const user = await login(creds);
    saveUser(user);
    return user;
  },

  /**
   * Регистрация пользователя
   * @param {Object} data данные для регистрации
   * @returns {Promise<Object>} объект пользователя
   */
  async register(data : Object) : Promise<User> {
    const user = await register(data);
    return user;
  },

  /**
   * Выход пользователя
   * @returns {Promise<void>}
   */
  async logout() : Promise<void> {
    await logout();
    clearUser();
  },

  /**
   * Получить текущую сессию пользователя
   * @returns {Promise<User|null>} объект пользователя или null
   */
  async me() : Promise<User|null> {
    return await checkSession();
  },

  /**
   * Получить заметки пользователя по id
   * @param {string|number} userId id пользователя
   * @returns {Promise<Array>} массив заметок
   */
  async getNotesForUser(userId : string | number) : Promise<Array<any>> {
    if (!userId) throw new Error('userId required');
    return apiFetch(`/api/user/${userId}/notes`, { method: 'GET' });
  },
};
