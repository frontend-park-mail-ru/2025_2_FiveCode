import ejs from "ejs";

const ICONS = {
  default_file: new URL("../static/svg/icon_dot.svg", import.meta.url).href,
  icon_triangle: new URL("../static/svg/icon_triangle.svg", import.meta.url)
    .href,
  icon_favorite: new URL("../static/svg/icon_favorite.svg", import.meta.url)
    .href,
  icon_folder: new URL("../static/svg/icon_folder.svg", import.meta.url).href,
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
}: SubdirectoriesParams): HTMLElement {
  const container = document.createElement("div");
  container.classList.add("folders");

  type FolderMap = { [key: string]: Note[] };

  const folders: FolderMap = {
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
              <img src="<%= icon %>" alt="icon" class="subdir-icon" onerror="this.onerror=null; this.src='<%= defaultIcon %>';" />
              <span class="subdir-title"><%= title %></span>
            </a>
        </li>
      `;

  Object.entries(folders).forEach(([folderName, notes]) => {
    let folderIcon = "";
    if (folderName === "Избранное") {
      folderIcon = ICONS.icon_favorite;
    } else if (folderName === "Заметки") {
      folderIcon = ICONS.icon_folder;
    }

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
        icon: item.icon,
        title: item.title,
        defaultIcon: ICONS.default_file,
      });
      const noteItemEl = document.createElement("div");
      noteItemEl.innerHTML = noteItemHtml;
      listEl.appendChild(noteItemEl.firstElementChild as HTMLElement);
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

    container.appendChild(folderElement);
  });

  return container;
}
