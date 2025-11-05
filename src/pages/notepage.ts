import { Sidebar } from "../components/sidebar";
import { loadUser } from "../utils/session";
import { Block } from "../components/block";
import { createEditorManager } from "../editor/editorManager";
import router from "../router";
import { apiClient } from "../api/apiClient";

const ICONS = {
  trash: new URL("../static/svg/icon_delete.svg", import.meta.url).href,
  star: new URL("../static/svg/icon_favorite.svg", import.meta.url).href,
};

export async function renderNoteEditor(
  app: HTMLElement,
  noteId: number | string
): Promise<void> {
  app.innerHTML = '<div class="page page--note-editor"></div>';
  const pageEl = app.querySelector(".page--note-editor") as HTMLElement;

  const user = loadUser();
  pageEl.appendChild(Sidebar({ user }));

  const mainEl = document.createElement("div");
  mainEl.className = "note-editor__main";
  mainEl.innerHTML = `
    <div class="note-editor__header">
      <span id="save-status"></span>
      <button class="note-editor__header-btn" id="delete-note-btn"><img src="${ICONS.trash}" alt="Delete"></button>
      <button class="note-editor__header-btn" id="favorite-note-btn"><img src="${ICONS.star}" alt="Favorite"></button>
    </div>
    <div class="formatting-toolbar">
      <button class="format-btn" data-command="bold">B</button>
      <button class="format-btn" data-command="italic"><i>I</i></button>
      <button class="format-btn" data-command="underline"><u>U</u></button>
      <button class="format-btn" data-command="strikeThrough"><s>S</s></button>
      <button class="format-btn format-btn-code" data-command="convertToCode">&lt;/&gt;</button>
      <div class="format-dropdown" id="font-dropdown">
        <button class="dropdown-toggle">
          <span id="current-font-name">Sans-Serif</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-item" data-value="Arial">Sans-Serif</div>
          <div class="dropdown-item" data-value="Georgia">Serif</div>
          <div class="dropdown-item" data-value="Courier New">Monospace</div>
        </div>
      </div>
    </div>
    <div class="add-block-menu">
      <div class="menu-item" data-type="text">Текст</div>
      <div class="menu-item" data-type="code">Код</div>
      <div class="menu-item" data-type="image">Изображение</div>
    </div>
    <input class="note-editor__title" placeholder="Загрузка..." value="" />
    <div class="block-editor">Загрузка блоков...</div>
  `;

  pageEl.appendChild(mainEl);

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
  let initialTitle = "Новая заметка";
  let isFavorite = false;

  if (String(noteId) !== "new") {
    try {
      const note = await apiClient.getNote(noteId as number);
      const blocksData = await apiClient.getBlocksForNote(noteId as number);
      initialTitle = note.title;
      isFavorite = note.is_favorite || false;
      const backendBlocks = blocksData?.blocks || [];
      initialBlocks = backendBlocks.map((block: any) => ({
        id: block.id,
        type: block.type,
        content: block.text || "",
        language: block.language || "text",
      }));

      if (isFavorite) {
        favoriteBtn.classList.add("active");
      }
    } catch (e) {
      alert("Не удалось загрузить заметку.");
      router.navigate("notes");
      return;
    }
  }

  if (initialBlocks.length === 0) {
    initialBlocks.push({
      id: `local-${Date.now()}`,
      type: "text",
      content: "",
    });
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

  if (
    String(noteId) === "new" &&
    initialBlocks.length > 0 &&
    initialBlocks[0]
  ) {
    editorManager.focusBlock(initialBlocks[0].id);
  }

  deleteBtn.addEventListener("click", async () => {
    if (String(noteId) === "new") {
      router.navigate("notes");
      return;
    }
    if (confirm("Вы уверены, что хотите удалить эту заметку?")) {
      try {
        await apiClient.deleteNote(noteId as number);
        document.dispatchEvent(new CustomEvent("notesUpdated"));
        router.navigate("notes");
      } catch (err) {
        console.error("Failed to delete note:", err);
        alert("Не удалось удалить заметку.");
      }
    }
  });

  favoriteBtn.addEventListener("click", async () => {
    if (String(noteId) === "new") {
      alert("Сначала сохраните заметку, чтобы добавить ее в избранное.");
      return;
    }
    const newFavoriteStatus = !favoriteBtn.classList.contains("active");
    try {
      await apiClient.toggleFavorite(noteId as number, newFavoriteStatus);
      favoriteBtn.classList.toggle("active", newFavoriteStatus);
      document.dispatchEvent(new CustomEvent("notesUpdated"));
    } catch (err) {
      console.error("Failed to update favorite status:", err);
      alert("Не удалось обновить статус избранного.");
    }
  });
}
