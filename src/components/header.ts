import ejs from 'ejs';
import { renderDashboard } from '../pages/dashboard';
import { renderLogin } from '../pages/login';

const ICONS = {
  Icon: new URL('../static/svg/icon_goose.svg', import.meta.url).href,
};

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
export function Header({ user, app }: HeaderProps) : HTMLElement {
    const template = `
        <header class="header">
        <div class="header__logo">
            <img src="<%= iconUrl %>" class="header-icon">
            <a href="/">Goose</a>
        </div>
        </header>
    `;
    const html = ejs.render(template, {
    iconUrl: ICONS.Icon,
    });
    
    const el = document.createElement('div');
    el.innerHTML = html;
    
    
    return el.firstElementChild as HTMLElement;
}
