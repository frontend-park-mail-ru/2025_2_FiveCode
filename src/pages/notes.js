import { htmlToElement } from '../templates.js';
import { Sidebar } from '../components/sidebar.js';
import { NoteCard } from "../components/notecard.js";
import { apiClient } from '../api/apiClient.js';
import { loadUser } from '../utils/session.js';

const ICONS = {
  add_new: new URL('../assets/icon_add_new.svg', import.meta.url).href,
}

/**
 * Рендерит страницу заметок с секциями избранных и недавних заметок
 * @param {Object} [params] ъ
 * @param {Array<Object>} [params.notes=[]] - Массив объектов заметок для отображения
 * @returns {HTMLElement} DOM-элемент страницы заметок
 */
export function renderNotes(app) {
  app.innerHTML = '';
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
            // window.location.href = `edit/${note.id}`;
            console.log(`Note ${note.id} clicked`);
          });
          list.appendChild(noteCard);
        });

        if (key === "recent") {
          const addCard = NoteCard({
            id: 0,
            title: "Новая заметка",
            text: "",
            icon: "./src/assets/icon_add_new.svg",
            favorite: false,
          });
          addCard.addEventListener('click', () => {
            // window.location.href = `edit/new`;
            console.log('Create new note clicked');
          });
          list.appendChild(addCard);
        }

        section.appendChild(list);
        main.appendChild(section);
      });
    })

  page.appendChild(main);
  app.appendChild(page);
  // return page;
}
