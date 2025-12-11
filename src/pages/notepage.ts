import { Block } from "../components/block";
import { createEditorManager } from "../editor/editorManager";
import router from "../router";
import { apiClient } from "../api/apiClient";
import { createDeleteNoteModal } from "../components/deleteNoteModal";
import { createCollaboratorsModal } from "../components/createCollaboratorsModal";
import { WsClient, ServerMessage } from "../api/wsClient";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "../components/notification";
import { loadUser } from "../utils/session";

const ICONS = {
  trash: new URL("../static/svg/icon_delete.svg", import.meta.url).href,
  star: new URL("../static/svg/icon_favorite.svg", import.meta.url).href,
  clear: new URL("../static/svg/icon_clear_format.svg", import.meta.url).href,
  dots: new URL("../static/svg/icon_dots.svg", import.meta.url).href,
  share: new URL("../static/svg/icon_share.svg", import.meta.url).href,
};

interface Icon {
  id?: number;
  name?: string;
  url?: string;
}


let activeWsClient: WsClient | null = null;

export async function renderNoteEditor(noteId: number | string): Promise<void> {
  if (activeWsClient) {
    activeWsClient.close();
    activeWsClient = null;
  }

  const mainEl = document.getElementById("main-content");
  if (!mainEl) return;

  let initialBlocks: Block[] = [];
  let initialTitle = "Загрузка...";
  let isFavorite = false;

  let isReadOnly = true;
  let isOwner = false;
  let icon : Icon;

  try {
    const note = await apiClient.getNote(noteId as number);
    const blocksData = await apiClient.getBlocksForNote(noteId as number);
    initialTitle = note.title;
    isFavorite = note.is_favorite || false;
    icon = note.icon;

    initialBlocks = (blocksData.blocks || []).map((block: any): Block => {
      if (block.type === "attachment") {
        block.type = "image";
      }
      return block as Block;
    });

    const sharingSettings = await apiClient.getSharingSettings(
      noteId as number
    );
    const currentUser = loadUser();
    isOwner = sharingSettings.is_owner;

    if (isOwner) {
      isReadOnly = false;
    } else {
      const myPermission = sharingSettings.collaborators.find(
        (c) => c.user_id === currentUser?.id
      );
      if (myPermission) {
        if (
          myPermission.role === "viewer" ||
          myPermission.role === "commenter"
        ) {
          isReadOnly = true;
        } else {
          isReadOnly = false;
        }
      } else {
        if (sharingSettings.public_access?.access_level === "editor") {
          isReadOnly = false;
        } else {
          isReadOnly = true;
        }
      }
    }
  } catch (e) {
    handleError(e, "Ошибка загрузки заметки");
    router.navigate("notes");
    return;
  }

  mainEl.className = "note-editor__main";
  mainEl.innerHTML = `
    <div class="note-editor__header">

      <span id="save-status"></span>
      ${isOwner ? `<button class="note-editor__header-btn" id="delete-note-btn"><img src="${ICONS.trash}" alt="Delete"></button>` : ""}
      <button class="note-editor__header-btn" id="favorite-note-btn"><img src="${ICONS.star}" alt="Favorite"></button>
      <button class="note-editor__header-btn" id="openCollabModal" ><img src="${ICONS.share}" style="width: 22px; height: 22px;"/></button>

    </div>
    ${
      !isReadOnly
        ? `
    <div class="formatting-toolbar">
      <div class="format-dropdown" id="font-dropdown">
        <button class="dropdown-toggle">
          <span id="current-font-name">Inter</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-item" data-value="Inter" style="font-family: Inter;">Inter</div>
          <div class="dropdown-item" data-value="Roboto" style="font-family: Roboto;">Roboto</div>
          <div class="dropdown-item" data-value="Montserrat" style="font-family: Montserrat;">Montserrat</div>
          <div class="dropdown-item" data-value="Manrope" style="font-family: Manrope;">Manrope</div>
        </div>
      </div>
       <div class="format-dropdown" id="size-dropdown">
        <button class="dropdown-toggle">
          <span id="current-font-size">12</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-item" data-value="10">10</div>
          <div class="dropdown-item" data-value="12">12</div>
          <div class="dropdown-item" data-value="14">14</div>
          <div class="dropdown-item" data-value="16">16</div>
          <div class="dropdown-item" data-value="18">18</div>
          <div class="dropdown-item" data-value="24">24</div>
          <div class="dropdown-item" data-value="36">36</div>
        </div>
      </div>
    <button class="format-btn" data-command="bold" title="Жирный (Ctrl/Cmd+B)">B</button>
    <button class="format-btn" data-command="italic" title="Курсив (Ctrl/Cmd+I)"><i>I</i></button>
    <button class="format-btn" data-command="underline" title="Подчёркнутый (Ctrl/Cmd+U)"><u>U</u></button>
    <button class="format-btn" data-command="strikeThrough" title="Зачёркнуть"><s>S</s></button>
    <button class="format-btn" data-command="removeFormat" title="Очистить форматирование" aria-label="Очистить форматирование"><img src="${ICONS.clear}" alt="Clear"/></button>
    </div>
    <div class="add-block-menu">
      <div class="menu-item" data-type="text">Текст</div>
      <div class="menu-item" data-type="code">Код</div>
      <div class="menu-item" data-type="image">Изображение</div>
    </div>
    `
        : ""
    }
    <div class="note-editor__title-handler" >
      <img src="${icon.url}" style="display: flex; aligh-items: center; width:40px;">
      <input class="note-editor__title" placeholder="Загрузка..." value="" />
    </div>
    <div class="block-editor">Загрузка блоков...</div>
  `;

  const titleInput = mainEl.querySelector<HTMLInputElement>(
    ".note-editor__title"
  )!;
  const editorContainer = mainEl.querySelector(".block-editor") as HTMLElement;
  const toolbar = mainEl.querySelector(".formatting-toolbar") as HTMLElement;
  const addBlockMenu = mainEl.querySelector(".add-block-menu") as HTMLElement;
  const deleteBtn = mainEl.querySelector(
    "#delete-note-btn"
  ) as HTMLButtonElement;
  const favoriteBtn = mainEl.querySelector(
    "#favorite-note-btn"
  ) as HTMLButtonElement;
  const openCollabBtn = document.querySelector("#openCollabModal");
  const saveStatusEl = mainEl.querySelector("#save-status") as HTMLElement;

  if (isFavorite) {
    favoriteBtn.classList.add("active");
  }

  titleInput.value = initialTitle;

  const editorManager = createEditorManager({
    container: editorContainer,
    toolbar: toolbar,
    addBlockMenu: addBlockMenu,
    initialBlocks: initialBlocks,
    titleInput: titleInput,
    noteId: noteId,
    saveStatusEl: saveStatusEl,
    readOnly: isReadOnly,
  });

  editorManager.render();

  const sharingSettings = await apiClient.getSharingSettings(noteId as number);
  if (sharingSettings.collaborators.length > 1 || sharingSettings.public_access.access_level) {
    activeWsClient = new WsClient(noteId);
    activeWsClient.connect((msg: ServerMessage) => {
      if (msg.type === "note_update") {
        if (msg.title) {
          titleInput.value = msg.title;
          document.dispatchEvent(
            new CustomEvent("noteTitleUpdated", {
              detail: { noteId: noteId, newTitle: msg.title },
            })
          );
        }

        if (msg.blocks) {
          const cleanBlocks = msg.blocks.map((block: any): Block => {
            if (block.type === "attachment") {
              block.type = "image";
            }
            return block as Block;
          });
          editorManager.syncBlocks(cleanBlocks);
        }
      }
    });
  }

  if (initialBlocks.length > 0 && initialBlocks[0]) {
    editorManager.focusBlock(initialBlocks[0].id);
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      const deleteModal = createDeleteNoteModal();
      document.body.appendChild(deleteModal);

      deleteModal
        .querySelector(".delete-note-confirm")
        ?.addEventListener("click", async () => {
          try {
            await apiClient.deleteNote(noteId as number);
            document.dispatchEvent(new CustomEvent("notesUpdated"));
            showNotification("Заметка удалена", "success");
            router.navigate("notes");
          } catch (err) {
            handleError(err, "Не удалось удалить заметку");
          }
          deleteModal.remove();
        });
    });
  }

  favoriteBtn.addEventListener("click", async () => {
    const newFavoriteStatus = !favoriteBtn.classList.contains("active");
    try {
      await apiClient.toggleFavorite(noteId as number, newFavoriteStatus);
      favoriteBtn.classList.toggle("active", newFavoriteStatus);
      document.dispatchEvent(
        new CustomEvent("notesUpdated", {
          detail: { noteId: noteId, isFavorite: newFavoriteStatus },
        })
      );
      showNotification(
        newFavoriteStatus ? "Добавлено в избранное" : "Удалено из избранного",
        "info"
      );
    } catch (err) {
      handleError(err, "Ошибка обновления избранного");
    }
  });

  openCollabBtn?.addEventListener("click", () => {

    const id = typeof noteId === "string" ? parseInt(noteId) : noteId;
    const modal = createCollaboratorsModal(id);
    document.body.appendChild(modal);
  });

  const handleNotesUpdated = (event: Event) => {
    const custom = event as CustomEvent;
    if (!custom?.detail) return;
    const { noteId: updatedId, isFavorite } = custom.detail;
    if (String(updatedId) === String(noteId)) {
      favoriteBtn.classList.toggle("active", Boolean(isFavorite));
    }
  };

  document.removeEventListener(
    "notesUpdated",
    handleNotesUpdated as EventListener
  );
  document.addEventListener(
    "notesUpdated",
    handleNotesUpdated as EventListener
  );
}
