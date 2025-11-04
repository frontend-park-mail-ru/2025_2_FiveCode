import ejs from 'ejs';

const ICONS = {
  default_file: new URL('../static/svg/icon_dot.svg', import.meta.url).href,
  icon_triangle: new URL('../static/svg/icon_triangle.svg', import.meta.url).href,
  icon_favorite: new URL('../static/svg/icon_favorite.svg', import.meta.url).href,
  icon_shared: new URL('../static/svg/icon_shared.svg', import.meta.url).href,
  icon_folder: new URL('../static/svg/icon_folder.svg', import.meta.url).href,
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

    const SYSTEM_FOLDERS = {
        FAVORITES: 'Избранное',
        SHARED: 'Совместный доступ'
    } as const;
    type FolderMap = { [key: string]: Note[] };

    const folders: FolderMap = Object.values(SYSTEM_FOLDERS).reduce((acc, folderName) => {
        acc[folderName] = [];
        return acc;
    }, {} as FolderMap);

    items.forEach((note: Note) => {
        if (note.favorite) {
            folders[SYSTEM_FOLDERS.FAVORITES]?.push({...note});
        }
                const folder = note.folder;
        if (!folders[folder]) {
            folders[folder] = [];
        }
        folders[folder]?.push(note);
    });
    const folderIcons = new Map<string, string>();
    
    const orderedFolders: FolderMap = {};
    
    [SYSTEM_FOLDERS.FAVORITES, SYSTEM_FOLDERS.SHARED].forEach(key => {
        orderedFolders[key] = folders[key] || [];
        folderIcons.set(key, 
            key === SYSTEM_FOLDERS.FAVORITES ? ICONS.icon_favorite :
            key === SYSTEM_FOLDERS.SHARED ? ICONS.icon_shared :
            ICONS.icon_folder
        );
        delete folders[key];
    });
    
    Object.keys(folders).sort().forEach(key => {
        orderedFolders[key] = folders[key] || [];
        folderIcons.set(key, ICONS.icon_folder);
    });

    const folderTemplate = `
      <div class="folder">
        <div class="folder__header">
          <img src="<%= icon_triangle %>" alt="triangle" class="folder__arrow" />
          
          <span class="folder__title"><%= folderName %></span>
        </div>
        <ul class="folder__list"></ul>
        <% if (folderName !== 'Избранное') { %>
          <div href="/note/new" class="add-note-button" data-folder="<%= folderName %>" data-link="">
            + Добавить новую заметку
          </div>
        <% } %>
      </div>
    `;

    const noteItemTemplate  = `
        <li class="subdir__item">
        <div class="subdir__header">
          <img src="<%= icon %>" alt="icon" class="subdir__icon" onerror="this.onerror=null; this.src='<%= defaultIcon %>';" />
          <span class="subdir__title"><%= title %></span>
        </div>
      </li>
      `;
    
    Object.entries(orderedFolders).forEach(([folderName, notes]) => {
      const folderHtml = ejs.render(folderTemplate, {
      icon_triangle: ICONS.icon_triangle,
      folderName,
      icon_folder: folderIcons.get(folderName) || ICONS.icon_folder,
      });
      const folderEl = document.createElement('div');
      folderEl.innerHTML = folderHtml;
      const folderElement = folderEl.firstElementChild as HTMLElement;
      
      const listEl = folderElement.querySelector(".folder__list") as HTMLElement;
      const arrow = folderElement.querySelector(".folder__arrow") as HTMLElement;
      const header = folderElement.querySelector(".folder__header") as HTMLElement;
      // состояние свернутости/развернутости
      
      let collapsed = false;
      listEl.style.display = collapsed ? "none" : "block";
      arrow.classList.toggle("folder__arrow--rotated", !collapsed);

      header.setAttribute("role", "button");
      header.setAttribute("tabindex", "0");
      header.setAttribute("aria-expanded", String(!collapsed));

      const updateState = () => {
        listEl.style.display = collapsed ? "none" : "block";
        arrow.classList.toggle("folder__arrow--rotated", !collapsed);
        header.setAttribute("aria-expanded", String(!collapsed));
      };
      
      
      notes.forEach((item: Note) => {
      const noteItemHtml = ejs.render(noteItemTemplate, {
        icon: item.icon,
        title: item.title,
        defaultIcon: ICONS.default_file,
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

      const addButton = folderElement.querySelector('.add-note-button');
      if (addButton) {
        addButton.addEventListener('click', (e) => {
          e.preventDefault();
          import('../router').then(({ default: router }) => {
            router.navigate('note/new');
          });
        });
      }

      container.appendChild(folderElement);
    });

  return container;

}