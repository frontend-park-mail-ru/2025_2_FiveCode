import ejs from 'ejs';
import { Sidebar } from '../components/sidebar';

interface SidebarProps {
  user: { email: string } | null;
  subdirs: string[];
}

interface User{
  id?: number;
  username?: string;
  password?: string;
  email?: string;
}

interface AppSession {
  user: User | null;
}

declare global {
  interface Window {
    __APP_SESSION__?: AppSession;
  }
}

/**
 * Рендерит страницу просмотра заметки по id
 * @param {string|number} noteId идентификатор заметки
 * @returns {HTMLElement} DOM-элемент страницы просмотра
 */
export function PageView(noteId: string | number): HTMLElement | null {
  const el = document.createElement('div');
  el.innerHTML = `<div class="page"></div>`;
  const page = el.firstElementChild as HTMLElement;
  const user = window.__APP_SESSION__?.user ?? null;
  page.appendChild(Sidebar({ user, subdirs: [] }));

  const mainTemplate = `
    <main class="page__main">
      <h2>Document blocks for note <%= noteId %></h2>
    </main>
  `;

  const mainHtml = ejs.render(mainTemplate, { noteId });
  const mainEl = document.createElement('div');
  mainEl.innerHTML = mainHtml;
  const main = mainEl.firstElementChild as HTMLElement;
  page.appendChild(main);

  // el.appendChild(
  //   Sidebar({ user: window.__APP_SESSION__?.user ?? null, subdirs: [] })
  // );

  // const main = htmlToElement(
  //   `<main class="page__main"><h2>Document blocks for note ${noteId}</h2></main>`
  // );

  // el.appendChild(main);
  // return el;

  return page;
}

