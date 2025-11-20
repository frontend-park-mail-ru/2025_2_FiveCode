import ejs from "ejs";
import { createDeleteNoteModal } from "../components/deleteNoteModal";
import { apiClient } from "../api/apiClient";
import router from "../router";

const ICONS = {
  icon_triangle: new URL("../static/svg/icon_triangle.svg", import.meta.url)
    .href,
  icon_favorite: new URL("../static/svg/icon_favorite.svg", import.meta.url)
    .href,
  icon_folder: new URL("../static/svg/icon_folder.svg", import.meta.url).href,
  dots: new URL("../static/svg/icon_dots.svg", import.meta.url).href,
  star: new URL("../static/svg/icon_star.svg", import.meta.url).href,
};

interface Note {
  id: number;
  title: string;
  icon: string;
  favorite: boolean;
}

interface SubdirectoriesParams {
  items: Note[];
}

export function Subdirectories({
  items = [],
}: SubdirectoriesParams): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const folders: { [key: string]: Note[] } = {
    Избранное: [],
    Заметки: [],
  };

  items.forEach((note: Note) => {
    if (note.favorite && folders["Избранное"]) {
      folders["Избранное"].push(note);
    } else if (folders["Заметки"]) {
      folders["Заметки"].push(note);
    }
  });

  const folderTemplate = `
      <div class="folder">
        <div class="folder-header">
          <img src="<%= icon_triangle %>" alt="triangle" class="folder-arrow" />
          <% if (folderIcon) { %>
            <img src="<%= folderIcon %>" alt="icon" class="folder-icon" />
          <% } %>
          <span class="folder-title"><%= folderName %></span>
        </div>
        <ul class="folder-list"></ul>
        <% if (folderName === 'Заметки') { %>
          <div class="add-note-button">
            + Добавить новую заметку
          </div>
        <% } %>
      </div>
    `;

  const noteItemTemplate = `
        <li class="subdir-item">
            <a href="/note/<%= id %>" class="subdir-header" data-link>
              <span class="subdir-title">
                <%= title.length > 18 ? title.substring(0, 17) + '...' : title %>
              </span>
              <span class="subdir-buttons">
                <button class="subdir-menu-dots" style="display: none;">
                  <img src="<%= dots %>" alt="menu" />
                </button>
                <button class="subdir-menu-favorite" style="display: none;">
                  <img src="<%= star %>" alt="Favorite" />
                </button>
              </span>
            </a>
        </li>
      `;

  Object.entries(folders).forEach(([folderName, notes]) => {
    let folderIcon = "";

    if (folderName === "Избранное" && notes.length === 0) {
      return;
    }

    const folderHtml = ejs.render(folderTemplate, {
      icon_triangle: ICONS.icon_triangle,
      folderName,
      folderIcon,
    });
    const folderEl = document.createElement("div");
    folderEl.innerHTML = folderHtml;
    const folderElement = folderEl.firstElementChild as HTMLElement;

    const listEl = folderElement.querySelector(".folder-list") as HTMLElement;
    const arrow = folderElement.querySelector(".folder-arrow") as HTMLElement;
    const header = folderElement.querySelector(".folder-header") as HTMLElement;

    let collapsed = false;
    listEl.style.display = collapsed ? "none" : "block";
    arrow.classList.toggle("rotated", !collapsed);
    header.setAttribute("aria-expanded", String(!collapsed));

    const updateState = () => {
      listEl.style.display = collapsed ? "none" : "block";
      arrow.classList.toggle("rotated", !collapsed);
      header.setAttribute("aria-expanded", String(!collapsed));
    };

    notes.forEach((item: Note) => {
      let star = ICONS.star;
      if (folderName === "Избранное") {
        star = ICONS.icon_favorite;
      }
      const noteItemHtml = ejs.render(noteItemTemplate, {
        id: item.id,
        title: item.title,
        dots: ICONS.dots,
        star: star,
      });
      const noteItemEl = document.createElement("div");
      noteItemEl.innerHTML = noteItemHtml;
      const noteItem = noteItemEl.firstElementChild as HTMLElement;

      const dotsButton = noteItem.querySelector(".subdir-menu-dots");
      dotsButton?.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const existingMenu = document.querySelector(".note-menu");
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement("div");
        menu.className = "note-menu";
        menu.innerHTML = `

          <button class="delete-note" data-note-id="${item.id}">Удалить</button>
        `;

        const rect = dotsButton.getBoundingClientRect();
        menu.style.top = rect.bottom + "px";
        menu.style.left = rect.left + "px";

        document.body.appendChild(menu);

        const deleteButton = menu.querySelector(".delete-note");
        deleteButton?.addEventListener("click", () => {
          const deleteModal = createDeleteNoteModal();
          document.body.appendChild(deleteModal);

          deleteModal
            .querySelector(".delete-note-confirm")
            ?.addEventListener("click", async () => {
              try {
                await apiClient.deleteNote(item.id);
                document.dispatchEvent(new CustomEvent("notesUpdated"));
                deleteModal.remove();
                menu.remove();
                router.navigate("notes");
              } catch (err) {
                console.error("Failed to delete note:", err);
              }
            });
        });

        document.addEventListener("click", function closeMenu(e) {
          if (!menu.contains(e.target as Node)) {
            menu.remove();
            document.removeEventListener("click", closeMenu);
          }
        });
      });

      const favoriteButton = noteItem.querySelector(".subdir-menu-favorite");
      favoriteButton?.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const newFavoriteStatus = !favoriteButton.classList.contains("active");
        try {
          await apiClient.toggleFavorite(item.id as number, newFavoriteStatus);
          favoriteButton.classList.toggle("active", newFavoriteStatus);
          document.dispatchEvent(
            new CustomEvent("notesUpdated", {
              detail: { noteId: item.id, isFavorite: newFavoriteStatus },
            })
          );
        } catch (err) {
          console.error("Failed to update favorite status:", err);
        }
      });
      if (folderName === "Избранное") {
        favoriteButton?.classList.add("active");
      }

      listEl.appendChild(noteItem);
    });

    header.addEventListener("click", () => {
      collapsed = !collapsed;
      updateState();
    });

    const addButton = folderElement.querySelector(".add-note-button");
    if (addButton) {
      addButton.addEventListener("click", (e) => {
        e.preventDefault();
      });
    }

    fragment.appendChild(folderElement);
  });

  return fragment;
}
