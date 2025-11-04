import { apiClient } from "../api/apiClient";
import { Block, renderBlock, CodeBlock } from "../components/block";
import { createImageModal } from "../components/imageModal";
import { debounce } from "../utils/debounce";

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
  const mainContainer = container.closest<HTMLElement>(".note-editor__main");

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
      const blockToSave = blocks.find((b) => b.id === blockId);
      if (!blockToSave) return;

      await apiClient.updateBlock(blockToSave.id, {
        text: blockToSave.content,
        formats: [],
      });

      saveStatusEl.textContent = "Сохранено";
    } catch (err) {
      console.error("Save block error:", err);
      saveStatusEl.textContent = "Ошибка сохранения";
    }
  };

  const updateBlockContent = (id: string | number, newContent: string) => {
    const block = blocks.find((b) => b.id.toString() === id.toString());
    if (block) {
      block.content = newContent;
      if (!debouncedSaves.has(id)) {
        const debouncedSave = debounce(() => saveBlock(id), 1500);
        debouncedSaves.set(id, debouncedSave);
      }
      const debouncedFn = debouncedSaves.get(id);
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
        content: uploadedFile.url,
      };
    } else {
      newBlockData = await apiClient.createBlock(noteId, {
        type: "text",
        before_block_id: beforeBlockId as number,
      });

      const baseBlock = { id: newBlockData.id, type, content: "" };
      if (type === "code") {
        newBlock = { ...baseBlock, language: "javascript" } as CodeBlock;
      } else {
        newBlock = baseBlock;
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

  const applyInlineStyle = (styleProperty: string, styleValue: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const parentBlock = (
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement)
    )?.closest(".block--text");
    if (!parentBlock) return;

    const span = document.createElement("span");
    span.style.setProperty(styleProperty, styleValue);

    try {
      const selectedContent = range.extractContents();
      span.appendChild(selectedContent);
      range.insertNode(span);
    } catch (e) {
      console.error("Could not apply style:", e);
      return;
    }

    selection.removeAllRanges();

    const blockId =
      parentBlock.closest<HTMLElement>(".block-container")?.dataset.blockId;
    if (blockId) {
      updateBlockContent(blockId, parentBlock.innerHTML);
    }
  };

  const fragmentToHtml = (fragment: DocumentFragment): string => {
    const div = document.createElement("div");
    div.appendChild(fragment.cloneNode(true));
    return div.innerHTML;
  };

  const splitBlockAndInsertCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0)
      return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) return;

    const parentBlockElement = (
      range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentElement
        : (range.commonAncestorContainer as HTMLElement)
    )?.closest<HTMLElement>(".block");

    const parentContainerElement =
      parentBlockElement?.closest<HTMLElement>(".block-container");
    if (!parentBlockElement || !parentContainerElement?.dataset.blockId) return;

    const originalBlockId = parentContainerElement.dataset.blockId;
    const originalBlockIndex = blocks.findIndex(
      (b) => b.id.toString() === originalBlockId
    );
    if (originalBlockIndex === -1) return;

    const beforeRange = document.createRange();
    beforeRange.selectNodeContents(parentBlockElement);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const beforeFragment = beforeRange.cloneContents();
    const beforeContent = fragmentToHtml(beforeFragment);

    const afterRange = document.createRange();
    afterRange.selectNodeContents(parentBlockElement);
    afterRange.setStart(range.endContainer, range.endOffset);
    const afterFragment = afterRange.cloneContents();
    const afterContent = fragmentToHtml(afterFragment);

    const newBlocks: Block[] = [];

    if (beforeContent.trim()) {
      newBlocks.push({
        id: originalBlockId,
        type: "text",
        content: beforeContent,
      });
    }

    const newCodeBlock: CodeBlock = {
      id: `local-${Date.now()}`,
      type: "code",
      content: selectedText,
      language: "text",
    };
    newBlocks.push(newCodeBlock);

    if (afterContent.trim()) {
      newBlocks.push({
        id: `local-${Date.now() + 1}`,
        type: "text",
        content: afterContent,
      });
    }

    blocks.splice(originalBlockIndex, 1, ...newBlocks);
    render();
    focusBlock(newCodeBlock.id);
  };

  const setupEventListeners = () => {
    if (!mainContainer) return;

    titleInput.addEventListener("input", debouncedSaveTitle);

    document.addEventListener("selectionchange", () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        toolbar?.classList.remove("visible");
        return;
      }
      const targetNode = selection.anchorNode;
      if (!targetNode || !(targetNode instanceof Node)) {
        toolbar?.classList.remove("visible");
        return;
      }
      const parentBlock = (
        targetNode.nodeType === Node.TEXT_NODE
          ? targetNode.parentElement
          : (targetNode as HTMLElement)
      )?.closest(".block--text");
      if (parentBlock && container.contains(parentBlock)) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const mainRect = mainContainer.getBoundingClientRect();

        if (toolbar) {
          toolbar.style.top = `${rect.top - mainRect.top + mainContainer.scrollTop - toolbar.offsetHeight - 5}px`;
          toolbar.style.left = `${rect.left - mainRect.left + rect.width / 2 - toolbar.offsetWidth / 2}px`;
          toolbar.classList.add("visible");
        }
      } else {
        toolbar?.classList.remove("visible");
      }
    });

    container.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.closest(".block--code")) return;
        e.preventDefault();
        const targetBlockContainer =
          target.closest<HTMLElement>(".block-container");
        if (targetBlockContainer?.dataset.blockId) {
          addNewBlock(targetBlockContainer.dataset.blockId, "text");
        }
      }
    });

    container.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const handle = target.closest<HTMLElement>(".block-handle");
      if (handle) {
        const parentContainer = handle.closest<HTMLElement>(".block-container");
        if (parentContainer && addBlockMenu) {
          addBlockMenu.style.top = `${parentContainer.offsetTop + handle.offsetTop + handle.offsetHeight}px`;
          addBlockMenu.style.left = `${parentContainer.offsetLeft + handle.offsetLeft}px`;
          addBlockMenu.classList.add("visible");
          addBlockMenu.dataset.currentBlockId = parentContainer.dataset.blockId;
        }
      }
    });

    if (addBlockMenu) {
      addBlockMenu.addEventListener("click", async (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const item = target.closest<HTMLElement>(".menu-item");
        const type = item?.dataset.type as Block["type"];
        const currentBlockId = addBlockMenu.dataset.currentBlockId;

        addBlockMenu.classList.remove("visible");
        if (type && currentBlockId) {
          await addNewBlock(currentBlockId, type);
        }
      });
    }

    if (toolbar) {
      const fontDropdown = toolbar.querySelector<HTMLElement>("#font-dropdown");

      if (fontDropdown) {
        const fontNameDisplay =
          fontDropdown.querySelector<HTMLElement>("#current-font-name");
        const dropdownMenu =
          fontDropdown.querySelector<HTMLElement>(".dropdown-menu");

        fontDropdown.addEventListener("click", (e) => {
          e.stopPropagation();
          fontDropdown.classList.toggle("active");
        });

        dropdownMenu?.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const item = target.closest<HTMLElement>(".dropdown-item");
          if (item && item.dataset.value && fontNameDisplay) {
            applyInlineStyle("font-family", item.dataset.value);
            fontNameDisplay.textContent = item.textContent || "Sans-Serif";
          }
        });
      }

      document.addEventListener("click", (e) => {
        if (fontDropdown && !fontDropdown.contains(e.target as Node)) {
          fontDropdown.classList.remove("active");
        }
        if (
          addBlockMenu &&
          !addBlockMenu.contains(e.target as Node) &&
          !(e.target as HTMLElement).closest(".block-handle")
        ) {
          addBlockMenu.classList.remove("visible");
        }
      });

      toolbar.addEventListener("mousedown", (e) => {
        e.preventDefault();
      });

      toolbar.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const commandElement = target.closest("button[data-command]");
        if (!commandElement) return;

        const command = commandElement.getAttribute("data-command")!;

        if (command === "convertToCode") {
          splitBlockAndInsertCode();
          return;
        }

        const value = commandElement.getAttribute("data-value") || undefined;
        document.execCommand(command, false, value);
      });
    }
  };

  setupEventListeners();

  return {
    render,
    getBlocks: () => blocks,
    focusBlock,
  };
}
