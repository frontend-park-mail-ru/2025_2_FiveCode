import { apiClient } from "../api/apiClient";
import {
  Block,
  renderBlock,
  UpdateCallback,
  BlockUpdateData,
  TextContent,
  CodeContent,
} from "../components/block";
import { createImageModal } from "../components/imageModal";
import { debounce } from "../utils/debounce";
import { setupEventManager } from "./eventManager";
import { handleError } from "../utils/errorHandler";
import { getCaretPosition, setCaretPosition } from "../utils/caret";

interface EditorManagerConfig {
  container: HTMLElement;
  toolbar: HTMLElement;
  addBlockMenu: HTMLElement;
  initialBlocks: Block[];
  titleInput: HTMLInputElement;
  noteId: string | number;
  saveStatusEl: HTMLElement;
  readOnly?: boolean;
}

export interface EditorManager {
  render: () => void;
  getBlocks: () => Block[];
  focusBlock: (blockId: string | number) => void;
  addNewBlock: (
    currentBlockId: string | number | undefined,
    type: Block["type"]
  ) => void;
  syncBlocks: (newBlocks: Block[]) => void;
}

export function createEditorManager({
  container,
  toolbar,
  addBlockMenu,
  initialBlocks,
  titleInput,
  noteId,
  saveStatusEl,
  readOnly = false,
}: EditorManagerConfig): EditorManager {
  let blocks: Block[] = [...initialBlocks];
  const emptyStateEl = document.querySelector(
    ".empty-state-actions"
  ) as HTMLElement;

  const debouncedSaves = new Map<string | number, () => void>();

  const saveTitle = async () => {
    if (readOnly) return;
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
      handleError(err, "Не удалось сохранить заголовок");
    }
  };

  const debouncedSaveTitle = debounce(saveTitle, 500);

  const saveBlock = async (blockId: string | number) => {
    if (readOnly) return;
    saveStatusEl.textContent = "Сохранение...";
    try {
      const blockToSave = blocks.find(
        (b) => b.id.toString() === blockId.toString()
      );
      if (!blockToSave) {
        return;
      }

      let payload: { type: string; content: any };

      if (blockToSave.type === "code") {
        const content = blockToSave.content as CodeContent;
        payload = {
          type: "code",
          content: {
            language: content.language,
            code: content.code,
          },
        };
      } else if (blockToSave.type === "text") {
        const content = blockToSave.content as TextContent;
        payload = {
          type: "text",
          content: {
            text: content.text || "",
            formats: content.formats || [],
          },
        };
      } else {
        return;
      }

      await apiClient.updateBlock(blockToSave.id, payload);

      saveStatusEl.textContent = "Сохранено";
    } catch (err) {
      saveStatusEl.textContent = "Ошибка сохранения";
      handleError(err, "Не удалось сохранить блок");
    }
  };

  const updateBlockContent: UpdateCallback = (
    blockId: string | number,
    data: BlockUpdateData
  ) => {
    if (readOnly) return;
    const block = blocks.find((b) => b.id.toString() === blockId.toString());
    if (block) {
      if (block.type === "text") {
        const content = block.content as TextContent;
        if (data.text !== undefined) content.text = data.text;
        if (data.formats !== undefined) content.formats = data.formats;
      } else if (block.type === "code") {
        const content = block.content as CodeContent;
        if (data.code !== undefined) content.code = data.code;
        if (data.language !== undefined) content.language = data.language;
      }

      if (!debouncedSaves.has(blockId)) {
        const debouncedSave = debounce(() => saveBlock(blockId), 500);
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
    if (readOnly) return;
    const currentIndex =
      currentBlockId !== undefined
        ? blocks.findIndex((b) => b.id.toString() === currentBlockId.toString())
        : -1;

    const beforeBlock = blocks[currentIndex + 1];
    const beforeBlockId = beforeBlock ? beforeBlock.id : undefined;

    let newBlock: Block;

    try {
      if (type === "image") {
        const uploadedFile = await createImageModal();
        if (!uploadedFile) return;

        newBlock = await apiClient.createBlock(noteId, {
          type: "attachment",
          file_id: uploadedFile.id,
          before_block_id: beforeBlockId as number,
        });
      } else {
        newBlock = await apiClient.createBlock(noteId, {
          type: type,
          before_block_id: beforeBlockId as number,
        });
      }

      if (currentIndex === -1) {
        blocks.push(newBlock);
      } else {
        blocks.splice(currentIndex + 1, 0, newBlock);
      }
      render();
      setTimeout(() => focusBlock(newBlock.id), 0);
    } catch (err) {
      handleError(err, "Ошибка при создании блока");
    }
  };

  const syncBlocks = (newBlocks: Block[]) => {
    blocks = newBlocks;

    const activeElement = document.activeElement as HTMLElement;
    const activeBlockId = activeElement
      ?.closest(".block-container")
      ?.getAttribute("data-block-id");

    let savedCaretPosition: number | null = null;
    let savedFocusedBlockId: string | null = null;

    if (activeBlockId && activeElement) {
      const editable = activeElement.closest(
        '[contenteditable="true"]'
      ) as HTMLElement;
      if (editable) {
        savedCaretPosition = getCaretPosition(editable);
        savedFocusedBlockId = activeBlockId;
      }
    }

    const newBlockMap = new Map(newBlocks.map((b) => [String(b.id), b]));
    const currentDomBlocks = Array.from(container.children) as HTMLElement[];

    currentDomBlocks.forEach((el) => {
      const id = el.dataset.blockId;
      if (id && !newBlockMap.has(id)) {
        el.remove();
      }
    });

    let previousElement: HTMLElement | null = null;

    const processDomElement = (
      existingElement: HTMLElement | null,
      block: Block
    ) => {
      const newBlockElement = renderBlock(block, updateBlockContent, readOnly);

      if (existingElement) {
        existingElement.replaceWith(newBlockElement);
        return newBlockElement;
      } else {
        if (previousElement) {
          previousElement.after(newBlockElement);
        } else {
          container.prepend(newBlockElement);
        }
        return newBlockElement;
      }
    };

    newBlocks.forEach((block) => {
      const blockIdStr = String(block.id);
      let domElement = container.querySelector(
        `.block-container[data-block-id="${blockIdStr}"]`
      ) as HTMLElement;

      domElement = processDomElement(domElement, block);

      if (previousElement) {
        if (previousElement.nextElementSibling !== domElement) {
          previousElement.after(domElement);
        }
      } else {
        if (container.firstElementChild !== domElement) {
          container.prepend(domElement);
        }
      }

      previousElement = domElement;
    });

    if (savedFocusedBlockId && savedCaretPosition !== null) {
      const newContainer = container.querySelector(
        `.block-container[data-block-id="${savedFocusedBlockId}"]`
      );
      if (newContainer) {
        const editable = newContainer.querySelector(
          '[contenteditable="true"]'
        ) as HTMLElement;
        if (editable) {
          editable.focus();
          setCaretPosition(editable, savedCaretPosition);
        }
      }
    }

    if (emptyStateEl) {
      emptyStateEl.style.display =
        blocks.length === 0 && !readOnly ? "block" : "none";
    }
  };

  const render = () => {
    const activeElement = document.activeElement;
    const activeBlockId = activeElement
      ? activeElement.closest<HTMLElement>(".block-container")?.dataset.blockId
      : undefined;

    container.innerHTML = "";
    blocks.forEach((block) => {
      const blockElement = renderBlock(block, updateBlockContent, readOnly);
      container.appendChild(blockElement);
    });

    if (emptyStateEl) {
      emptyStateEl.style.display =
        blocks.length === 0 && !readOnly ? "block" : "none";
    }

    if (activeBlockId) {
      focusBlock(activeBlockId);
    }
  };

  const focusBlock = (blockId: string | number) => {
    if (readOnly) return;
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
      setTimeout(() => {
        if (blockToFocus.classList.contains("block--text")) {
          blockToFocus.focus();
        } else {
          blockToFocus.focus();
        }
      }, 0);
    }
  };

  if (!readOnly) {
    titleInput.addEventListener("input", debouncedSaveTitle);

    titleInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (titleInput.selectionStart === titleInput.value.length) {
          await addNewBlock(undefined, "text");
        }
      }
    });
  } else {
    titleInput.setAttribute("readonly", "true");
  }

  async function deleteBlock(blockId: string | number) {
    if (readOnly) return;
    const idx = blocks.findIndex((b) => b.id.toString() === blockId.toString());
    if (idx === -1) return;
    const toDelete = blocks[idx];
    if (!toDelete) return;
    try {
      await apiClient.deleteBlock(toDelete.id);
      blocks.splice(idx, 1);
      if (blocks.length === 0) {
        await addNewBlock(undefined, "text");
      }
      render();
    } catch (err) {
      handleError(err, "Не удалось удалить блок");
    }
  }

  async function moveBlock(blockId: string | number, direction: "up" | "down") {
    if (readOnly) return;
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
      blocks.splice(newIndex, 1);
      blocks.splice(idx, 0, movedBlock);
      render();
      handleError(err, "Ошибка при перемещении блока");
    }
  }

  if (!readOnly) {
    setupEventManager({
      container,
      toolbar,
      addBlockMenu,
      addNewBlock,
      updateBlockContent,
      deleteBlock,
      moveBlock,
    });
  }

  return {
    render,
    getBlocks: () => blocks,
    focusBlock,
    addNewBlock,
    syncBlocks,
  };
}
