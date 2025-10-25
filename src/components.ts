import ejs from 'ejs';
import { renderLogin } from './pages/login';
import { renderNotes } from './pages/notes';

interface User {
  id: number;
  username: string;
}



/**
 * Создаёт DOM-элемент боковой панели
 * @param {User | null} объект пользователя
 * @returns {HTMLElement} DOM-элемент сайдбара
 */
export function Sidebar(user : User | null): HTMLElement {
  const sidebarHtml = ejs.render(`
    <div class="sidebar">
      <div style="font-weight:700;margin-bottom:8px"><%= username %></div>
      <div><a href="/" data-link>Домой</a></div>
      <div><a href="/notes" data-link>Notes</a></div>
      <div style="position:absolute;bottom:16px">Settings</div>
    </div>
  `, {username: user ? user.username : 'Guest'});

  const el = document.createElement('div');
  el.innerHTML = sidebarHtml;
  const sidebarEl = el.firstElementChild as HTMLElement;

  sidebarEl.addEventListener('click', (e: MouseEvent) => {
    const link = (e.target as HTMLElement).closest('a[data-link]');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');
      const app = document.getElementById("app");

      if (app) {
        if (href === "/" || href === "/notes") {
          renderNotes(app);
        } else if (href === "/login") {
          renderLogin(app);
        }
      }
    }
  });
  return sidebarEl;
}

interface NoteCardParams{
  title: string;
  body?: string;
}

/**
 * Создаёт DOM-элемент карточки
 * @param {Object} params параметры карточки
 * @param {string} params.title заголовок
 * @param {string} [params.body] текст
 * @returns {HTMLElement} DOM-элемент карточки
 */
export function NoteCard({title, body} : NoteCardParams): HTMLElement {
  const cardHtml = ejs.render(`<div class="card">
      <div class="title"><%= title %></div>
      <div><%= body %></div>
    </div>`, {title, body});
  const el = document.createElement('div');
  el.innerHTML = cardHtml;
  const sidebarEl = el.firstElementChild as HTMLElement;
  return el;
}
