import ejs from "ejs";
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
  updateCallback: UpdateCallback
): HTMLElement {
  let element: HTMLElement;
  switch (block.type) {
    case "code":
      element = renderCodeBlock(block, updateCallback);
      break;
    case "image":
    case "attachment":
      element = renderImageBlock(block);
      break;
    case "text":
    default:
      element = renderTextBlock(block, updateCallback);
      break;
  }

  const container = document.createElement("div");
  container.className = "block-container";
  container.dataset.blockId = String(block.id);
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
  btnUp.title = "Move up";
  btnUp.textContent = "↑";

  const btnDown = document.createElement("button");
  btnDown.className = "block-action-btn";
  btnDown.setAttribute("data-action", "move-down");
  btnDown.title = "Move down";
  btnDown.textContent = "↓";

  const btnDelete = document.createElement("button");
  btnDelete.className = "block-action-btn block-action-delete";
  btnDelete.setAttribute("data-action", "delete");
  btnDelete.title = "Delete block";
  btnDelete.textContent = "✕";

  actions.appendChild(btnUp);
  actions.appendChild(btnDown);
  actions.appendChild(btnDelete);

  handle.appendChild(plus);
  container.appendChild(handle);
  container.appendChild(element);
  container.appendChild(actions);

  return container;
}

function renderTextBlock(
  block: Block,
  updateCallback: UpdateCallback
): HTMLElement {
  const content = block.content as TextContent;
  const template = `<div class="block block--text" data-block-id="${block.id}" contenteditable="true" spellcheck="false"><%- content %></div>`;
  const htmlContent = reconstructHtmlFromFormats(content.text, content.formats);
  const html = ejs.render(template, { content: htmlContent });
  const doc = new DOMParser().parseFromString(html, "text/html");
  const element = doc.body.firstChild as HTMLElement;

  element.addEventListener("input", () => {
    const { text, formats } = parseHtmlToTextAndFormats(element);
    updateCallback(block.id, { text, formats });
  });

  return element;
}

function renderImageBlock(block: Block): HTMLElement {
  const content = block.content as AttachmentContent;
  const template = `<div class="block block--image"><img src="<%= url %>" alt="image block"></div>`;
  const html = ejs.render(template, {
    url: content.url || "https://via.placeholder.com/800x200.png?text=Image",
  });
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.firstChild as HTMLElement;
}

function renderCodeBlock(
  block: Block,
  updateCallback: UpdateCallback
): HTMLElement {
  const content = block.content as CodeContent;
  const template = `
    <div class="block block--code" data-block-id="${block.id}">
      <div class="code-toolbar">
        <select class="code-language">
          <option value="sql" ${
            content.language === "sql" ? "selected" : ""
          }>SQL</option>
          <option value="javascript" ${
            content.language === "javascript" ? "selected" : ""
          }>JavaScript</option>
          <option value="text" ${
            content.language === "text" ? "selected" : ""
          }>Plain Text</option>
        </select>
      </div>
      <div class="code-content" contenteditable="true" spellcheck="false"><%= content %></div>
    </div>
  `;
  const html = ejs.render(template, {
    content: content.code,
    language: content.language,
  });
  const doc = new DOMParser().parseFromString(html, "text/html");
  const element = doc.body.firstChild as HTMLElement;
  const contentElement = element.querySelector(".code-content") as HTMLElement;
  const languageSelect = element.querySelector(
    ".code-language"
  ) as HTMLSelectElement;

  const onUpdate = () => {
    updateCallback(block.id, {
      code: contentElement.innerText,
      language: languageSelect.value,
    });
  };

  contentElement.addEventListener("input", onUpdate);
  languageSelect.addEventListener("change", onUpdate);

  return element;
}
