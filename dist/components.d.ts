interface User {
    id: number;
    username: string;
}
/**
 * Создаёт DOM-элемент боковой панели
 * @param {User | null} объект пользователя
 * @returns {HTMLElement} DOM-элемент сайдбара
 */
export declare function Sidebar(user: User | null): HTMLElement;
interface NoteCardParams {
    title: string;
    body?: string;
}
/**
 * Создаёт DOM-элемент карточки
 * @param {Object} params параметры карточки
 * @param {string} params.title заголовок
 * @param {string} [params.body] текст
 * @returns {HTMLElement} DOM-элемент карточки
 */
export declare function NoteCard({ title, body }: NoteCardParams): HTMLElement;
export {};
