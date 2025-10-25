interface User {
    id?: number;
    username?: string;
    password?: string;
    email?: string;
}
/**
 * Клиент для работы с API приложения
 * @namespace apiClient
 */
export declare const apiClient: {
    /**
     * Авторизация пользователя
     * @param {User} creds данные для входа
     * @returns {Promise<User>} объект пользователя
     */
    login(creds: User): Promise<User>;
    /**
     * Регистрация пользователя
     * @param {Object} data данные для регистрации
     * @returns {Promise<Object>} объект пользователя
     */
    register(data: Object): Promise<User>;
    /**
     * Выход пользователя
     * @returns {Promise<void>}
     */
    logout(): Promise<void>;
    /**
     * Получить текущую сессию пользователя
     * @returns {Promise<User|null>} объект пользователя или null
     */
    me(): Promise<User | null>;
    /**
     * Получить заметки пользователя по id
     * @param {string|number} userId id пользователя
     * @returns {Promise<Array>} массив заметок
     */
    getNotesForUser(userId: string | number): Promise<Array<any>>;
};
export {};
