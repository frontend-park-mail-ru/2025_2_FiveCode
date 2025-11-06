import { apiClient } from "../api/apiClient";
import {
  Block,
  renderBlock,
  BlockTextFormat,
  UpdateCallback,
  BlockUpdateData,
} from "../components/block";
import { createImageModal } from "../components/imageModal";
import { debounce } from "../utils/debounce";
import { setupEventManager } from "./eventManager";

interface EditorManagerConfig {
  container: HTMLElement;
  toolbar: HTMLElement;
  addBlockMenu: HTMLElement;
  initialBlocks: Block[];
  titleInput: HTMLInputElement;
  noteId: string | number;
  saveStatusEl: HTMLElement;
}

export interface EditorManager {
  render: () => void;
  getBlocks: () => Block[];
  focusBlock: (blockId: string | number) => void;
  addNewBlock: (
    currentBlockId: string | number | undefined,
    type: Block["type"]
  ) => void;
}

export function createEditorManager({
  container,
  toolbar,
  addBlockMenu,
  initialBlocks,
  titleInput,
  noteId,
  saveStatusEl,
}: EditorManagerConfig): EditorManager {
  let blocks: Block[] = [...initialBlocks];
  const emptyStateEl = document.querySelector(
    ".empty-state-actions"
  ) as HTMLElement;

  const debouncedSaves = new Map<string | number, () => void>();

  const saveTitle = async () => {
    saveStatusEl.textContent = "Сохранение...";
    try {
      const newTitle = titleInput.value;
      await apiClient.updateNote(noteId, { title: newTitle });
      saveStatusEl.textContent = "Сохранено";
      document.dispatchEvent(
        new CustomEvent("noteTitleUpdated", {
          detail: { noteId: noteId, newTitle: newTitle },
        })
      );
    } catch (err) {
      saveStatusEl.textContent = "Ошибка сохранения";
    }
  };

  const debouncedSaveTitle = debounce(saveTitle, 1500);

  const saveBlock = async (blockId: string | number) => {
    saveStatusEl.textContent = "Сохранение...";
    try {
      const blockToSave = blocks.find(
        (b) => b.id.toString() === blockId.toString()
      );
      if (!blockToSave) {
        return;
      }

      let payload: any = {};
      if (blockToSave.type === "code") {
        payload = {
          language: blockToSave.language,
          code_text: blockToSave.text,
        };
      } else {
        payload = {
          text: blockToSave.text || "",
          formats: blockToSave.formats || [],
        };
      }

      await apiClient.updateBlock(blockToSave.id, payload);

      saveStatusEl.textContent = "Сохранено";
    } catch (err) {
      console.error("Save block error:", err);
      saveStatusEl.textContent = "Ошибка сохранения";
    }
  };

  const updateBlockContent: UpdateCallback = (
    blockId: string | number,
    data: BlockUpdateData
  ) => {
    const block = blocks.find((b) => b.id.toString() === blockId.toString());
    if (block) {
      Object.assign(block, data);

      if (!debouncedSaves.has(blockId)) {
        const debouncedSave = debounce(() => saveBlock(blockId), 1500);
        debouncedSaves.set(blockId, debouncedSave);
      }

      const debouncedFn = debouncedSaves.get(blockId);
      if (debouncedFn) {
        debouncedFn();
      }
    }
  };

  const addNewBlock = async (
    currentBlockId: string | number | undefined,
    type: Block["type"]
  ) => {
    const currentIndex =
      currentBlockId !== undefined
        ? blocks.findIndex((b) => b.id.toString() === currentBlockId.toString())
        : -1;

    const beforeBlock = blocks[currentIndex + 1];
    const beforeBlockId = beforeBlock ? beforeBlock.id : undefined;

    let newBlockData;
    let newBlock: Block;

    if (type === "image") {
      const uploadedFile = await createImageModal();
      if (!uploadedFile) return;

      newBlockData = await apiClient.createBlock(noteId, {
        type: "attachment",
        file_id: uploadedFile.id,
        before_block_id: beforeBlockId as number,
      });

      newBlock = {
        id: newBlockData.id,
        type: "image",
        url: newBlockData.text || "",
        file_id: uploadedFile.id,
      };
    } else {
      newBlockData = await apiClient.createBlock(noteId, {
        type: type,
        before_block_id: beforeBlockId as number,
      });

      newBlock = {
        id: newBlockData.id,
        type: type,
        text: newBlockData.text || "",
        language: newBlockData.language || "",
        formats: [],
      };
    }

    if (currentIndex === -1) {
      blocks.push(newBlock);
    } else {
      blocks.splice(currentIndex + 1, 0, newBlock);
    }
    render();
    setTimeout(() => focusBlock(newBlock.id), 0);
  };

  const render = () => {
    const activeElement = document.activeElement;
    const activeBlockId = activeElement
      ? activeElement.closest<HTMLElement>(".block-container")?.dataset.blockId
      : undefined;

    container.innerHTML = "";
    blocks.forEach((block) => {
      const blockElement = renderBlock(block, updateBlockContent);
      container.appendChild(blockElement);
    });

    if (emptyStateEl) {
      emptyStateEl.style.display = blocks.length === 0 ? "block" : "none";
    }

    if (activeBlockId) {
      focusBlock(activeBlockId);
    }
  };

  const focusBlock = (blockId: string | number) => {
    const blockContainerElement = container.querySelector<HTMLElement>(
      `[data-block-id="${blockId}"]`
    );

    if (blockContainerElement) {
      blockContainerElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }

    const blockToFocus =
      blockContainerElement?.querySelector<HTMLElement>(".block");
    if (blockToFocus) {
      blockToFocus.focus();
    }
  };

  titleInput.addEventListener("input", debouncedSaveTitle);

  async function deleteBlock(blockId: string | number) {
    const idx = blocks.findIndex((b) => b.id.toString() === blockId.toString());
    if (idx === -1) return;
    const toDelete = blocks[idx];
    if (!toDelete) return;
    try {
      await apiClient.deleteBlock(toDelete.id);
      blocks.splice(idx, 1);
      render();
    } catch (err) {
      console.error("deleteBlock error", err);
    }
  }

  async function moveBlock(blockId: string | number, direction: "up" | "down") {
    const idx = blocks.findIndex((b) => b.id.toString() === blockId.toString());
    if (idx === -1) return;
    const newIndex = direction === "up" ? idx - 1 : idx + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const [movedBlock] = blocks.splice(idx, 1);
    if (!movedBlock) return;

    blocks.splice(newIndex, 0, movedBlock);

    const beforeBlockId = blocks[newIndex + 1]?.id;

    try {
      await apiClient.updateBlockPosition(blockId, {
        before_block_id: beforeBlockId as number,
      });
      render();
    } catch (err) {
      console.error("moveBlock api error", err);
      blocks.splice(newIndex, 1);
      blocks.splice(idx, 0, movedBlock);
      render();
    }
  }

  setupEventManager({
    container,
    toolbar,
    addBlockMenu,
    addNewBlock,
    updateBlockContent,
    deleteBlock,
    moveBlock,
  });

  return {
    render,
    getBlocks: () => blocks,
    focusBlock,
    addNewBlock,
  };
}
