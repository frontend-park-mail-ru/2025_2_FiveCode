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

export async function renderNotes(app : HTMLElement) : Promise<void> {
  app.innerHTML = '';
  const pageEl = document.createElement('div');
  pageEl.innerHTML = `<div class="page page--notes"></div>`;
  const page = pageEl.firstElementChild as HTMLElement;

  const user = loadUser();
  
  const mainEl = document.createElement('div');
  mainEl.innerHTML = `<div class="page__main"></div>`;
  const main = mainEl.firstElementChild as HTMLElement;

  page.appendChild(main);
  app.appendChild(page);

  try {
    const allNotes = await apiClient.getNotesForUser();
    
    page.insertBefore(Sidebar({ user: user, notes: allNotes }), main);

    const categories = [
      { key: "favorites", title: "Избранное" },
      { key: "recent", title: "Заметки" },
    ];

    allNotes.forEach((note: any) => {
      let displayTitle = note.title;
      try {
        const parsedData = JSON.parse(note.title);
        displayTitle = parsedData.title || 'Заметка без заголовка';
      } catch(e) {}
      note.title = displayTitle;
    });

    categories.forEach(({ key, title }) => {
      const sectionHtml = ejs.render(`<div class="notes-section"><h2><%= title %></h2><div class="notes-content"></div></div>`, { title });
      const sectionEl = document.createElement('div');
      sectionEl.innerHTML = sectionHtml;
      const section = sectionEl.firstElementChild as HTMLElement;
      const list = section.querySelector('.notes-content') as HTMLElement;

      const filteredNotes = (Array.isArray(allNotes) ? allNotes : []).filter((note : NoteParam) => {
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
          id: 0, title: "Новая заметка", text: "", icon: ICONS.add_new, favorite: false,
        });
        const addLink = document.createElement('a');
        addLink.href = `/note/new`;
        addLink.setAttribute('data-link', '');
        addLink.className = 'note-card-link';
        addLink.appendChild(addCard);
        list.appendChild(addLink);
      }

      main.appendChild(section);
    });
  } catch (error) {
    console.error("Failed to render notes page:", error);
    main.innerHTML = '<p>Не удалось загрузить заметки.</p>';
  }
}