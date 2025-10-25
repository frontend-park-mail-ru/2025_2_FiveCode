interface NoteCardParams {
    id: number;
    title: string;
    text: string;
    icon: string;
    favorite: boolean;
}
/**
 * Создаёт DOM-элемент карточки заметки
 * @param {Object} params параметры карточки
 * @param {string} params.title заголовок заметки
 * @param {string} params.text текст заметки
 * @param {string} params.icon ссылка на иконку
 * @param {boolean} params.favorite признак избранного
 * @returns {HTMLElement} DOM-элемент карточки
 */
export declare function NoteCard({ title, text, icon, favorite }: NoteCardParams): HTMLElement;
export {};
