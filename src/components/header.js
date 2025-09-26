import { htmlToElement } from '../templates.js';

/**
 * Header компонент (Notion + поиск + login)
 */
export function Header({ user } = {}) {
    const el = htmlToElement(`
        <header class="header">
        <div class="header__logo"> <a href="/"> Notion </a> </div>
        <input type="search" class="header__search" placeholder="Search..."/>
        <button class="header__login">${user ? user.username : 'Log in'}</button>
        </header>
    `);

    el.querySelector('.header__login').addEventListener('click', () => {
        window.navigate(user ? '/settings' : '/login');
    });

  return el;
}
