import { htmlToElement } from '../templates.js';

const ICONS = {
  Icon: new URL('../assets/icon_goose.svg', import.meta.url).href,
};


export function Header({ user } = {}) {
    const el = htmlToElement(`
        <header class="header">
        <div class="header__logo"> <img src="${ICONS.Icon}"/ class="header-icon"> <a href="/"> Goose </a> </div>
        
        <button class="header__login">${user ? user.username : 'Войти'}</button>
        </header>
    `);

    el.querySelector('.header__login').addEventListener('click', () => {
        window.navigate(user ? '/settings' : '/login');
    });

  return el;
}
