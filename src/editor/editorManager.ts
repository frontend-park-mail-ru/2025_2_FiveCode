import { apiClient } from "../api/apiClient";
import {
  Block,
  renderBlock,
  BlockTextFormat,
  parseHtmlToTextAndFormats,
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
        console.warn("saveBlock: block not found", blockId);
        return;
      }

      console.debug("saveBlock: saving block", blockToSave.id);

      await apiClient.updateBlock(blockToSave.id, {
        text: blockToSave.text || "",
        formats: blockToSave.formats || [],
      });

      saveStatusEl.textContent = "Сохранено";
    } catch (err) {
      console.error("Save block error:", err);
      saveStatusEl.textContent = "Ошибка сохранения";
    }
  };

  const updateBlockContent = (
    blockId: string | number,
    newText: string,
    newFormats: BlockTextFormat[]
  ) => {
    const block = blocks.find((b) => b.id.toString() === blockId.toString());
    if (block) {
      block.text = newText;
      block.formats = newFormats;

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
    currentBlockId: string | number,
    type: Block["type"]
  ) => {
    const currentIndex = blocks.findIndex(
      (b) => b.id.toString() === currentBlockId.toString()
    );
    if (currentIndex === -1) return;

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
        type: "text",
        before_block_id: beforeBlockId as number,
      });

      newBlock = {
        id: newBlockData.id,
        type: "text",
        text: "",
        formats: [],
      };

      if (type === "code") {
        newBlock.type = "code";
        newBlock.language = "javascript";
      }
    }

    blocks.splice(currentIndex + 1, 0, newBlock);
    render();
    focusBlock(newBlock.id);
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

    if (activeBlockId) {
      focusBlock(activeBlockId);
    }
  };

  const focusBlock = (blockId: string | number) => {
    const blockToFocus = container.querySelector(
      `[data-block-id="${blockId}"] .block`
    );
    if (blockToFocus) {
      (blockToFocus as HTMLElement).focus();
    }
  };

  titleInput.addEventListener("input", debouncedSaveTitle);

  setupEventManager({
    container,
    toolbar,
    addBlockMenu,
    addNewBlock,
    updateBlockContent,
  });

  return {
    render,
    getBlocks: () => blocks,
    focusBlock,
  };
}
