import { htmlToElement } from './templates.js';

/** Sidebar компонент */
export function Sidebar(user){
  const el = htmlToElement(`
    <div class="sidebar">
      <div style="font-weight:700;margin-bottom:8px">Username</div>
      <div><a href="/" data-link>Home</a></div>
      <div><a href="/notes" data-link>Notes</a></div>
      <div style="position:absolute;bottom:16px">Settings</div>
    </div>
  `);
  // делегируем
  el.addEventListener('click', (e)=>{
    const a = e.target.closest('a[data-link]');
    if (a){ e.preventDefault(); window.navigate(a.getAttribute('href')); }
  });
  return el;
}

/** NoteCard */
export function NoteCard({title, body}){
  const el = htmlToElement(`<div class="card"><div class="title">${title}</div><div>${body || ''}</div></div>`);
  return el;
}
