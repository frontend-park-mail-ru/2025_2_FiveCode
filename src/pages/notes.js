import { htmlToElement } from '../templates.js';
import { Sidebar } from '../components/sidebar.js';
import { NoteCard } from "../components/notecard.js";
import { apiClient } from '../api/apiClient.js';
import { loadUser } from '../utils/session.js';

/**
 * Рендерит страницу заметок с секциями избранных и недавних заметок
 * @param {Object} [params] ъ
 * @param {Array<Object>} [params.notes=[]] - Массив объектов заметок для отображения
 * @returns {HTMLElement} DOM-элемент страницы заметок
 */
export function renderNotes({ notes = [] } = {}) {
  const page = htmlToElement(`<div class="page page--notes"></div>`);

  const user = loadUser();
  page.appendChild(Sidebar({ user: user, subdirs: [] }));
  
  const main = document.createElement('div');
  main.classList.add('page__main');

  const categories = [
    { key: "favorites", title: "Избранное" },
    { key: "recent", title: "Заметки" },
  ];

  apiClient.getNotesForUser(user.id)
    .then(allNotes => {
      allNotes = Array.isArray(allNotes) ? allNotes : [];
      categories.forEach(({ key, title }) => {
        const section = document.createElement('div');
        section.classList.add('notes-section');

        const h2 = document.createElement('h2');
        h2.textContent = title;
        section.appendChild(h2);

        const list = document.createElement('div');
        list.classList.add('notes-content');

        const filteredNotes = allNotes.filter(note => {
          if (key === "favorites") return note.favorite;
          if (key === "recent") return !note.favorite;
          return true;
        });

        filteredNotes.forEach((note) => {
          const noteCard = NoteCard(note);
          noteCard.addEventListener('click', () => {
            window.location.href = `edit/${note.id}`;
          });
          list.appendChild(noteCard);
        });

        if (key === "recent") {
          const addCard = NoteCard({
            id: 0,
            title: "+ Create new note",
            text: "",
            icon: "./src/assets/icon_file.svg",
            favorite: false,
          });
          addCard.addEventListener('click', () => {
            window.location.href = `edit/new`;
          });
          list.appendChild(addCard);
        }

        section.appendChild(list);
        main.appendChild(section);
      });
    })

  page.appendChild(main);
  return page;
}
