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
  owner_id: number;
  title: string;
  icon: string;
  favorite: boolean;
  parent_note_id?: number | null;
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
        <span class="subdir-title">
          <%= title.length > 18 ? title.substring(0,17) + '...' : title %>
        </span>
        <span class="subdir-buttons">
          <button class="subdir-menu-dots" style="display:none;">
            <img src="<%= dots %>" />
          </button>
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
    if (currentUserId && note.owner_id !== currentUserId) {
      folders["Совместный_доступ"]?.push(note);
    } else {
      if (note.favorite) {
        folders["Избранное"]?.push(note);
      }
      folders["Заметки"]?.push(note);
    }
  });

  const createSubNoteHandler = async (parentId: number) => {
    try {
      const newNote = await apiClient.createNote(parentId);
      document.dispatchEvent(
        new CustomEvent("notesUpdated", { detail: { createdId: newNote.id } })
      );
      router.navigate(`/note/${newNote.id}`);
    } catch (err) {
      console.error("Ошибка создания подзаметки", err);
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

  const updateActiveState = () => {
    const currentId = Number(window.location.pathname.split("/").pop());
    if (!root || !document.body.contains(root)) {
      return;
    }

    const prevActive = root.querySelector(".subdir-item--active");
    if (prevActive) {
      prevActive.classList.remove("subdir-item--active");
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
      });

      const noteWrapper = document.createElement("div");
      noteWrapper.innerHTML = noteHtml;
      const noteItem = noteWrapper.firstElementChild as HTMLElement;

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
                document.dispatchEvent(new CustomEvent("notesUpdated"));
                deleteModal.remove();
                menu.remove();
                router.navigate("/notes");
              } catch (err) {
                console.error("Failed to delete note:", err);
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
              try {
                // await apiClient.deleteNote(subId);
                // document.dispatchEvent(new CustomEvent("notesUpdated"));
                // menu.remove();
                // router.navigate("/notes");
                const deleteModal = createDeleteNoteModal();
          document.body.appendChild(deleteModal);
          deleteModal
            .querySelector(".delete-note-confirm")
            ?.addEventListener("click", async () => {
              try {
                await apiClient.deleteNote(subId);
                document.dispatchEvent(new CustomEvent("notesUpdated"));
                deleteModal.remove();
                menu.remove();
                router.navigate("/notes");
              } catch (err) {
                console.error("Failed to delete note:", err);
              }
            });
              } catch (err) {
                console.error("Failed to delete subnote", err);
              }
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
        } catch (err) {
          console.error("Failed to update favorite status:", err);
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
        } catch (err) {
          console.error("Ошибка создания заметки", err);
          btn.textContent = originalText;
        }
      });
    }

    header.addEventListener("click", () => {
      const list = folderElement.querySelector(".folder-list") as HTMLElement;
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
