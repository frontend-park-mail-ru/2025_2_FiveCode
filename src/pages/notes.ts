import ejs from "ejs";
import { NoteCard } from "../components/notecard";
import { apiClient } from "../api/apiClient";
import router from "../router";

const ICONS = {
  add_new: new URL("../static/svg/icon_add_new.svg", import.meta.url).href,
};

export async function renderNotes(): Promise<void> {
  const main = document.getElementById("main-content");
  if (!main) return;
  main.innerHTML = "";

  try {
    const allNotes = await apiClient.getNotesForUser();

    const categories = [
      { key: "favorites", title: "Избранное" },
      { key: "recent", title: "Заметки" },
    ];

    const processedNotes = (Array.isArray(allNotes) ? allNotes : []).map(
      (note) => ({ ...note, favorite: note.is_favorite })
    );

    categories.forEach(({ key, title }) => {
      const sectionHtml = ejs.render(
        `<div class="notes-section"><h2><%= title %></h2><div class="notes-content"></div></div>`,
        { title }
      );
      const sectionEl = document.createElement("div");
      sectionEl.innerHTML = sectionHtml;
      const section = sectionEl.firstElementChild as HTMLElement;
      const list = section.querySelector(".notes-content") as HTMLElement;

      const filteredNotes = processedNotes.filter((note: any) => {
        if (key === "favorites") return note.favorite;
        if (key === "recent") return !note.favorite;
        return true;
      });

      filteredNotes.forEach((note: any) => {
        const noteCard = NoteCard(note);
        const link = document.createElement("a");
        link.href = `/note/${note.id}`;
        link.setAttribute("data-link", "");
        link.className = "note-card-link";
        link.appendChild(noteCard);
        list.appendChild(link);
      });

      if (key === "recent") {
        const addCard = NoteCard({
          id: 0,
          title: "Создать заметку",
          text: "",
          icon: ICONS.add_new,
          favorite: false,
        });

        addCard.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            const newNote = await apiClient.createNote();
            document.dispatchEvent(new CustomEvent("notesUpdated"));
            router.navigate(`note/${newNote.id}`);
          } catch (error) {
            console.error("Failed to create new note", error);
          }
        });

        const addLink = document.createElement("a");
        addLink.href = `#`;
        addLink.className = "note-card-link";
        addLink.appendChild(addCard);
        list.appendChild(addLink);
      }

      main.appendChild(section);
    });
  } catch (error) {
    console.error("Failed to render notes page:", error);
    main.innerHTML = "<p>Не удалось загрузить заметки.</p>";
  }
}
