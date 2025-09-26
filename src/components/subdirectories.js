import { htmlToElement } from "../templates.js";
import { mockNotes } from "../mock/notes.js";

const ICONS = {
  deafult_file: new URL('../assets/icon_file.svg', import.meta.url).href,
  icon_triangle: new URL('../assets/icon_triangle.svg', import.meta.url).href,
};

/**
 * Список заметок (без вложенности)
 * @param {Array} items - массив заметок
 */
export function Subdirectories({items = []}) {
    const container = document.createElement("div");
    container.classList.add("folders");

    // группируем заметки по папкам
    const folders = items.reduce((acc, note) => {
        if (!acc[note.folder]) acc[note.folder] = [];
        acc[note.folder].push(note);
        return acc;
    }, {});

    Object.entries(folders).forEach(([folderName, notes]) => {
    const folderEl = htmlToElement(`
      <div class="folder">
        <div class="folder-header">
          <img src="${ICONS.icon_triangle}" alt="triangle" class="folder-arrow" />
          <span class="folder-title">${folderName}</span>
        </div>
        <ul class="folder-list"></ul>
      </div>
    `);
    
    const listEl = folderEl.querySelector(".folder-list");
    const arrow = folderEl.querySelector(".folder-arrow");

    // добавляем заметки в список
    notes.forEach((item) => {
      const li = htmlToElement(`
        <li class="subdir-item">
        <div class="subdir-header">
          <img src="${item.icon}" alt="icon" class="subdir-icon" onerror="this.onerror=null; this.src='${ICONS.deafult_file}';" />
          <span class="subdir-title">${item.title}</span>
        </div>
      </li>
      `);
      listEl.appendChild(li);
    });

    // обработчик сворачивания/разворачивания
    const toggleBtn = folderEl.querySelector(".folder-toggle");
    let collapsed = false;
  folderEl.querySelector(".folder-header").addEventListener("click", () => {
    collapsed = !collapsed;
    listEl.style.display = collapsed ? "none" : "block";
    arrow.classList.toggle("rotated", !collapsed); // вниз при раскрытии
  });

    container.appendChild(folderEl);
  });

  return container;

}
//     items.forEach((item) => {
//     const li = htmlToElement(`
      
//     `);

//     container.appendChild(li);
//   });

//   return container;
// }
