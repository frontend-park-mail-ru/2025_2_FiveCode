import { htmlToElement } from '../templates.js';
import { Subdirectories } from './Subdirectories.js';
import { apiClient } from '../api/apiClient.js';

const ICONS = {
  home: new URL('../assets/icon_home_active.svg', import.meta.url).href,
  search: new URL('../assets/icon_search_active.svg', import.meta.url).href,
  settings: new URL('../assets/icon_settings_active.svg', import.meta.url).href,
  logout: new URL('../assets/icon_logout.svg', import.meta.url).href,
};

/**
 * Sidebar компонент
 * @param {Object} params
 * @param {Object} params.user - текущий пользователь
 * @returns {HTMLElement}
 */
export function Sidebar({ user, subdirs }) {
    const el = htmlToElement(`
        <aside class="sidebar">
        <div class="sidebar__user">     <a href="/settings" data-link>${user?.username || 'Guest'}</a></div>
            <nav class="sidebar__nav">
                <a href="/" class="sidebar__item" data-link> <img src="${ICONS.home}" class="sidebar__icon" alt="user icon" /> Home</a>
                <a href="/notes" class="sidebar__item" data-link> <img src="${ICONS.search}" class="sidebar__icon" /> Search</a>
            </nav>
        <div class="sidebar__subs"></div>
            <a href="/settings" class="sidebar__item" data-link> <img src="${ICONS.settings}" class="sidebar__icon" /> Settings</a>
            <a href="/login" class="sidebar__item logout-btn" data-link> <img src="${ICONS.logout}" class="sidebar__icon" /> Log out</a>
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
        window.navigate(link.getAttribute('href'));
      }
    });
    
    // Logout
    el.querySelector(".logout-btn").addEventListener("click", async () => {
        await apiClient.logout();
        window.navigate("/login");
    });

  return el;
}
