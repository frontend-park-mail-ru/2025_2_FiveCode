import ejs from 'ejs';

export interface Block {
  id: string | number;
  type: 'text' | 'code' | 'image';
  content: string;
}

export interface CodeBlock extends Block {
  type: 'code';
  language: string;
}

export function renderBlock(block: Block, updateCallback: (id: string | number, newContent: string) => void): HTMLElement {
  let element: HTMLElement;
  switch (block.type) {
    case 'code':
      element = renderCodeBlock(block as CodeBlock, updateCallback);
      break;
    case 'image':
      element = renderImageBlock(block);
      break;
    case 'text':
    default:
      element = renderTextBlock(block, updateCallback);
      break;
  }

  const container = document.createElement('div');
  container.className = 'block-container';
  container.dataset.blockId = String(block.id);

  const handle = document.createElement('div');
  handle.className = 'block-handle';
  handle.innerHTML = '+';

  container.appendChild(handle);
  container.appendChild(element);
  
  return container;
}

function renderTextBlock(block: Block, updateCallback: (id: string | number, newContent: string) => void): HTMLElement {
  const template = `<div class="block block--text" data-block-id="${block.id}" contenteditable="true" spellcheck="false"><%- content %></div>`;
  const html = ejs.render(template, { content: block.content });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const element = doc.body.firstChild as HTMLElement;
  
  element.addEventListener('input', () => {
    updateCallback(block.id, element.innerHTML);
  });

  return element;
}

function renderImageBlock(block: Block): HTMLElement {
  const template = `<div class="block block--image"><img src="<%= src %>" alt="image block"></div>`;
  const html = ejs.render(template, { src: block.content || 'https://via.placeholder.com/800x200.png?text=Paste+Image+URL' });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.firstChild as HTMLElement;
}

function renderCodeBlock(block: CodeBlock, updateCallback: (id: string | number, newContent: string) => void): HTMLElement {
  let language = block.language || 'text';
  let codeContent = block.content;

  try {
    const parsed = JSON.parse(block.content);
    if (parsed && parsed.content) {
      language = parsed.language || language;
      codeContent = parsed.content;
    }
  } catch (e) {}

  const template = `
    <div class="block block--code" data-block-id="${block.id}">
      <div class="code-toolbar">
        <select class="code-language">
          <option value="sql" ${language === 'sql' ? 'selected' : ''}>SQL</option>
          <option value="javascript" ${language === 'javascript' ? 'selected' : ''}>JavaScript</option>
          <option value="text" ${language === 'text' ? 'selected' : ''}>Plain Text</option>
        </select>
      </div>
      <div class="code-content" contenteditable="true" spellcheck="false"><%= content %></div>
    </div>
  `;
  const html = ejs.render(template, { content: codeContent, language: language });
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const element = doc.body.firstChild as HTMLElement;
  const contentElement = element.querySelector('.code-content') as HTMLElement;
  const languageSelect = element.querySelector('.code-language') as HTMLSelectElement;

  const onUpdate = () => {
    const data = {
      language: languageSelect.value,
      content: contentElement.innerText
    };
    updateCallback(block.id, JSON.stringify(data));
  };
  
  contentElement.addEventListener('input', onUpdate);
  languageSelect.addEventListener('change', onUpdate);

  return element;
}