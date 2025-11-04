import ejs from 'ejs';
import { Sidebar } from '../components/sidebar';
import { NoteCard } from "../components/notecard";
import { apiClient } from '../api/apiClient';
import { loadUser } from '../utils/session';

const ICONS = {
  add_new: new URL('../static/svg/icon_add_new.svg', import.meta.url).href,
}

interface NoteParam {
  id: number;
  title: string;
  text: string;
  icon: string;
  favorite: boolean;
}

/**
 * Рендерит страницу заметок с секциями избранных и недавних заметок
 * @param {Object} [params] ъ
 * @param {Array<Object>} [params.notes=[]] - Массив объектов заметок для отображения
 * @returns {HTMLElement} DOM-элемент страницы заметок
 */
export function renderNotes(app : HTMLElement) : void {
  app.innerHTML = '';
  const pageEl = document.createElement('div');
  pageEl.innerHTML = `<div class="page page--notes"></div>`;
  const page = pageEl.firstElementChild as HTMLElement;

  const user = loadUser();
  page.appendChild(Sidebar({ user: user, subdirs: [] }));
  
  const mainEl = document.createElement('div');
  mainEl.innerHTML = `<div class="page__main"></div>`;
  const main = mainEl.firstElementChild as HTMLElement;

  const categories = [
    { key: "favorites", title: "Избранное" },
    { key: "recent", title: "Заметки" },
  ];

  apiClient.getNotesForUser(user.id)
    .then(allNotes => {
      allNotes = Array.isArray(allNotes) ? allNotes : [];
      categories.forEach(({ key, title }) => {
        // const section = document.createElement('div');
        // section.classList.add('notes-section');

        // const h2 = document.createElement('h2');
        // h2.textContent = title;
        // section.appendChild(h2);

        // const list = document.createElement('div');
        // list.classList.add('notes-content');
        const sectionHtml = ejs.render(`<div class="notes-section">
            <h2><%= title %></h2>
            <div class="notes-content"></div>
          </div>`, { title });
        const sectionEl = document.createElement('div');
        sectionEl.innerHTML = sectionHtml;
        const section = sectionEl.firstElementChild as HTMLElement;
        const list = section.querySelector('.notes-content') as HTMLElement;

        const filteredNotes = allNotes.filter((note : NoteParam) => {
          if (key === "favorites") return note.favorite;
          if (key === "recent") return !note.favorite;
          return true;
        });

        filteredNotes.forEach((note : NoteParam) => {
          const noteCard = NoteCard(note);
          const link = document.createElement('a');
          link.href = `/note/${note.id}`;
          link.setAttribute('data-link', '');
          link.className = 'note-card-link';
          link.appendChild(noteCard);
          list.appendChild(link);
        });

        if (key === "recent") {
          const addCard = NoteCard({
            id: 0,
            title: "Новая заметка",
            text: "",
            icon: ICONS.add_new,
            favorite: false,
          });
          const addLink = document.createElement('a');
          addLink.href = `/note/new`;
          addLink.setAttribute('data-link', '');
          addLink.className = 'note-card-link';
          addLink.appendChild(addCard);
          list.appendChild(addLink);
        }

        section.appendChild(list);
        main.appendChild(section);
      });
    })

  page.appendChild(main);
  app.appendChild(page);
  // return page;
}
