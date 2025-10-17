import { htmlToElement } from "../templates.js";

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

    // группировка заметок по папкам
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
  //   const toggleBtn = folderEl.querySelector(".folder-toggle");
  //   let collapsed = false;
  // folderEl.querySelector(".folder-header").addEventListener("click", () => {
  //   collapsed = !collapsed;
  //   listEl.style.display = collapsed ? "none" : "block";
  //   arrow.classList.toggle("rotated", !collapsed);
  // });
  // начальное состояние — свернуто
    let collapsed = true;
    // применить начальное отображение и класс стрелки
    listEl.style.display = collapsed ? "none" : "block";
    arrow.classList.toggle("rotated", !collapsed);

    const header = folderEl.querySelector(".folder-header");
    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", String(!collapsed));

    const updateState = () => {
      listEl.style.display = collapsed ? "none" : "block";
      arrow.classList.toggle("rotated", !collapsed);
      header.setAttribute("aria-expanded", String(!collapsed));
    };

    header.addEventListener("click", () => {
      collapsed = !collapsed;
      updateState();
    });
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        collapsed = !collapsed;
        updateState();
      }
    });

    container.appendChild(folderEl);
  });

  return container;

}