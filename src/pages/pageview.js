import { htmlToElement } from '../templates.js';
import { Sidebar } from '../components/sidebar.js';

export function PageView(noteId) {
  const el = htmlToElement(`<div class="page"></div>`);
  el.appendChild(Sidebar({ user: window.__APP_SESSION__?.user, subdirs: [] }));
  const main = htmlToElement(`<main class="page__main"><h2>Document blocks for note ${noteId}</h2></main>`);
  el.appendChild(main);
  return el;
}
