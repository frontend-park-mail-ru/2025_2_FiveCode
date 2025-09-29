import { htmlToElement } from '../templates.js';
import { Subdirectories } from './subdirectories.js';
import { apiClient } from '../api/apiClient.js';
import { renderLogin } from '../pages/login.js';

const ICONS = {
  home: new URL('../assets/icon_home_active.svg', import.meta.url).href,
  search: new URL('../assets/icon_search_active.svg', import.meta.url).href,
  settings: new URL('../assets/icon_settings_active.svg', import.meta.url).href,
  logout: new URL('../assets/icon_logout_gray.svg', import.meta.url).href,
  account: new URL('../assets/icon_account_gray.svg', import.meta.url).href,
};

/**
 * Sidebar компонент
 * @param {Object} params
 * @param {Object} params.user - текущий пользователь
 * @returns {HTMLElement}
 */
export function Sidebar({ user, subdirs }) {
  const app = document.getElementById("app")
  const el = htmlToElement(`
      <aside class="sidebar">
      <div class="sidebar__item" href="/">
        <div class="sidebar__user"> <img src="${ICONS.account}" class="sidebar__icon" alt="user icon" /><a data-link>${user?.username || 'Guest'}</a></div>
      </div>
        <nav class="sidebar__nav">
            <a href="/" class="sidebar__item" data-link> <img src="${ICONS.home}" class="sidebar__icon" alt="user icon" /> Домой</a>  
          </nav>
      <div class="sidebar__subs"></div>
          
          <a href="/login" class="sidebar__item logout-btn" data-link> <img src="${ICONS.logout}" class="sidebar__icon" /> Выйти</a>
      </aside>
  `);

  const subs = el.querySelector('.sidebar__subs');

  apiClient.getNotesForUser(user.id)
  .then(notes => {
    notes = Array.isArray(notes) ? notes : [];
    subs.appendChild(Subdirectories({items: notes}));
    // mockNotes.forEach((note) => {
    //   subs.appendChild(NoteCard(note));
    // });
  })
  .catch(err => {
    console.error('Failed to load notes', err);
  });

  el.addEventListener('click', e => {
    const link = e.target.closest('a[data-link]');
    if (link) {
      e.preventDefault();
      renderLogin(app);
      // window.navigate(link.getAttribute('href'));
    }
  });
  
  // Logout
  el.querySelector(".logout-btn").addEventListener("click", async () => {
      await apiClient.logout();
      renderLogin(app);
      // window.navigate("/login");
  });

  return el;
}
