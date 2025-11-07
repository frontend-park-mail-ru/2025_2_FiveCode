import {
  Block,
  parseHtmlToTextAndFormats,
  UpdateCallback,
} from "../components/block";
import { sizeMap } from "./constants";
import {createDeleteBlock} from "../components/deleteNoteModal";

interface EventManagerDependencies {
  container: HTMLElement;
  toolbar: HTMLElement;
  addBlockMenu: HTMLElement;
  addNewBlock: (
    currentBlockId: string | number | undefined,
    type: Block["type"]
  ) => void;
  updateBlockContent: UpdateCallback;
  deleteBlock?: (blockId: string | number) => Promise<void>;
  moveBlock?: (
    blockId: string | number,
    direction: "up" | "down"
  ) => Promise<void>;
}

let lastSelectionRange: Range | null = null;

export function setupEventManager({
  container,
  toolbar,
  addBlockMenu,
  addNewBlock,
  updateBlockContent,
  deleteBlock,
  moveBlock,
}: EventManagerDependencies) {
  const mainContainer = container.closest<HTMLElement>(".note-editor__main");
  if (!mainContainer) return;

  const triggerUpdate = () => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;

    const parentBlock = (
      selection.anchorNode.nodeType === Node.TEXT_NODE
        ? selection.anchorNode.parentElement
        : (selection.anchorNode as HTMLElement)
    )?.closest(".block--text");

    if (parentBlock) {
      const blockId = (parentBlock as HTMLElement).dataset.blockId;
      if (blockId) {
        const { text, formats } = parseHtmlToTextAndFormats(
          parentBlock as HTMLElement
        );
        updateBlockContent(blockId, { text, formats });
      }
    }
  };

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastSelectionRange = selection.getRangeAt(0).cloneRange();
    } else {
      lastSelectionRange = null;
    }

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
      const targetBlockContainer =
        target.closest<HTMLElement>(".block-container");
      if (e.shiftKey) {
        e.preventDefault();
        try {
          const sel = window.getSelection();
          if (!sel || !sel.getRangeAt(0)) return;
          const range = sel.getRangeAt(0);
          const br = document.createElement("br");
          const zwsp = document.createTextNode("\u200B");
          range.deleteContents();
          range.insertNode(br);
          range.collapse(false);
          br.parentNode?.insertBefore(zwsp, br.nextSibling);
          range.setStart(zwsp, 1);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          triggerUpdate();
        } catch (err) {}
        return;
      }

      e.preventDefault();
      triggerUpdate();
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

    const actionBtn = target.closest<HTMLElement>("[data-action]");
    if (actionBtn) {
      const action = actionBtn.getAttribute("data-action");
      const blockContainer = actionBtn.closest<HTMLElement>(".block-container");
      if (blockContainer && blockContainer.dataset.blockId) {
        const id = blockContainer.dataset.blockId;
        if (action === "delete" && typeof deleteBlock === "function") {
          const deleteModal = createDeleteBlock();
          document.body.appendChild(deleteModal);
          
          deleteModal.querySelector(".delete-note-confirm")?.addEventListener("click", async () => {
            try {
              deleteBlock(id);
              
            } catch (err) {
              console.error("Failed to delete note:", err);
            }
            deleteModal.remove();
          });

        }
        if (action === "move-up" && typeof moveBlock === "function") {
          moveBlock(id, "up");
        }
        if (action === "move-down" && typeof moveBlock === "function") {
          moveBlock(id, "down");
        }
      }
      return;
    }
  });

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

  toolbar.addEventListener("mousedown", (e) => {
    e.preventDefault();

    const target = e.target as HTMLElement;
    const commandButton = target.closest("button[data-command]");
    const dropdownToggle = target.closest(".dropdown-toggle");
    const dropdownItem = target.closest<HTMLElement>(".dropdown-item");

    if (commandButton) {
      const command = commandButton.getAttribute("data-command")!;
      document.execCommand(command, false);
      triggerUpdate();
    }

    if (dropdownToggle) {
      const dropdown = dropdownToggle.closest<HTMLElement>(".format-dropdown");
      if (dropdown) {
        const isActive = dropdown.classList.contains("active");
        document
          .querySelectorAll(".format-dropdown.active")
          .forEach((d) => d.classList.remove("active"));
        if (!isActive) {
          dropdown.classList.add("active");
        }
      }
    }

    if (dropdownItem) {
      const dropdown = dropdownItem.closest<HTMLElement>(".format-dropdown");
      const display = dropdown?.querySelector<HTMLElement>(
        dropdown?.id === "font-dropdown"
          ? "#current-font-name"
          : "#current-font-size"
      );

      if (dropdownItem.dataset.value && display) {
        try {
          const sel = window.getSelection();
          if (sel && lastSelectionRange) {
            sel.removeAllRanges();
            sel.addRange(lastSelectionRange);
          }
        } catch (err) {}

        if (dropdown?.id === "font-dropdown") {
          document.execCommand("fontName", false, dropdownItem.dataset.value);
        } else if (dropdown?.id === "size-dropdown") {
          const sizeValue = Object.keys(sizeMap).find(
            (key) => sizeMap[key] === parseInt(dropdownItem.dataset.value || "")
          );
          if (sizeValue) {
            document.execCommand("fontSize", false, sizeValue);
          }
        }

        display.textContent = dropdownItem.dataset.value || "";
        dropdown?.classList.remove("active");
        triggerUpdate();
      }
    }
  });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".format-dropdown")) {
      document
        .querySelectorAll(".format-dropdown.active")
        .forEach((d) => d.classList.remove("active"));
    }
    if (
      addBlockMenu &&
      !addBlockMenu.contains(e.target as Node) &&
      !target.closest(".block-handle")
    ) {
      addBlockMenu.classList.remove("visible");
    }
  });
}
