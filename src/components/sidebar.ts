import ejs from 'ejs';
import { Subdirectories } from './subdirectories';
import { apiClient } from '../api/apiClient';
import { renderLogin } from '../pages/login';
const ICONS = {
    home: new URL('../static/svg/icon_home_active.svg', import.meta.url).href,
    search: new URL('../static/svg/icon_search_active.svg', import.meta.url).href,
    settings: new URL('../static/svg/icon_settings_active.svg', import.meta.url).href,
    logout: new URL('../static/svg/icon_logout_gray.svg', import.meta.url).href,
    account: new URL('../static/svg/icon_account_gray.svg', import.meta.url).href,
};


interface User{
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
export function Sidebar({ user, subdirs} : SidebarParams): HTMLElement {
    const app = document.getElementById("app");
    const template = `
      <aside class="sidebar">
      <div class="sidebar__item" href="/">
        <div class="sidebar__user"> <img src="<%= account %>" class="sidebar__icon" alt="user icon" /><a data-link><%= user?.username || 'Guest' %></a></div>
      </div>
        <nav class="sidebar__nav">
            <a href="/" class="sidebar__item" data-link> <img src="<%= home %>" class="sidebar__icon" alt="user icon" /> Домой</a>  
          </nav>
      <div class="sidebar__subs"></div>
          
          <a href="/login" class="sidebar__item logout-btn" data-link> <img src="<%= logout %>" class="sidebar__icon" /> Выйти</a>
      </aside>
  `;

  const html = ejs.render(template, {user, account: ICONS.account, home: ICONS.home, logout: ICONS.logout});
  const container = document.createElement('div');
  container.innerHTML = html;
  const el = container.firstElementChild as HTMLElement;

  const subs = el.querySelector('.sidebar__subs') as HTMLElement;
  apiClient.getNotesForUser(user?.id!)
      .then(notes => {
      notes = Array.isArray(notes) ? notes : [];
      subs.appendChild(Subdirectories({ items: notes }));
    })
      .catch(err => {
      console.error('Failed to load notes', err);
  });
  el.addEventListener('click', e => {
      const link = (e.target as HTMLElement).closest('a[data-link]');
      if (link) {
          e.preventDefault();
          renderLogin(app!);
      }
  });
  
  el.querySelector(".logout-btn")?.addEventListener("click", async () => {
      await apiClient.logout();
      renderLogin(app!);
  });
  return el;
}
//# sourceMappingURL=sidebar.js.map