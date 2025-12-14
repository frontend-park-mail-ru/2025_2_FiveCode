import ejs from "ejs";
import { createDeleteNoteModal } from "../components/deleteNoteModal";
import { apiClient } from "../api/apiClient";
import router from "../router";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "./notification";
import { chooseIconModal } from './chooseIconModal';

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
  owner_id: number;
  title: string;
  icon: Icon;
  favorite: boolean;
  parent_note_id?: number | null;
}

interface Icon {
  id?: number;
  name?: string;
  url: string;
}


interface SubdirectoriesParams {
  items: Note[];
  currentUserId?: number;
}

export function Subdirectories({
  items = [],
  currentUserId,
}: SubdirectoriesParams): DocumentFragment {
  const fragment = document.createDocumentFragment();

  const root = document.createElement("div");
  root.className = "subdirectories-root";

  const folders: Record<string, Note[]> = {
    Совместный_доступ: [],
    Избранное: [],
    Заметки: [],
  };

  const subNotes = items.filter((n) => n.parent_note_id != null);
  const allNotes = items.filter((n) => n.parent_note_id == null);

  const getSubNotes = (id: number) =>
    subNotes.filter((sn) => sn.parent_note_id === id);

  const folderTemplate = `
    <div class="folder">
      <div class="folder-header">
        <img src="<%= icon_triangle %>" class="folder-arrow" />
        <% if (folderIcon) { %>
          <img src="<%= folderIcon %>" class="folder-icon" />
        <% } %>
        <span class="folder-title"><%= folderName.replace('_', ' ') %></span>
      </div>
      <ul class="folder-list"></ul>
        <% if (folderName === "Заметки") { %>
            <div class="add-note-button">+ Добавить новую заметку</div>
        <% } %>
    </div>
  `;

  const noteItemTemplate = `
    <li class="subdir-item <%= isActive ? 'subdir-item--active' : '' %>" data-note-id="<%= id %>">
      <a href="/note/<%= id %>" class="subdir-header" data-link>      
      <img src="<%= icon_triangle %>" class="folder-arrow" />
      
      <img src="<%= icon %>" style="display: flex; aligh-items: center; width: 16px;">

        <span class="subdir-title">
          <%= title.length > 18 ? title.substring(0,17) + '...' : title %>
        </span>
        <span class="subdir-buttons">
          <% if (canEdit) { %>
          <button class="subdir-menu-dots" style="display:none;">
            <img src="<%= dots %>" />
          </button>
          <% } %>
          <button class="subdir-menu-favorite" style="display:none;">
            <img src="<%= star %>" />
          </button>
        </span>
      </a>

      <% if (isActive && canEdit) { %>
        <button class="add-subnote-btn">+ Добавить подзаметку</button>
      <% } %>

      <% if (showSubNotes) { %>
        <ul class="subnotes-list" style="display:block;">
          <%- subnotesHTML %>
        </ul>
      <% } else if (hasSubNotes) { %>
        <ul class="subnotes-list" style="display:none;">
          <%- subnotesHTML %>
        </ul>
      <% } %>
    </li>
  `;

  const subnoteItemTemplate = `
    <li class="subnote-item" data-subnote-id="<%= id %>">
      <a href="/note/<%= id %>" class="subnote-header" data-link>
        <span class="subnote-title"><%= title.length > 18 ? title.substring(0,17) + '...' : title %></span>
        <span class="subnote-buttons">
          <button class="subnote-menu-dots">
            <img src="<%= dots %>" />
          </button>
        </span>
      </a>
    </li>
  `;

  allNotes.forEach((note) => {
    if (note.favorite && folders["Избранное"]) {
      folders["Избранное"].push(note);
    } else if (currentUserId && note.owner_id !== currentUserId && folders["Совместный_доступ"]) {
      folders["Совместный_доступ"].push(note);
    } else if (folders["Заметки"]) {
      folders["Заметки"].push(note);
    }
  });

  const createSubNoteHandler = async (parentId: number) => {
    try {
      const newNote = await apiClient.createNote(parentId);
      document.dispatchEvent(
        new CustomEvent("notesUpdated", { detail: { createdId: newNote.id } })
      );
      router.navigate(`/note/${newNote.id}`);
      showNotification("Подзаметка создана", "success");
    } catch (err) {
      handleError(err, "Ошибка создания подзаметки");
    }
  };

  const attachAddSubnoteHandler = (
    noteItemEl: HTMLElement,
    parentId: number
  ) => {
    const addBtn = noteItemEl.querySelector(
      ".add-subnote-btn"
    ) as HTMLElement | null;

    if (!addBtn) return;

    const newBtn = addBtn.cloneNode(true) as HTMLElement;
    addBtn.replaceWith(newBtn);

    newBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await createSubNoteHandler(parentId);
    });
  };

  const attachIconClickHandler = (noteItemEl: HTMLElement, noteId: number) => {
    const iconEl = noteItemEl.querySelector('img[style*="width: 16px;"]') as HTMLElement | null;

    if (!iconEl) return;

    iconEl.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
    
            const modal = await chooseIconModal(e as MouseEvent);
            document.body.appendChild(modal);

        const onIconSelected = (event: Event) => {
          const { iconId, url, name } = (event as CustomEvent).detail;
          (async () => {
              try { 
                
                  await apiClient.updateNoteIcon(noteId, iconId);
                  document.dispatchEvent(new CustomEvent('notesUpdated'));
                  showNotification('Иконка обновлена', 'success');
                  modal.remove();
              } catch (err) {
                  handleError(err, 'Не удалось обновить иконку');
              } finally {
                  document.removeEventListener('iconSelected', onIconSelected);
              }
          })();
        };

        document.addEventListener('iconSelected', onIconSelected);
    });
  };

  const updateActiveState = () => {
    const currentId = Number(window.location.pathname.split("/").pop());
    if (!root || !document.body.contains(root)) {
      return;
    }

    const prevActive = root.querySelector(".subdir-item--active");
    if (prevActive) {
      prevActive.classList.remove("subdir-item--active");
      const prevArrow = prevActive.querySelector(".folder-arrow") as HTMLElement | null;
      if (prevArrow) {
        prevArrow.classList.remove("rotated");
      }
      const prevBtn = prevActive.querySelector(".add-subnote-btn");
      prevBtn?.remove();
      const prevSubnotesList = prevActive.querySelector(
        ".subnotes-list"
      ) as HTMLElement | null;
      if (prevSubnotesList && prevSubnotesList.children.length === 0) {
        prevSubnotesList.style.display = "none";
      }
    }

    let newActive: HTMLElement | null = root.querySelector(
      `.subdir-item[data-note-id="${currentId}"]`
    );

    if (!newActive) {
      const subEl = root.querySelector(
        `.subnote-item[data-subnote-id="${currentId}"]`
      );
      if (subEl) {
        newActive = subEl.closest(".subdir-item") as HTMLElement | null;
        root
          .querySelectorAll(".subnote-item .subnote-header")
          .forEach((h) => h.classList.remove("subnote-header--active"));
        const subHeader = subEl.querySelector(
          ".subnote-header"
        ) as HTMLElement | null;
        subHeader?.classList.add("subnote-header--active");
      }
    } else {
      root
        .querySelectorAll(".subnote-item .subnote-header")
        .forEach((h) => h.classList.remove("subnote-header--active"));
    }

    if (newActive) {
      const subnotesList = newActive.querySelector(
        ".subnotes-list"
      ) as HTMLElement | null;
      if (subnotesList) subnotesList.style.display = "block";
      const arrow = newActive.querySelector(".folder-arrow") as HTMLElement | null;
      if (arrow) {
        arrow.classList.add("rotated");
      }
      newActive.classList.add("subdir-item--active");

      const isSharedFolder =
        newActive
          .closest(".folder")
          ?.querySelector(".folder-title")
          ?.textContent?.trim() === "Совместный доступ";

      if (!isSharedFolder) {
        if (!newActive.querySelector(".add-subnote-btn")) {
          const header = newActive.querySelector(
            ".subdir-header"
          ) as HTMLElement | null;
          if (header) {
            const btn = document.createElement("button");
            btn.className = "add-subnote-btn";
            btn.textContent = "+ Добавить подзаметку";
            header.insertAdjacentElement("afterend", btn);
            attachAddSubnoteHandler(
              newActive,
              Number(newActive.getAttribute("data-note-id"))
            );
          }
        } else {
          attachAddSubnoteHandler(
            newActive,
            Number(newActive.getAttribute("data-note-id"))
          );
        }
      }
    }
  };

  Object.entries(folders).forEach(([folderName, notes]) => {
    if (folderName === "Избранное" && notes.length === 0) return;
    if (folderName === "Совместный_доступ" && notes.length === 0) return;

    const folderHtml = ejs.render(folderTemplate, {
      icon_triangle: ICONS.icon_triangle,
      folderName,
      folderIcon: "",
    });
    const folderWrapper = document.createElement("div");
    folderWrapper.innerHTML = folderHtml;
    const folderElement = folderWrapper.firstElementChild as HTMLElement;

    const listEl = folderElement.querySelector(".folder-list") as HTMLElement;
    const arrow = folderElement.querySelector(".folder-arrow") as HTMLElement;
    const header = folderElement.querySelector(".folder-header") as HTMLElement;

    let collapsed = false;
    const updateState = () => {
      listEl.style.display = collapsed ? "none" : "block";
      arrow.classList.toggle("rotated", !collapsed);
      header.setAttribute("aria-expanded", String(!collapsed));
    };
    updateState();

    notes.forEach((item: Note) => {
      const itemSubNotes = getSubNotes(item.id);
      const hasSubNotes = itemSubNotes.length > 0;
      const isActive = window.location.pathname === `/note/${item.id}`;
      const isSubActive = itemSubNotes.some(
        (s) => s.id === Number(window.location.pathname.split("/").pop())
      );
      const showSubNotes = isActive || isSubActive;
      const canEdit = item.owner_id === currentUserId;

      let subnotesHTML = "";
      itemSubNotes.forEach((sub) => {
        subnotesHTML += ejs.render(subnoteItemTemplate, {
          id: sub.id,
          title: sub.title,
          dots: ICONS.dots,
          
        });
      });

      const noteHtml = ejs.render(noteItemTemplate, {
        id: item.id,
        title: item.title,
        dots: ICONS.dots,
        star: folderName === "Избранное" ? ICONS.icon_favorite : ICONS.star,
        hasSubNotes,
        isActive,
        showSubNotes,
        subnotesHTML,
        canEdit,
        icon_triangle: ICONS.icon_triangle,
        icon: item.icon?.url || ICONS.icon_folder,
      });

      const noteWrapper = document.createElement("div");
      noteWrapper.innerHTML = noteHtml;
      const noteItem = noteWrapper.firstElementChild as HTMLElement;

      attachIconClickHandler(noteItem, item.id);

      if (canEdit) {
        const dotsButton = noteItem.querySelector(".subdir-menu-dots");
        dotsButton?.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const existingMenu = document.querySelector(".note-menu");
          if (existingMenu) existingMenu.remove();

          const menu = document.createElement("div");
          menu.className = "note-menu";
          menu.innerHTML = `<button class="delete-note" data-note-id="${item.id}">Удалить</button>`;
          document.body.appendChild(menu);
          const rect = (dotsButton as HTMLElement).getBoundingClientRect();
          menu.style.top = rect.bottom + "px";
          menu.style.left = rect.left + "px";

          menu.querySelector(".delete-note")?.addEventListener("click", () => {
            const deleteModal = createDeleteNoteModal();
            document.body.appendChild(deleteModal);
            deleteModal
              .querySelector(".delete-note-confirm")
              ?.addEventListener("click", async () => {
                try {
                  await apiClient.deleteNote(item.id);

                  const currentPath = window.location.pathname;
                  if (currentPath === `/note/${item.id}`) {
                    document.dispatchEvent(new CustomEvent("notesUpdated"));
                    router.navigate("/notes");
                  } else {
                    document.dispatchEvent(new CustomEvent("notesUpdated"));
                  }
                  showNotification("Заметка удалена", "success");
                  deleteModal.remove();
                  menu.remove();
                } catch (err) {
                  handleError(err, "Не удалось удалить заметку");
                }
              });
          });

          document.addEventListener("click", function closeMenu(ev) {
            if (!menu.contains(ev.target as Node)) {
              menu.remove();
              document.removeEventListener("click", closeMenu);
            }
          });
        });
      }

      noteItem.querySelectorAll(".subnote-menu-dots").forEach((button) => {
        button.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const subEl = (button as HTMLElement).closest(".subnote-item");
          const subId = Number(subEl?.getAttribute("data-subnote-id"));

          const existing = document.querySelector(".note-menu");
          if (existing) existing.remove();

          const menu = document.createElement("div");
          menu.className = "note-menu";
          menu.innerHTML = `<button class="delete-subnote" data-note-id="${subId}">Удалить подзаметку</button>`;
          document.body.appendChild(menu);
          const rect = (button as HTMLElement).getBoundingClientRect();
          menu.style.top = rect.bottom + "px";
          menu.style.left = rect.left + "px";

          menu
            .querySelector(".delete-subnote")
            ?.addEventListener("click", async () => {
              const deleteModal = createDeleteNoteModal();
              document.body.appendChild(deleteModal);
              deleteModal
                .querySelector(".delete-note-confirm")
                ?.addEventListener("click", async () => {
                  try {
                    await apiClient.deleteNote(subId);

                    const currentPath = window.location.pathname;
                    if (currentPath === `/note/${subId}`) {
                      router.navigate(`/note/${item.id}`);
                    }

                    if (subEl) {
                      const parentList = subEl.parentElement;
                      subEl.remove();
                      if (parentList && parentList.children.length === 0) {
                        parentList.style.display = "none";
                      }
                    }
                    showNotification("Подзаметка удалена", "success");
                    deleteModal.remove();
                    menu.remove();
                  } catch (err) {
                    handleError(err, "Не удалось удалить подзаметку");
                  }
                });
            });

          document.addEventListener("click", function close(e) {
            if (!menu.contains(e.target as Node)) {
              menu.remove();
              document.removeEventListener("click", close);
            }
          });
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
          showNotification(
            newFavoriteStatus
              ? "Добавлено в избранное"
              : "Удалено из избранного",
            "info"
          );
        } catch (err) {
          handleError(err, "Ошибка обновления избранного");
        }
      });
      if (folderName === "Избранное") {
        favoriteButton?.classList.add("active");
      }

      if (noteItem.querySelector(".add-subnote-btn")) {
        attachAddSubnoteHandler(noteItem, item.id);
      }

      listEl.appendChild(noteItem);
    });

    const addButton = folderElement.querySelector(".add-note-button");
    if (addButton) {
      addButton.addEventListener("click", async (e) => {
        e.preventDefault();
        const btn = e.target as HTMLElement;
        const originalText = btn.textContent;
        btn.textContent = "Создание...";
        try {
          const newNote = await apiClient.createNote();
          document.dispatchEvent(
            new CustomEvent("notesUpdated", {
              detail: { createdId: newNote.id },
            })
          );
          router.navigate(`/note/${newNote.id}`);
          showNotification("Заметка создана", "success");
        } catch (err) {
          handleError(err, "Ошибка создания заметки");
          btn.textContent = originalText;
        }
      });
    }

    header.addEventListener("click", () => {
      collapsed = !collapsed;
      updateState();
    });

    root.appendChild(folderElement);
  });

  fragment.appendChild(root);

  window.addEventListener("popstate", () => {
    setTimeout(updateActiveState, 0);
  });
  document.addEventListener("routeChanged", () => {
    setTimeout(updateActiveState, 0);
  });
  document.addEventListener("notesUpdated", () => {
    setTimeout(updateActiveState, 0);
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const link = target.closest("a[data-link]") as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    setTimeout(updateActiveState, 10);
  });

  setTimeout(updateActiveState, 0);

  return fragment;
}
