import { renderDashboard } from '../pages/dashboard.js';
import { renderLogin } from '../pages/login.js';
import { htmlToElement } from '../templates.js';

const ICONS = {
  Icon: new URL('../assets/icon_goose.svg', import.meta.url).href,
};


/**
 * Создаёт DOM-элемент header
 * @param {Object} [params] - Параметры для хедера
 * @param {Object} [params.user] - Объект пользователя (если авторизован)
 * @param {string} [params.user.username] - Имя ползователя для отображения
 * @returns {HTMLElement} DOM-элемент header
 */
export function Header({ user }) {
    const el = htmlToElement(`
        <header class="header">
        <div class="header__logo"> <img src="${ICONS.Icon}"/ class="header-icon"> <a href="/"> Goose </a> </div>
        
        
        </header>
    `);

    // el.querySelector('.header__login').addEventListener('click', () => {
    //     if (user) {
    //         renderDashboard(app);}
    //     else {
    //         renderLogin(app);
    //     }
    //     }
    // );
    app.appendChild(el);
}
