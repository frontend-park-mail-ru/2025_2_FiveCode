import ejs from "ejs";
import { NoteCard } from "../components/notecard";
import { apiClient } from "../api/apiClient";
import router from "../router";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "../components/notification";

const ICONS = {
  add_new: new URL("../static/svg/icon_add_new.svg", import.meta.url).href,
};

export async function renderNotes(): Promise<void> {
  const main = document.getElementById("main-content");
  if (!main) return;

  try {
    const allNotes = await apiClient.getNotesForUser();

    const currentPath = window.location.pathname;
    if (currentPath !== "/notes" && currentPath !== "/") {
      return;
    }

    main.innerHTML = "";

    const categories = [
      { key: "favorites", title: "Избранное" },
      { key: "recent", title: "Заметки" },
    ];

    const processedNotes = (Array.isArray(allNotes) ? allNotes : []).map(
      (note) => ({ ...note, favorite: note.is_favorite })
    );

    categories.forEach(({ key, title }) => {
      const filteredNotes = processedNotes.filter((note: any) => {
        if (key === "favorites") return note.favorite;
        if (key === "recent") return !note.favorite;
        return true;
      });

      if (key === "favorites" && filteredNotes.length === 0) {
        return;
      }

      const sectionHtml = ejs.render(
        `<div class="notes-section"><h2><%= title %></h2><div class="notes-content"></div></div>`,
        { title }
      );
      const sectionEl = document.createElement("div");
      sectionEl.innerHTML = sectionHtml;
      const section = sectionEl.firstElementChild as HTMLElement;
      const list = section.querySelector(".notes-content") as HTMLElement;

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
          icon: { url: ICONS.add_new },
          favorite: false,
        });

        addCard.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            const newNote = await apiClient.createNote();
            showNotification("Заметка создана", "success");
            router.navigate(`note/${newNote.id}`);
            document.dispatchEvent(new CustomEvent("notesUpdated"));
          } catch (error) {
            handleError(error, "Не удалось создать заметку");
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
    handleError(error, "Не удалось загрузить заметки");
    if (
      window.location.pathname === "/notes" ||
      window.location.pathname === "/"
    ) {
      main.innerHTML =
        "<p style='text-align:center; margin-top:20px; color:gray;'>Не удалось загрузить заметки.</p>";
    }
  }
}

const onNotesUpdated = () => {
  const currentPath = window.location.pathname;
  if (currentPath === "/notes" || currentPath === "/") {
    renderNotes().catch((err) =>
      console.error("Failed to refresh notes after update:", err)
    );
  }
};

document.removeEventListener("notesUpdated", onNotesUpdated);
document.addEventListener("notesUpdated", onNotesUpdated);
