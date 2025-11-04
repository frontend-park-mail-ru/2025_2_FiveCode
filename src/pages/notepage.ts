import { Sidebar } from '../components/sidebar';
import { loadUser } from '../utils/session';
import { Block, CodeBlock } from '../components/block';
import { createEditorManager } from '../editor/editorManager';
import router from '../router';

const ICONS = {
  trash: new URL('../static/svg/icon_delete.svg', import.meta.url).href,
  star: new URL('../static/svg/icon_favorite.svg', import.meta.url).href,
};

const MOCK_NOTE_DATA: Block[] = [
  { id: '1', type: 'text', content: 'Выделите часть этого текста и нажмите на кнопку <code>&lt;/&gt;</code>, чтобы превратить его в блок кода.' },
  { id: '2', type: 'text', content: 'Основной текст заметкии блочная структура' },
  { 
    id: '3', 
    type: 'code', 
    content: `CREATE TABLE IF NOT EXISTS user (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email           TEXT    NOT NULL UNIQUE CHECK (LENGTH(email) <= 40),
  password_hash   TEXT    NOT NULL,
  username        TEXT    NOT NULL UNIQUE CHECK (LENGTH(username) >= 3),
  avatar_file_id  INTEGER REFERENCES file (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);`,
    language: 'sql' 
  } as CodeBlock,
  { id: '4', type: 'text', content: 'Еще текст' }
];

export async function renderNoteEditor(app: HTMLElement, noteId: number | string): Promise<void> {
  app.innerHTML = '';
  const pageEl = document.createElement('div');
  pageEl.className = 'page page--note-editor';

  const user = loadUser();
  pageEl.appendChild(Sidebar({ user, subdirs: [] }));

  const mainEl = document.createElement('div');
  mainEl.className = 'note-editor__main';
  mainEl.innerHTML = `
    <div class="note-editor__header">
      <button class="note-editor__header-btn" id="delete-note-btn"><img src="${ICONS.trash}" alt="Delete"></button>
      <button class="note-editor__header-btn" id="favorite-note-btn"><img src="${ICONS.star}" alt="Favorite"></button>
    </div>
    <div class="formatting-toolbar">
      <button class="format-btn" data-command="bold">B</button>
      <button class="format-btn" data-command="italic"><i>I</i></button>
      <button class="format-btn" data-command="underline"><u>U</u></button>
      <button class="format-btn" data-command="strikeThrough"><s>S</s></button>
      <button class="format-btn format-btn-code" data-command="convertToCode">&lt;/&gt;</button>
      <div class="format-dropdown" id="font-dropdown">
        <button class="dropdown-toggle">
          <span id="current-font-name">Sans-Serif</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="dropdown-menu">
          <div class="dropdown-item" data-value="Arial">Sans-Serif</div>
          <div class="dropdown-item" data-value="Georgia">Serif</div>
          <div class="dropdown-item" data-value="Courier New">Monospace</div>
        </div>
      </div>
    </div>
    <div class="add-block-menu">
      <div class="menu-item" data-type="text">Текст</div>
      <div class="menu-item" data-type="code">Код</div>
      <div class="menu-item" data-type="image">Изображение</div>
    </div>
    <input class="note-editor__title" placeholder="Заголовок заметки" value="Заголовок" />
    <div class="block-editor"></div>
    <div class="note-editor__buttons">
      <button class="btn save-btn">Сохранить (в консоль)</button>
      <button class="btn btn--secondary cancel-btn">Назад</button>
    </div>
  `;

  pageEl.appendChild(mainEl);
  app.appendChild(pageEl);

  const editorContainer = pageEl.querySelector('.block-editor') as HTMLElement;
  const saveBtn = pageEl.querySelector('.save-btn') as HTMLButtonElement;
  const titleInput = pageEl.querySelector<HTMLInputElement>('.note-editor__title')!;
  const cancelBtn = pageEl.querySelector<HTMLButtonElement>('.cancel-btn')!;
  const toolbar = pageEl.querySelector('.formatting-toolbar') as HTMLElement;
  const addBlockMenu = pageEl.querySelector('.add-block-menu') as HTMLElement;
  const deleteBtn = pageEl.querySelector('#delete-note-btn');
  const favoriteBtn = pageEl.querySelector('#favorite-note-btn');
  
  const editorManager = createEditorManager({
    container: editorContainer,
    toolbar: toolbar,
    addBlockMenu: addBlockMenu,
    initialBlocks: MOCK_NOTE_DATA,
  });

  editorManager.render();

  saveBtn.addEventListener('click', () => {
    const dataToSave = {
      title: titleInput.value,
      blocks: editorManager.getBlocks()
    };
    console.log("--- ДАННЫЕ ДЛЯ СОХРАНЕНИЯ ---");
    console.log(JSON.stringify(dataToSave, null, 2));
    alert('Структура заметки сохранена в консоль (нажмите F12)');
  });

  cancelBtn.addEventListener('click', () => router.navigate('notes'));
  
  deleteBtn?.addEventListener('click', () => {
    console.log('Delete button clicked for noteId:', noteId);
    alert('Заметка будет удалена (функционал в разработке)');
  });

  favoriteBtn?.addEventListener('click', () => {
    console.log('Favorite button clicked for noteId:', noteId);
    alert('Заметка будет добавлена в избранное (функционал в разработке)');
  });
}