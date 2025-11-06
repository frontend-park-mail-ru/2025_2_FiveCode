import ejs from "ejs";
import {
  BlockTextFormat,
  reconstructHtmlFromFormats,
  parseHtmlToTextAndFormats,
} from "../editor/formatter";

export { BlockTextFormat, parseHtmlToTextAndFormats };

export interface Block {
  id: string | number;
  type: "text" | "code" | "image" | "attachment";
  text?: string;
  formats?: BlockTextFormat[];
  url?: string;
  language?: string;
  file_id?: number;
}

export type BlockUpdateData = {
  text?: string;
  formats?: BlockTextFormat[];
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
  handle.innerHTML = "+";

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

  container.appendChild(handle);
  container.appendChild(element);
  container.appendChild(actions);

  return container;
}

function renderTextBlock(
  block: Block,
  updateCallback: UpdateCallback
): HTMLElement {
  const template = `<div class="block block--text" data-block-id="${block.id}" contenteditable="true" spellcheck="false"><%- content %></div>`;
  const htmlContent = reconstructHtmlFromFormats(block.text, block.formats);
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
  const template = `<div class="block block--image"><img src="<%= url %>" alt="image block"></div>`;
  const html = ejs.render(template, {
    url: block.url || "https://via.placeholder.com/800x200.png?text=Image",
  });
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.firstChild as HTMLElement;
}

function renderCodeBlock(
  block: Block,
  updateCallback: UpdateCallback
): HTMLElement {
  const template = `
    <div class="block block--code" data-block-id="${block.id}">
      <div class="code-toolbar">
        <select class="code-language">
          <option value="sql" ${block.language === "sql" ? "selected" : ""}>SQL</option>
          <option value="javascript" ${
            block.language === "javascript" ? "selected" : ""
          }>JavaScript</option>
          <option value="text" ${
            block.language === "text" ? "selected" : ""
          }>Plain Text</option>
        </select>
      </div>
      <div class="code-content" contenteditable="true" spellcheck="false"><%= content %></div>
    </div>
  `;
  const html = ejs.render(template, {
    content: block.text,
    language: block.language,
  });
  const doc = new DOMParser().parseFromString(html, "text/html");
  const element = doc.body.firstChild as HTMLElement;
  const contentElement = element.querySelector(".code-content") as HTMLElement;
  const languageSelect = element.querySelector(
    ".code-language"
  ) as HTMLSelectElement;

  const onUpdate = () => {
    updateCallback(block.id, {
      text: contentElement.innerText,
      language: languageSelect.value,
    });
  };

  contentElement.addEventListener("input", onUpdate);
  languageSelect.addEventListener("change", onUpdate);

  return element;
}
