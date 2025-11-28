import ejs from "ejs";
import { highlightCode } from "../utils/syntaxHighlighter";
import { getCaretPosition, setCaretPosition } from "../utils/caret";
import { debounce } from "../utils/debounce";
import {
  BlockTextFormat,
  reconstructHtmlFromFormats,
  parseHtmlToTextAndFormats,
} from "../editor/formatter";

export { BlockTextFormat, parseHtmlToTextAndFormats };

export interface BaseBlock {
  id: string | number;
  noteId: number;
  type: "text" | "code" | "image" | "attachment";
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TextContent {
  text: string;
  formats: BlockTextFormat[];
}

export interface CodeContent {
  code: string;
  language: string;
}

export interface AttachmentContent {
  url: string;
  caption?: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export type Block = BaseBlock & {
  content: TextContent | CodeContent | AttachmentContent;
};

export type BlockUpdateData = {
  text?: string;
  formats?: BlockTextFormat[];
  code?: string;
  language?: string;
};

export type UpdateCallback = (
  blockId: string | number,
  data: BlockUpdateData
) => void;

export function renderBlock(
  block: Block,
  updateCallback: UpdateCallback,
  readOnly: boolean = false
): HTMLElement {
  let element: HTMLElement;
  switch (block.type) {
    case "code":
      element = renderCodeBlock(block, updateCallback, readOnly);
      break;
    case "image":
    case "attachment":
      const content = block.content as AttachmentContent;
      const templateImg = `<div class="block block--image"><img src="<%= url %>" alt="image block"></div>`;
      const htmlImg = ejs.render(templateImg, {
        url:
          content.url || "https://via.placeholder.com/800x200.png?text=Image",
      });
      const docImg = new DOMParser().parseFromString(htmlImg, "text/html");
      element = docImg.body.firstChild as HTMLElement;
      break;
    case "text":
    default:
      element = renderTextBlock(block, updateCallback, readOnly);
      break;
  }

  const container = document.createElement("div");
  container.className = "block-container";
  container.dataset.blockId = String(block.id);

  if (!readOnly) {
    const handle = document.createElement("div");
    handle.className = "block-handle";
    const plus = document.createElement("div");
    plus.className = "button-plus";
    plus.innerHTML = "+";
    const actions = document.createElement("div");
    actions.className = "block-actions";

    const btnUp = document.createElement("button");
    btnUp.className = "block-action-btn";
    btnUp.setAttribute("data-action", "move-up");
    btnUp.textContent = "↑";
    const btnDown = document.createElement("button");
    btnDown.className = "block-action-btn";
    btnDown.setAttribute("data-action", "move-down");
    btnDown.textContent = "↓";
    const btnDelete = document.createElement("button");
    btnDelete.className = "block-action-btn block-action-delete";
    btnDelete.setAttribute("data-action", "delete");
    btnDelete.textContent = "✕";

    actions.appendChild(btnUp);
    actions.appendChild(btnDown);
    actions.appendChild(btnDelete);
    handle.appendChild(plus);
    container.appendChild(handle);
    container.appendChild(actions);
  }

  container.appendChild(element);

  return container;
}

function renderTextBlock(
  block: Block,
  updateCallback: UpdateCallback,
  readOnly: boolean
): HTMLElement {
  const content = block.content as TextContent;
  const template = `<div class="block block--text" data-block-id="${block.id}" contenteditable="<%= editable %>" spellcheck="false"><%- content %></div>`;
  const htmlContent = reconstructHtmlFromFormats(content.text, content.formats);
  const html = ejs.render(template, {
    content: htmlContent,
    editable: !readOnly,
  });
  const doc = new DOMParser().parseFromString(html, "text/html");
  const element = doc.body.firstChild as HTMLElement;

  if (!readOnly) {
    element.addEventListener("input", () => {
      const { text, formats } = parseHtmlToTextAndFormats(element);
      updateCallback(block.id, { text, formats });
    });
  }

  return element;
}

function renderCodeBlock(
  block: Block,
  updateCallback: UpdateCallback,
  readOnly: boolean
): HTMLElement {
  const content = block.content as CodeContent;

  const highlightedCode = highlightCode(content.code, content.language);

  const template = `
    <div class="block block--code" data-block-id="${block.id}">
      <div class="code-toolbar">
        <select class="code-language" <%= disabled ? 'disabled' : '' %>>
          <option value="sql" ${content.language === "sql" ? "selected" : ""}>SQL</option>
          <option value="javascript" ${content.language === "javascript" ? "selected" : ""}>JavaScript</option>
          <option value="text" ${content.language === "text" ? "selected" : ""}>Plain Text</option>
        </select>
      </div>
      <div class="code-content" contenteditable="<%= editable %>" spellcheck="false"><%- content %></div>
    </div>
  `;

  const html = ejs.render(template, {
    content: highlightedCode,
    language: content.language,
    editable: !readOnly,
    disabled: readOnly,
  });

  const doc = new DOMParser().parseFromString(html, "text/html");
  const element = doc.body.firstChild as HTMLElement;

  if (!readOnly) {
    const contentElement = element.querySelector(
      ".code-content"
    ) as HTMLElement;
    const languageSelect = element.querySelector(
      ".code-language"
    ) as HTMLSelectElement;

    const applyHighlighting = () => {
      const currentPos = getCaretPosition(contentElement);
      const rawCode = contentElement.innerText;
      const newHtml = highlightCode(rawCode, languageSelect.value);

      if (contentElement.innerHTML !== newHtml) {
        contentElement.innerHTML = newHtml;
        setCaretPosition(contentElement, currentPos);
      }
    };

    const debouncedSave = debounce(() => {
      updateCallback(block.id, {
        code: contentElement.innerText,
        language: languageSelect.value,
      });
    }, 500);

    const onInput = (e: Event) => {
      if ((e as InputEvent).inputType === "insertParagraph") {
        return;
      }
      applyHighlighting();
      debouncedSave();
    };

    contentElement.addEventListener("input", onInput);

    contentElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode("\n");

        range.deleteContents();
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        applyHighlighting();
        debouncedSave();
      }

      if (e.key === "Tab") {
        e.preventDefault();

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode("  ");

        range.deleteContents();
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        applyHighlighting();
        debouncedSave();
      }
    });

    languageSelect.addEventListener("change", () => {
      updateCallback(block.id, {
        code: contentElement.innerText,
        language: languageSelect.value,
      });
      applyHighlighting();
    });
  }

  return element;
}
