import { htmlToElement } from "../templates.js";

const ICONS = {
  deafult_file: new URL('../assets/icon_file.svg', import.meta.url).href
};

/**
 * Создаёт DOM-элемент карточки заметки
 * @param {Object} params параметры карточки
 * @param {string} params.title заголовок заметки
 * @param {string} params.text текст заметки
 * @param {string} params.icon ссылка на иконку
 * @param {boolean} params.favorite признак избранного
 * @returns {HTMLElement} DOM-элемент карточки
 */
export function NoteCard({ title, text, icon, favorite }) {
  return htmlToElement(`
      <div class="note-card ${favorite ? "favorite" : ""}">
        <img src="${icon}" class="note-card__icon" alt="icon" onerror="this.onerror=null; this.src='${ICONS.deafult_file}';" />
        <h3 class="note-card__title">${title}</h3>
        <p class="note-card__text">${text}</p>
      </div>
  `);
}
