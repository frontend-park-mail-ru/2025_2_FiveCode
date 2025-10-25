import ejs from 'ejs';

const ICONS = {
  deafult_file: new URL('../static/svg/icon_file.svg', import.meta.url).href
};

interface NoteCardParams{
  id: number;
  title: string; 
  text: string; 
  icon: string;
  favorite: boolean;
}

/**
 * Создаёт DOM-элемент карточки заметки
 * @param {Object} params параметры карточки
 * @param {string} params.title заголовок заметки
 * @param {string} params.text текст заметки
 * @param {string} params.icon ссылка на иконку
 * @param {boolean} params.favorite признак избранного
 * @returns {HTMLElement} DOM-элемент карточки
 */
export function NoteCard({ title, text, icon, favorite }: NoteCardParams): HTMLElement {
  const template = `
    <div class="note-card <%= favorite ? 'favorite' : '' %>">
      <img
        src="<%= icon %>"
        class="note-card__icon"
        alt="icon"
        onerror="this.onerror=null; this.src='<%= defaultIcon %>';"
      />
      <h3 class="note-card__title"><%= title %></h3>
      <p class="note-card__text"><%= text %></p>
    </div>
  `;

  const html = ejs.render(template, {
    title, 
    text, 
    icon, 
    favorite, 
    defaultIcon: ICONS.deafult_file,
  });
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.firstElementChild as HTMLElement;
}
