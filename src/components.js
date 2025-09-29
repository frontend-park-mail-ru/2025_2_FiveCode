import { htmlToElement } from './templates.js';
import { renderLogin } from './pages/login.js';
import { renderNotes } from './pages/notes.js';

/**
 * Создаёт DOM-элемент боковой панели
 * @param {Object} user объект пользователя
 * @returns {HTMLElement} DOM-элемент сайдбара
 */
export function Sidebar(user){
  const el = htmlToElement(`
    <div class="sidebar">
      <div style="font-weight:700;margin-bottom:8px">Username</div>
      <div><a href="/" data-link>Домой</a></div>
      <div><a href="/notes" data-link>Notes</a></div>
      <div style="position:absolute;bottom:16px">Settings</div>
    </div>
  `);
  el.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-link]');
    if (a){ 
      e.preventDefault(); 
      const href = a.getAttribute('href');
      const app = document.getElementById("app");

      if (href === "/") {
        renderNotes(app);
      } else if (href === "/notes") {
        renderNotes(app);
      } else if (href === "/login") {
        renderLogin(app);
      }
    }
  });
  return el;
}

/**
 * Создаёт DOM-элемент карточки
 * @param {Object} params параметры карточки
 * @param {string} params.title заголовок
 * @param {string} [params.body] текст
 * @returns {HTMLElement} DOM-элемент карточки
 */
export function NoteCard({title, body}){
  const el = htmlToElement(`<div class="card">
      <div class="title">${title}</div>
      <div>${body || ''}</div>
    </div>`);
  return el;
}
