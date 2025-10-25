import ejs from 'ejs';

const ICONS = {
  deafult_file: new URL('../static/svg/icon_file.svg', import.meta.url).href,
  icon_triangle: new URL('../static/svg/icon_triangle.svg', import.meta.url).href,
};

interface Note{
  id: number;
  title: string;
  icon: string;
  text: string;
  folder: string; 
  favorite: boolean;
}

interface SubdirectoriesParams {
  items: Note[];
}

/**
 * Список заметок (без вложенности)
 * @param {Array} items - массив заметок
 */
export function Subdirectories({items = []} : SubdirectoriesParams): HTMLElement {
    const container = document.createElement("div");
    container.classList.add("folders");

    // группировка заметок по папкам
    const folders = items.reduce((acc: Record<string, Note[]>, note: Note) => {
        if (acc[note.folder]) acc[note.folder] = [];
        acc[note.folder]?.push(note);
        return acc;
    }, {});

    const folderTemplate = `
      <div class="folder">
        <div class="folder-header">
          <img src="<%= icon_triangle %>" alt="triangle" class="folder-arrow" />
          <span class="folder-title"><%= foldername %></span>
        </div>
        <ul class="folder-list"></ul>
      </div>
    `;

    const noteItemTemplate  = `
        <li class="subdir-item">
        <div class="subdir-header">
          <img src="<%= icon %>" alt="icon" class="subdir-icon" onerror="this.onerror=null; this.src='<%= defaultIcon %>';" />
          <span class="subdir-title"><%= title %></span>
        </div>
      </li>
      `;
    
    Object.entries(folders).forEach(([folderName, notes]) => {
      const folderHtml = ejs.render(folderTemplate, {
      iconTriangle: ICONS.icon_triangle,
      folderName,
      });
      const folderEl = document.createElement('div');
      folderEl.innerHTML = folderHtml;
      const folderElement = folderEl.firstElementChild as HTMLElement;
      
      const listEl = folderElement.querySelector(".folder-list") as HTMLElement;
      const arrow = folderElement.querySelector(".folder-arrow") as HTMLElement;
      const header = folderElement.querySelector(".folder-header") as HTMLElement;
      // состояние свернутости/развернутости
      let collapsed = true;
      const updateState = () => {
        listEl.style.display = collapsed ? "none" : "block";
        arrow.classList.toggle("rotated", !collapsed);
        header.setAttribute("aria-expanded", String(!collapsed));
      };
      
      // Папки заметок
      notes.forEach((item: Note) => {
      const noteItemHtml = ejs.render(noteItemTemplate, {
        icon: item.icon,
        title: item.title,
        defaultIcon: ICONS.deafult_file,
      });
      const noteItemEl = document.createElement('div');
      noteItemEl.innerHTML = noteItemHtml;
      listEl.appendChild(noteItemEl.firstElementChild as HTMLElement);
      });

      header.addEventListener("click", () => {
      collapsed = !collapsed;
      updateState();
      });

      header.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        collapsed = !collapsed;
        updateState();
        }
      });
      container.appendChild(folderElement);
    });

  return container;

}