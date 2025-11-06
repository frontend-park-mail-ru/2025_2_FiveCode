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
              <span class="subdir-title"><%= title %></span>
              <button class="subdir-menu-dots" style="display: none;">
                <img src="<%= dots %>" alt="menu" />
              </button>
            </a>
        </li>
      `;

  Object.entries(folders).forEach(([folderName, notes]) => {
    let folderIcon = "";
    // if (folderName === "Избранное") {
    //   folderIcon = ICONS.icon_favorite;
    // } else if (folderName === "Заметки") {
    //   folderIcon = ICONS.icon_folder;
    // }

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
      const noteItemHtml = ejs.render(noteItemTemplate, {
        id: item.id,
        title: item.title,
        dots: ICONS.dots,
      });
      const noteItemEl = document.createElement("div");
      noteItemEl.innerHTML = noteItemHtml;
      const noteItem = noteItemEl.firstElementChild as HTMLElement;
      
      const dotsButton = noteItem.querySelector('.subdir-menu-dots');
      dotsButton?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const existingMenu = document.querySelector('.note-menu');
        if (existingMenu) existingMenu.remove();
        
        const menu = document.createElement('div');
        menu.className = 'note-menu';
        menu.innerHTML = `
          <button class="rename-note" data-note-id="${item.id}">Переименовать</button>
          <button class="delete-note" data-note-id="${item.id}">Удалить</button>
        `;
        
        const rect = dotsButton.getBoundingClientRect();
        menu.style.top = rect.bottom + 'px';
        menu.style.left = rect.left + 'px';
        
        document.body.appendChild(menu);

        const deleteButton = menu.querySelector('.delete-note');
        deleteButton?.addEventListener('click', () => {
          const deleteModal = createDeleteNoteModal();
          document.body.appendChild(deleteModal);
          
          deleteModal.querySelector(".delete-note-confirm")?.addEventListener("click", async () => {
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
        
        document.addEventListener('click', function closeMenu(e) {
          if (!menu.contains(e.target as Node)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
          }
        });
      });
      
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
