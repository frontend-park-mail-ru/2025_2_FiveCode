interface User {
    id: number;
    username: string;
}
interface HeaderProps {
    user?: User | null;
    app: HTMLElement;
}
/**
 * Создаёт DOM-элемент header
 * @param {Object} [params] - Параметры для хедера
 * @param {Object} [params.user] - Объект пользователя (если авторизован)
 * @param {string} [params.user.username] - Имя ползователя для отображения
 * @returns {HTMLElement} DOM-элемент header
 */
export declare function Header({ user, app }: HeaderProps): HTMLElement;
export {};
