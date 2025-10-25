interface User {
    id?: number;
    username?: string;
    password?: string;
    email?: string;
}
interface AppSession {
    user: User | null;
}
declare global {
    interface Window {
        __APP_SESSION__?: AppSession;
    }
}
/**
 * Рендерит страницу просмотра заметки по id
 * @param {string|number} noteId идентификатор заметки
 * @returns {HTMLElement} DOM-элемент страницы просмотра
 */
export declare function PageView(noteId: string | number): HTMLElement | null;
export {};
