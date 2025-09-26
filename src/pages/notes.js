import { htmlToElement } from '../templates.js';
import { Sidebar } from '../components/sidebar.js';
import { NoteCard } from "../components/notecard.js";
import { mockNotes } from "../mock/notes.js";

export function renderNotes({ notes = [] } = {}) {
  const page = htmlToElement(`<div class="page page--notes"></div>`);
  page.appendChild(Sidebar({ user: window.__APP_SESSION__?.user, subdirs: [] }));
  
  const main = document.createElement('div');
  main.classList.add('page__main');

  // --- Категории ---
  const categories = [
    { key: "favorites", title: "Favorites" },
    { key: "recent", title: "Recent" },
  ];

  categories.forEach(({ key, title }) => {
    // секция
    const section = document.createElement('div');
    section.classList.add('notes-section');

    // заголовок
    const h2 = document.createElement('h2');
    h2.textContent = title;
    section.appendChild(h2);

    // контейнер для карточек
    const list = document.createElement('div');
    list.classList.add('notes-content');

    // фильтруем заметки по категории
    const filteredNotes = mockNotes.filter(note => {
      if (key === "favorites") return note.favorite;
      if (key === "recent") return !note.favorite; 
      return true;
    });

    // карточки
    filteredNotes.forEach((note) => {
      const noteCard = NoteCard(note);
      noteCard.addEventListener('click', () => {
        window.location.href = `edit/${note.id}`;
      });
      list.appendChild(noteCard);
    });

    // Добавляем кнопку "новая заметка" только в recent
    if (key === "recent") {
      const addCard = NoteCard({
        id: 0,
        title: "+ Create new note",
        text: "",
        icon: "./src/assets/file.svg",
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

  page.appendChild(main);
  return page;
}
