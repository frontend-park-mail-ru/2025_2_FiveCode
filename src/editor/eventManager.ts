import { Block, parseHtmlToTextAndFormats } from "../components/block";

type AddNewBlockCallback = (
  currentBlockId: string | number,
  type: Block["type"]
) => void;
type UpdateBlockCallback = (
  blockId: string | number,
  text: string,
  formats: any[]
) => void;

interface EventManagerDependencies {
  container: HTMLElement;
  toolbar: HTMLElement;
  addBlockMenu: HTMLElement;
  addNewBlock: AddNewBlockCallback;
  updateBlockContent: UpdateBlockCallback;
}

// saved selection range so dropdown interactions can restore selection
let lastSelectionRange: Range | null = null;

function applyStyleToSelection(
  styleProperty: "fontFamily" | "fontSize",
  value: string
) {
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
  // Extract selected content, wrap it into a single span with the style,
  // and insert back. This avoids creating multiple nested spans which can
  // lead to compounded sizes or visual anomalies.
  const fragment = range.extractContents();

  const removeInline = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (styleProperty === "fontFamily") {
        el.style.fontFamily = "";
      } else {
        el.style.fontSize = "";
      }
      el.childNodes.forEach(removeInline);
    }
  };

  // If fragment is a single element that already has the style applied,
  // update it instead of wrapping to allow repeated changes.
  if (
    fragment.childNodes.length === 1 &&
    fragment.firstChild?.nodeType === Node.ELEMENT_NODE
  ) {
    const firstEl = fragment.firstChild as HTMLElement;
    if (
      (styleProperty === "fontFamily" && firstEl.style.fontFamily) ||
      (styleProperty === "fontSize" && firstEl.style.fontSize)
    ) {
      if (styleProperty === "fontFamily") firstEl.style.fontFamily = value;
      else firstEl.style.fontSize = value;
      range.insertNode(firstEl);
      // Keep the contents selected: select node contents of the updated element
      try {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          const r = document.createRange();
          r.selectNodeContents(firstEl);
          sel.addRange(r);
          lastSelectionRange = r.cloneRange();
        }
      } catch (e) {
        // fallback to caret after node
        range.setStartAfter(firstEl);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }
  }

  // Clean existing inline styles inside the fragment to avoid nested/conflicting styles
  fragment.childNodes.forEach(removeInline);

  const wrapperSpan = document.createElement("span");
  if (styleProperty === "fontFamily") {
    wrapperSpan.style.fontFamily = value;
  } else {
    wrapperSpan.style.fontSize = value;
  }
  wrapperSpan.appendChild(fragment);
  range.insertNode(wrapperSpan);
  // Keep the inserted content selected
  try {
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(wrapperSpan);
      sel.addRange(r);
      lastSelectionRange = r.cloneRange();
    }
  } catch (e) {
    // fallback: place caret after wrapper
    range.setStartAfter(wrapperSpan);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

export function setupEventManager({
  container,
  toolbar,
  addBlockMenu,
  addNewBlock,
  updateBlockContent,
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
        updateBlockContent(blockId, text, formats);
      }
    }
  };

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
        // Update toolbar current font/size display based on selection start
        try {
          const startContainer = range.startContainer;
          const elForStyle =
            startContainer.nodeType === Node.TEXT_NODE
              ? (startContainer.parentElement as HTMLElement)
              : (startContainer as HTMLElement);
          const computed = elForStyle && window.getComputedStyle(elForStyle);
          const fontNameEl =
            toolbar.querySelector<HTMLElement>("#current-font-name");
          const fontSizeEl =
            toolbar.querySelector<HTMLElement>("#current-font-size");
          if (computed && fontNameEl) {
            const rawFam = computed.fontFamily || "";
            let fam = "";
            if (rawFam) {
              const parts = rawFam.split(",");
              if (parts && parts.length > 0 && parts[0]) {
                fam = parts[0].trim().replace(/^['\"]|['\"]$/g, "");
              }
            }
            fontNameEl.textContent = fam || fontNameEl.textContent || "";
          }
          if (computed && fontSizeEl) {
            const rawSize = computed.fontSize || "";
            const sizeNum = rawSize
              ? Math.round(parseFloat(rawSize))
              : undefined;
            fontSizeEl.textContent =
              typeof sizeNum === "number"
                ? String(sizeNum)
                : fontSizeEl.textContent || "";
          }
        } catch (err) {
          // ignore
        }
        toolbar.style.top = `${rect.top - mainRect.top + mainContainer.scrollTop - toolbar.offsetHeight - 5}px`;
        toolbar.style.left = `${rect.left - mainRect.left + rect.width / 2 - toolbar.offsetWidth / 2}px`;
        toolbar.classList.add("visible");
      }
    } else {
      toolbar?.classList.remove("visible");
    }
  });

  // Keep last selection range so clicks in dropdown don't clear it
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastSelectionRange = sel.getRangeAt(0).cloneRange();
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
      const styleProperty =
        dropdown?.id === "font-dropdown" ? "fontFamily" : "fontSize";
      const display = dropdown?.querySelector<HTMLElement>(
        styleProperty === "fontFamily"
          ? "#current-font-name"
          : "#current-font-size"
      );

      if (dropdownItem.dataset.value && display) {
        // restore selection so applyStyleToSelection works even if focus moved
        try {
          const sel = window.getSelection();
          if (sel && lastSelectionRange) {
            sel.removeAllRanges();
            sel.addRange(lastSelectionRange);
          }
        } catch (err) {
          /* ignore */
        }
        const value =
          styleProperty === "fontSize"
            ? `${dropdownItem.dataset.value}px`
            : dropdownItem.dataset.value;
        applyStyleToSelection(styleProperty, value);
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
