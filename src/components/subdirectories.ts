import ejs from "ejs";
import { createDeleteNoteModal } from "../components/deleteNoteModal";
import { apiClient } from "../api/apiClient";
import router from "../router";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "./notification";
import { chooseIconModal } from "./chooseIconModal";

const ICONS = {
  triangle: new URL("../static/svg/icon_triangle.svg", import.meta.url).href,
  star: new URL("../static/svg/icon_star.svg", import.meta.url).href,
  starFilled: new URL("../static/svg/icon_favorite.svg", import.meta.url).href,
  dots: new URL("../static/svg/icon_dots.svg", import.meta.url).href,
  folder: new URL("../static/svg/icon_folder.svg", import.meta.url).href,
  plus: new URL("../static/svg/icon_add_new.svg", import.meta.url).href,
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
    Избранное: [],
    "Совместный доступ": [],
    Заметки: [],
  };

  const subNotesMap = new Map<number, Note[]>();

  items.forEach((note) => {
    const parentId = note.parent_note_id;
    if (parentId) {
      if (!subNotesMap.has(parentId)) {
        subNotesMap.set(parentId, []);
      }
      subNotesMap.get(parentId)!.push(note);
    }
  });

  items.forEach((note) => {
    if (note.favorite) {
      if (!folders["Избранное"]) folders["Избранное"] = [];
      folders["Избранное"].push(note);
    }

    if (!note.parent_note_id) {
      if (currentUserId && note.owner_id !== currentUserId) {
        if (!folders["Совместный доступ"]) folders["Совместный доступ"] = [];
        folders["Совместный доступ"].push(note);
      } else {
        if (!folders["Заметки"]) folders["Заметки"] = [];
        folders["Заметки"].push(note);
      }
    }
  });

  const currentPathId = Number(window.location.pathname.split("/").pop());

  const noteRowTemplate = `
    <li class="subdir-item <%= isExpanded ? 'expanded' : '' %>" data-note-id="<%= id %>">
      <div class="tree-node-row <%= isActive ? 'active' : '' %>">
        <% if (isRoot && (hasChildren || canCreateSub)) { %>
            <div class="tree-arrow" data-action="toggle">
                <img src="<%= icons.triangle %>" />
            </div>
        <% } else { %>
            <div class="tree-arrow-placeholder"></div>
        <% } %>

        <a href="/note/<%= id %>" class="tree-link" data-link style="display:contents; color:inherit;">
            <!-- Добавил data-current-icon-id -->
            <img src="<%= iconUrl %>" class="tree-icon" data-action="icon" data-current-icon-id="<%= iconId %>" />
            <span class="tree-title"><%= title %></span>
        </a>

        <div class="tree-actions">
            <button class="tree-action-btn" data-action="menu">
                <img src="<%= icons.dots %>" />
            </button>
        </div>
      </div>

      <% if (isRoot && (hasChildren || canCreateSub)) { %>
        <ul class="subnotes-list">
            <%- childrenHtml %>
            <% if (canCreateSub) { %>
                <li class="add-subnote-wrapper">
                    <button class="add-subnote-btn" data-parent-id="<%= id %>">
                        + Добавить подзаметку
                    </button>
                </li>
            <% } %>
        </ul>
      <% } %>
    </li>
  `;

  const renderNoteTree = (
    notes: Note[],
    isFavoriteSection: boolean,
    depth: number = 0
  ): string => {
    return notes
      .map((note) => {
        const subNotes = subNotesMap.get(note.id) || [];

        const isRoot = depth === 0;

        const showChildren = !isFavoriteSection && isRoot;

        const childrenHtml = showChildren
          ? renderNoteTree(subNotes, false, depth + 1)
          : "";
        const canCreateSub =
          !isFavoriteSection && isRoot && note.owner_id === currentUserId;
        const hasChildren = subNotes.length > 0;

        let isExpanded = false;
        if (note.id === currentPathId) isExpanded = true;
        if (subNotes.some((sn) => sn.id === currentPathId)) isExpanded = true;

        return ejs.render(noteRowTemplate, {
          id: note.id,
          title: note.title || "Без названия",
          iconUrl: note.icon?.url || ICONS.folder,
          iconId: note.icon?.id || "",
          isActive: note.id === currentPathId,
          isExpanded,
          hasChildren,
          canCreateSub,
          childrenHtml,
          icons: ICONS,
          isRoot: isRoot,
        });
      })
      .join("");
  };

  Object.entries(folders).forEach(([folderName, notes]) => {
    if (notes.length === 0 && folderName !== "Заметки") return;

    const folderContainer = document.createElement("div");
    folderContainer.className = "folder";

    const isFav = folderName === "Избранное";

    folderContainer.innerHTML = `
        <div class="folder-header">${folderName}</div>
        <ul class="folder-list">
            ${renderNoteTree(notes, isFav, 0)}
        </ul>
        ${folderName === "Заметки" ? `<div class="add-note-button">+ Добавить страницу</div>` : ""}
    `;

    root.appendChild(folderContainer);
  });

  const updateActiveState = () => {
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split("/");
    const noteId = pathParts[1] === "note" ? Number(pathParts[2]) : null;

    root
      .querySelectorAll(".tree-node-row.active")
      .forEach((el) => el.classList.remove("active"));

    if (noteId) {
      const activeItems = root.querySelectorAll(
        `.subdir-item[data-note-id="${noteId}"] > .tree-node-row`
      );
      activeItems.forEach((row) => {
        row.classList.add("active");

        let parent = row.closest(".subdir-item");
        while (parent) {
          const parentElement = parent.parentElement as Element | null;
          const grandParentList =
            parentElement?.closest(".subdir-item") || null;

          if (grandParentList) {
            grandParentList.classList.add("expanded");
          }

          parent = parentElement?.closest(".subdir-item") || null;
        }
      });
    }
  };

  root.querySelectorAll(".tree-arrow").forEach((arrow) => {
    arrow.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const li = (e.target as HTMLElement).closest(".subdir-item");
      li?.classList.toggle("expanded");
    });
  });

  root.querySelectorAll(".add-subnote-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parentId = Number((btn as HTMLElement).dataset.parentId);

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
    });
  });

  const addMainBtn = root.querySelector(".add-note-button");
  addMainBtn?.addEventListener("click", async () => {
    try {
      const newNote = await apiClient.createNote();
      document.dispatchEvent(
        new CustomEvent("notesUpdated", { detail: { createdId: newNote.id } })
      );
      router.navigate(`/note/${newNote.id}`);
      showNotification("Заметка создана", "success");
    } catch (err) {
      handleError(err, "Ошибка создания заметки");
    }
  });

  root.querySelectorAll('[data-action="menu"]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const li = (e.target as HTMLElement).closest(
        ".subdir-item"
      ) as HTMLElement;
      const noteId = Number(li.dataset.noteId);

      document.querySelectorAll(".note-menu").forEach((el) => el.remove());

      const menu = document.createElement("div");
      menu.className = "note-menu";
      menu.innerHTML = `<button class="delete-note" style="color:var(--danger)">Удалить</button>`;
      document.body.appendChild(menu);

      const rect = (btn as HTMLElement).getBoundingClientRect();
      menu.style.top = `${rect.bottom}px`;
      menu.style.left = `${rect.left}px`;

      menu.querySelector(".delete-note")?.addEventListener("click", () => {
        const deleteModal = createDeleteNoteModal();
        document.body.appendChild(deleteModal);
        deleteModal
          .querySelector(".delete-note-confirm")
          ?.addEventListener("click", async () => {
            try {
              await apiClient.deleteNote(noteId);
              if (window.location.pathname === `/note/${noteId}`) {
                router.navigate("/notes");
              }
              document.dispatchEvent(new CustomEvent("notesUpdated"));
              showNotification("Заметка удалена", "success");
            } catch (err) {
              handleError(err, "Ошибка удаления");
            }
            deleteModal.remove();
            menu.remove();
          });
      });

      const closeMenu = (ev: Event) => {
        if (!menu.contains(ev.target as Node)) {
          menu.remove();
          document.removeEventListener("click", closeMenu);
        }
      };
      setTimeout(() => document.addEventListener("click", closeMenu), 0);
    });
  });

  root.querySelectorAll('[data-action="icon"]').forEach((img) => {
    img.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const li = (e.target as HTMLElement).closest(
        ".subdir-item"
      ) as HTMLElement;
      const noteId = Number(li.dataset.noteId);
      const currentIconId =
        Number((img as HTMLElement).dataset.currentIconId) || null;

      const modal = await chooseIconModal(
        e as MouseEvent,
        noteId,
        currentIconId
      );
      document.body.appendChild(modal);

      const handleSelection = async (event: Event) => {
        const customEvent = event as CustomEvent;
        if (String(customEvent.detail.targetNoteId) === String(noteId)) {
          try {
            await apiClient.updateNoteIcon(noteId, customEvent.detail.iconId);
            document.dispatchEvent(new CustomEvent("notesUpdated"));
            showNotification("Иконка обновлена", "success");
          } catch (err) {
            handleError(err, "Ошибка обновления иконки");
          }
          document.removeEventListener("iconSelected", handleSelection);
        }
      };
      document.addEventListener("iconSelected", handleSelection);
    });
  });

  setTimeout(updateActiveState, 0);

  document.addEventListener("routeChanged", updateActiveState);

  fragment.appendChild(root);
  return fragment;
}
