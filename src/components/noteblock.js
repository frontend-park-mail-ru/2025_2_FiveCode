import { htmlToElement } from '../templates.js';

/**
 * NoteBlock (одна заметка в списке)
 */
export function NoteBlock({ id, title, icon }) {
  const el = htmlToElement(`
    <div class="note-block">
      <img src="${icon || '/default-icon.png'}" alt="icon" class="note-block__icon"/>
      <a href="/notes/${id}" data-link>${title}</a>
      <button class="note-block__edit">✏</button>
    </div>
  `);

  el.querySelector('a').addEventListener('click', e => {
    e.preventDefault();
    window.navigate(`/view/${id}`);
  });
  
  el.querySelector('.note-block__edit').addEventListener('click', e => {
    e.stopPropagation();
    alert('TODO: edit note ' + id);
  });

  return el;
}
