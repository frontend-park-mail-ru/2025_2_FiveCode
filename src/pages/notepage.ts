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
import { chooseIconModal } from "../components/chooseIconModal";
import { createNoteHeaderModal } from "../components/noteHeaderModal";
import { isOffline, addOfflineListener, removeOfflineListener } from "../utils/offline";
import { renderNoteHeader } from "../components/noteHeader";

const ICONS = {
  trash: new URL("../static/svg/icon_delete.svg", import.meta.url).href,
  star: new URL("../static/svg/icon_star.svg", import.meta.url).href,
  filled_star: new URL("../static/svg/icon_favorite.svg", import.meta.url).href,
  clear: new URL("../static/svg/icon_clear_format.svg", import.meta.url).href,
  dots: new URL("../static/svg/icon_dots_grey.svg", import.meta.url).href,
  share: new URL("../static/svg/icon_share.svg", import.meta.url).href,
  pdf: new URL("../static/svg/icon_pdf.svg", import.meta.url).href,
};

interface Icon {
  id?: number;
  name?: string;
  url?: string;
}

let activeWsClient: WsClient | null = null;
let activeIconListener: ((e: Event) => void) | null = null;
let activeSharingListener: ((e: Event) => void) | null = null;
let onlineNotificationShown = false;

export async function renderNoteEditor(noteId: number | string): Promise<void> {
  if (activeWsClient) {
    activeWsClient.close();
    activeWsClient = null;
  }

  if (activeIconListener) {
    document.removeEventListener("iconSelected", activeIconListener);
    activeIconListener = null;
  }

  if (activeSharingListener) {
    document.removeEventListener(
      "sharingSettingsUpdated",
      activeSharingListener
    );
    activeSharingListener = null;
  }

  const mainEl = document.getElementById("main-content");
  if (!mainEl) return;

  let initialBlocks: Block[] = [];
  let initialTitle = "Загрузка...";
  let isFavorite = false;

  let isReadOnly = true;
  let isOwner = false;
  let icon: Icon;
  let isSubNote = false;
  const userIsOffline = isOffline();
  let noteHeader: { id: number; url?: string } | null = null;

  try {
    const note = await apiClient.getNote(noteId as number);

    noteHeader = note.header ?? null;
    const blocksData = await apiClient.getBlocksForNote(noteId as number);
    initialTitle = note.title;
    isFavorite = note.is_favorite || false;
    icon = note.icon;
    isSubNote = !!note.parent_note_id;

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

    // If user is offline, force read-only mode
    if (userIsOffline) {
      isReadOnly = true;
    } else if (isOwner) {
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

  // Show offline notification if user is offline
  if (userIsOffline) {
    showNotification("Вы находитесь в офлайн режиме. Заметки доступны только для просмотра.", "info");
  }


  mainEl.className = "note-editor__main";
  const starIconUrl = isFavorite ? ICONS.filled_star : ICONS.star;

  mainEl.innerHTML = `
    <div id="note-page-header"></div>
    <div class="note-editor__header-wrapper">
    <div class="note-editor__header" style="transition: background-color 0.3s ease, background-image 0.3s ease;">
      <div class="note-editor__header-content">
        ${!isReadOnly ? `<button class="note-editor__header-customize-btn" id="customize-header-btn">Изменить фон</button>` : ""}
      </div>
    </div>
  </div>

    <div class="note-editor__content">
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
      <div class="note-editor__title-handler">
        <img id="note-header-icon" src="${icon.url}" style="display: flex; align-items: center; width:40px; cursor: pointer;">
        <input class="note-editor__title" placeholder="Загрузка..." value="" />
      </div>
      <div class="block-editor">Загрузка блоков...</div>
    </div>
  `;
  
  const pageHeaderContainer = mainEl.querySelector(
  "#note-page-header"
  ) as HTMLElement;

  renderNoteHeader(pageHeaderContainer, {
    title: initialTitle,
    isFavorite: isFavorite,
  });


  const titleInput = mainEl.querySelector<HTMLInputElement>(
    ".note-editor__title"
  )!;
  const editorContainer = mainEl.querySelector(".block-editor") as HTMLElement;
  const toolbar = mainEl.querySelector(".formatting-toolbar") as HTMLElement;
  const addBlockMenu = mainEl.querySelector(".add-block-menu") as HTMLElement;
  const openCollabBtn = mainEl.querySelector("#openCollabModal") as HTMLButtonElement;
  const saveStatusEl = mainEl.querySelector("#save-status") as HTMLElement;
  const customizeHeaderBtn = mainEl.querySelector("#customize-header-btn") as HTMLButtonElement;
  const headerElement = mainEl.querySelector(".note-editor__header") as HTMLElement;
  if (noteHeader?.url) {
    headerElement.style.backgroundImage = `url('${noteHeader.url}')`;
    headerElement.style.backgroundSize = "cover";
    headerElement.style.backgroundPosition = "center";
    headerElement.style.backgroundColor = "transparent";
  }


  const headerIconImg = mainEl.querySelector("#note-header-icon") as HTMLImageElement;

  pageHeaderContainer.addEventListener(
  "noteFavoriteToggled",
  async (e: Event) => {
    const active = (e as CustomEvent).detail.active;

    try {
      await apiClient.toggleFavorite(Number(noteId), active);
      document.dispatchEvent(
        new CustomEvent("notesUpdated", {
          detail: { noteId, isFavorite: active },
        })
      );
      showNotification(
        active ? "Добавлено в избранное" : "Удалено из избранного",
        "info"
      );
    } catch (err) {
      handleError(err, "Ошибка обновления избранного");
    }
  });

pageHeaderContainer.addEventListener(
  "noteMenuAction",
  async (e: Event) => {
    const action = (e as CustomEvent).detail.action;

    try {
      switch (action) {
        case "customize":
          if (!isReadOnly) {
            const modal = await createNoteHeaderModal(Number(noteId), noteHeader ? { header_id: noteHeader.id, ...(noteHeader.url ? { header_image_url: noteHeader.url } : {}) } : undefined);
        
            document.body.appendChild(modal);
          } else {
            showNotification("Редактирование доступно только владельцу заметки", "info");
          }
          break;

        case "collaboration":
          if (!isSubNote) {
            const modal = createCollaboratorsModal(Number(noteId));
            document.body.appendChild(modal);
          } else {
            showNotification("Совместный доступ недоступен для подзаметок", "info");
          }
          break;

        case "export":
          try {
            const pdfUrl = await apiClient.getPDFexport(Number(noteId));
            if (!pdfUrl) throw new Error("Invalid PDF URL");
            window.open(pdfUrl, "_blank");
            showNotification("PDF экспортирован", "success");
          } catch (err) {
            handleError(err, "Ошибка при экспорте в PDF");
          }
          break;

        case "share":
          try {
            const id = typeof noteId === "string" ? parseInt(noteId) : noteId;
            const modal = createCollaboratorsModal(id);
            document.body.appendChild(modal); 
          } catch (err) {
            handleError(err, "хз почему тут ошибка");
          }
          break;

        case "delete":
          if (!isOwner) {
            showNotification("Удалять заметку может только владелец", "info");
            return;
          }
          const deleteModal = createDeleteNoteModal();
          document.body.appendChild(deleteModal);

          const confirmBtn = deleteModal.querySelector(
            ".delete-note-confirm"
          ) as HTMLButtonElement;

          confirmBtn?.addEventListener("click", async () => {
            confirmBtn.disabled = true;
            try {
              await apiClient.deleteNote(Number(noteId));
              showNotification("Заметка удалена", "success");
              router.navigate("/notes");
              document.dispatchEvent(new CustomEvent("notesUpdated"));
            } catch (err) {
              handleError(err, "Не удалось удалить заметку");
            } finally {
              deleteModal.remove();
            }
          });
          break;

        case "favorite":
          const newFavoriteStatus = !isFavorite;
          try {
            await apiClient.toggleFavorite(Number(noteId), newFavoriteStatus);
            isFavorite = newFavoriteStatus;
            showNotification(
              newFavoriteStatus ? "Добавлено в избранное" : "Удалено из избранного",
              "info"
            );
            document.dispatchEvent(
              new CustomEvent("notesUpdated", {
                detail: { noteId, isFavorite: newFavoriteStatus },
              })
            );
          } catch (err) {
            handleError(err, "Ошибка обновления избранного");
          }
          break;

        default:
          console.warn("Неизвестное действие header:", action);
      }
    } catch (err) {
      console.error(err);
      showNotification("Произошла ошибка при выполнении действия", "error");
    }
  });



  if (customizeHeaderBtn) {
    customizeHeaderBtn.addEventListener("click", async () => {
      const modal = await createNoteHeaderModal(Number(noteId), noteHeader ? { header_id: noteHeader.id, ...(noteHeader.url ? { header_image_url: noteHeader.url } : {}) } : undefined);
      document.body.appendChild(modal);
    });
  }

  headerIconImg?.addEventListener("click", async (e) => {
    const modal = await chooseIconModal(e, Number(noteId), icon.id);
    document.body.appendChild(modal);
  });

  const onIconSelectedGlobal = async (event: Event) => {
    const detail = (event as CustomEvent).detail;

    if (String(detail.targetNoteId) !== String(noteId)) {
      return;
    }

    const { iconId, url } = detail;
    try {
      await apiClient.updateNoteIcon(noteId, iconId);
      if (headerIconImg) headerIconImg.src = url;
      document.dispatchEvent(new CustomEvent("notesUpdated"));
      showNotification("Иконка обновлена", "success");

      if (icon) icon.id = iconId;

      const modal = document.getElementById("chooseIconModal");
      if (modal) modal.remove();
    } catch (err) {
      handleError(err, "Не удалось обновить иконку");
    }
  };

  document.addEventListener("iconSelected", onIconSelectedGlobal);
  activeIconListener = onIconSelectedGlobal;

  const observer = new MutationObserver(() => {
    if (!document.body.contains(mainEl)) {
      if (activeIconListener) {
        document.removeEventListener("iconSelected", activeIconListener);
        activeIconListener = null;
      }
      if (activeSharingListener) {
        document.removeEventListener(
          "sharingSettingsUpdated",
          activeSharingListener
        );
        activeSharingListener = null;
      }
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
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

  const initWebsocket = () => {
    if (activeWsClient) return;
    activeWsClient = new WsClient(noteId);
    activeWsClient.connect((msg: ServerMessage) => {
      if (msg.type === "note_update") {
        if (msg.title) {
          titleInput.value = msg.title;
          
          const headerTitle = pageHeaderContainer.querySelector(".note-header__title") as HTMLElement;

          if (headerTitle) {
            headerTitle.textContent = msg.title;
          }

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
  };

  const checkAndInitWebsocket = async () => {
    try {
      const settings = await apiClient.getSharingSettings(Number(noteId));
      if (
        settings.collaborators.length > 1 ||
        (settings.public_access && settings.public_access.access_level)
      ) {
        initWebsocket();
      }
    } catch (e) {
      console.error(e);
    }
  };

  checkAndInitWebsocket();

  activeSharingListener = () => {
    checkAndInitWebsocket();
  };
  let header_image_url = noteHeader?.url ?? null;
  document.addEventListener("sharingSettingsUpdated", activeSharingListener);
   
  const handleHeaderUpdated = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { header_image_url } = customEvent.detail;

  if (header_image_url) {
    noteHeader = {
      id: noteHeader?.id ?? 0,
      url: header_image_url,
    };

    headerElement.style.backgroundImage = `url('${header_image_url}')`;
    headerElement.style.backgroundSize = "cover";
    headerElement.style.backgroundPosition = "center";
    headerElement.style.backgroundColor = "transparent";
  }

  document.dispatchEvent(new CustomEvent("notesUpdated"));
};


  document.addEventListener("headerUpdated", handleHeaderUpdated);

  if (initialBlocks.length > 0 && initialBlocks[0]) {
    editorManager.focusBlock(initialBlocks[0].id);
  }


  const handleHeaderColorChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    const { color } = customEvent.detail;
    const header = mainEl.querySelector(".note-editor__header") as HTMLElement;
    if (header) {
      header.style.backgroundColor = color;
    }
  };

  document.addEventListener("headerColorChanged", handleHeaderColorChange);

  const styleObserver = new MutationObserver(() => {
    if (!document.body.contains(mainEl)) {
      document.removeEventListener(
        "headerColorChanged",
        handleHeaderColorChange
      );
      styleObserver.disconnect();
    }
  });
  styleObserver.observe(document.body, { childList: true, subtree: true });

  const handleOfflineStatusChange = (offline: boolean) => {
    if (offline) {
      onlineNotificationShown = false;
      if (customizeHeaderBtn) customizeHeaderBtn.disabled = true;
      if (openCollabBtn) openCollabBtn.disabled = true;
      if (headerIconImg) headerIconImg.style.cursor = "not-allowed";
      
    } else {
      if (!onlineNotificationShown){
        showNotification("Вы снова онлайн. Редактирование доступно.", "success");
        onlineNotificationShown = true;
      }
      if (customizeHeaderBtn && !isReadOnly) customizeHeaderBtn.disabled = false;
      if (openCollabBtn && !isSubNote) openCollabBtn.disabled = false;
      if (headerIconImg) headerIconImg.style.cursor = "pointer";

    }
  };

  addOfflineListener(handleOfflineStatusChange);

  const offlineObserver = new MutationObserver(() => {
    if (!document.body.contains(mainEl)) {
      removeOfflineListener(handleOfflineStatusChange);
      offlineObserver.disconnect();
    }
  });
  offlineObserver.observe(document.body, { childList: true, subtree: true });
}
