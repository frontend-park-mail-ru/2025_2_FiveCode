interface User {
    id?: number;
    username?: string;
    password?: string;
    email?: string;
}
interface SidebarParams {
    user: User | null;
    subdirs?: any;
}
/**
 * Sidebar компонент
 * @param {Object} params
 * @param {Object} params.user - текущий пользователь
 * @returns {HTMLElement}
 */
export declare function Sidebar({ user, subdirs }: SidebarParams): HTMLElement;
export {};
