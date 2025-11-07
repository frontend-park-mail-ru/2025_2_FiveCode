import { Block } from "../components/block";
import { createEditorManager } from "../editor/editorManager";
import router from "../router";
import { apiClient } from "../api/apiClient";
import { createDeleteNoteModal } from "../components/deleteNoteModal";

const ICONS = {
  trash: new URL("../static/svg/icon_delete.svg", import.meta.url).href,
  star: new URL("../static/svg/icon_favorite.svg", import.meta.url).href,
};

export async function renderNoteEditor(noteId: number | string): Promise<void> {
  const mainEl = document.getElementById("main-content");
  if (!mainEl) return;
  mainEl.className = "note-editor__main";
  mainEl.innerHTML = `
    <div class="note-editor__header">
      <span id="save-status"></span>
      <button class="note-editor__header-btn" id="delete-note-btn"><img src="${ICONS.trash}" alt="Delete"></button>
      <button class="note-editor__header-btn" id="favorite-note-btn"><img src="${ICONS.star}" alt="Favorite"></button>
    </div>
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
      <button class="format-btn" data-command="bold">B</button>
      <button class="format-btn" data-command="italic"><i>I</i></button>
      <button class="format-btn" data-command="underline"><u>U</u></button>
      <button class="format-btn" data-command="strikeThrough"><s>S</s></button>
      <button class="format-btn format-btn-code" data-command="convertToCode">&lt;/&gt;</button>
    </div>
    <div class="add-block-menu">
      <div class="menu-item" data-type="text">Текст</div>
      <div class="menu-item" data-type="code">Код</div>
      <div class="menu-item" data-type="image">Изображение</div>
    </div>
    <input class="note-editor__title" placeholder="Загрузка..." value="" />
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
  const saveStatusEl = mainEl.querySelector("#save-status") as HTMLElement;

  let initialBlocks: Block[] = [];
  let initialTitle = "Загрузка...";
  let isFavorite = false;

  try {
    const note = await apiClient.getNote(noteId as number);
    const blocksData = await apiClient.getBlocksForNote(noteId as number);
    initialTitle = note.title;
    isFavorite = note.is_favorite || false;
    const backendBlocks = blocksData?.blocks || [];

    initialBlocks = backendBlocks.map((block: any): Block => {
      if (block.type === "attachment") {
        return {
          id: block.id,
          type: "image",
          url: block.text,
        };
      }
      return block as Block;
    });

    if (isFavorite) {
      favoriteBtn.classList.add("active");
    }
  } catch (e) {
    console.error("Не удалось загрузить заметку.", e);
    router.navigate("notes");
    return;
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
  });

  editorManager.render();

  if (initialBlocks.length > 0 && initialBlocks[0]) {
    editorManager.focusBlock(initialBlocks[0].id);
  }

  deleteBtn.addEventListener("click", () => {
    const deleteModal = createDeleteNoteModal();
    document.body.appendChild(deleteModal);
    
    deleteModal.querySelector(".delete-note-confirm")?.addEventListener("click", async () => {
      try {
        await apiClient.deleteNote(noteId as number);
        document.dispatchEvent(new CustomEvent("notesUpdated"));
        router.navigate("notes");
      } catch (err) {
        console.error("Failed to delete note:", err);
      }
    });
  });

  favoriteBtn.addEventListener("click", async () => {
    const newFavoriteStatus = !favoriteBtn.classList.contains("active");
    try {
      await apiClient.toggleFavorite(noteId as number, newFavoriteStatus);
      favoriteBtn.classList.toggle("active", newFavoriteStatus);
      document.dispatchEvent(new CustomEvent("notesUpdated"));
    } catch (err) {
      console.error("Failed to update favorite status:", err);
    }
  });
}
