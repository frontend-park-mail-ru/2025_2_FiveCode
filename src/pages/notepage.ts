import { Sidebar } from '../components/sidebar';
import { loadUser } from '../utils/session';
import { Block, CodeBlock } from '../components/block';
import { createEditorManager } from '../editor/editorManager';
import router from '../router';
import { apiClient } from '../api/apiClient';

const ICONS = {
  trash: new URL('../static/svg/icon_delete.svg', import.meta.url).href,
  star: new URL('../static/svg/icon_favorite.svg', import.meta.url).href,
};

export async function renderNoteEditor(app: HTMLElement, noteId: number | string): Promise<void> {
  app.innerHTML = '<div class="page page--note-editor"></div>';
  const pageEl = app.querySelector('.page--note-editor') as HTMLElement;

  const user = loadUser();
  pageEl.appendChild(Sidebar({ user }));

  const mainEl = document.createElement('div');
  mainEl.className = 'note-editor__main';
  mainEl.innerHTML = `
  <div class="note-editor__main">
  <input class="note-editor__title" placeholder="Заголовок заметки" value="<%= title %>" />

  <div id="wysiwyg-root" class="wysiwyg">
    <div class="wysiwyg__toolbar" role="toolbar" aria-label="Editor toolbar">
      <button class="wysiwyg__btn" data-cmd="undo" title="Undo">↶</button>
      <button class="wysiwyg__btn" data-cmd="redo" title="Redo">↷</button>
      <span class="wysiwyg__sep"></span>
      <button class="wysiwyg__btn" data-cmd="bold" title="Bold"><strong>B</strong></button>
      <button class="wysiwyg__btn" data-cmd="italic" title="Italic"><em>I</em></button>
      <button class="wysiwyg__btn" data-cmd="underline" title="Underline"><u>U</u></button>
      <select class="wysiwyg__select" data-action="heading" title="Heading">
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
      </select>
      <button class="wysiwyg__btn" data-cmd="insertUnorderedList" title="Bulleted">•</button>
      <button class="wysiwyg__btn" data-cmd="insertOrderedList" title="Numbered">1.</button>
      <button class="wysiwyg__btn" data-action="link" title="Insert link">URL</button>
      <button class="wysiwyg__btn" data-action="image" title="Insert image">Image</button>
      <span class="wysiwyg__spacer"></span>
      <button class="wysiwyg__btn" data-action="html" title="Toggle HTML view">HTML</button>
    </div>

    <div id="wysiwyg-editor" class="wysiwyg__editor" contenteditable="true" spellcheck="true" aria-label="Визуальный редактор">
      <p><%= content %></p>
    </div>

    <div class="wysiwyg__footer">
      <div class="wysiwyg__status">Готов</div>
      <div class="wysiwyg__actions">
        <button class="wysiwyg__btn" data-action="export">Export</button>
        <button class="wysiwyg__btn" data-action="clear">Clear</button>
      </div>
    </div>

    <div class="wysiwyg__modal" data-modal="prompt" aria-hidden="true">
      <div class="wysiwyg__modal-inner">
        <input class="wysiwyg__input" type="text" placeholder="Введите URL" />
        <div class="wysiwyg__modal-actions">
          <button class="wysiwyg__btn" data-modal-ok>OK</button>
          <button class="wysiwyg__btn" data-modal-cancel>Cancel</button>
        </div>
      </div>
      </div>
    </div>
    <div class="add-block-menu">
      <div class="menu-item" data-type="text">Текст</div>
      <div class="menu-item" data-type="code">Код</div>
      <div class="menu-item" data-type="image">Изображение</div>
    </div>
    <input class="note-editor__title" placeholder="Загрузка..." value="" />
    <div class="block-editor">Загрузка блоков...</div>
    <div class="note-editor__buttons">
      <button class="btn save-btn">Сохранить</button>
      <button class="btn btn--secondary cancel-btn">Назад</button>
    </div>
  `;

  pageEl.appendChild(mainEl);

  const titleInput = mainEl.querySelector<HTMLInputElement>('.note-editor__title')!;
  const editorContainer = mainEl.querySelector('.block-editor') as HTMLElement;
  const saveBtn = mainEl.querySelector('.save-btn') as HTMLButtonElement;
  const cancelBtn = mainEl.querySelector<HTMLButtonElement>('.cancel-btn')!;
  const toolbar = mainEl.querySelector('.formatting-toolbar') as HTMLElement;
  const addBlockMenu = mainEl.querySelector('.add-block-menu') as HTMLElement;
  const deleteBtn = mainEl.querySelector('#delete-note-btn') as HTMLButtonElement;
  const favoriteBtn = mainEl.querySelector('#favorite-note-btn') as HTMLButtonElement;

  let initialBlocks: Block[] = [];
  let initialTitle = 'Новая заметка';
  let isFavorite = false;

  if (String(noteId) !== 'new') {
    try {
      const note = await apiClient.getNote(noteId as number);
      const blocksData = await apiClient.getBlocksForNote(noteId as number);
      initialTitle = note.title;
      isFavorite = note.is_favorite || false;
      const backendBlocks = blocksData?.blocks || [];
      initialBlocks = backendBlocks.map((block: any) => ({
        id: block.id,
        type: block.type,
        content: block.text || '',
        language: block.language || 'text'
      }));

      if (isFavorite) {
        favoriteBtn.classList.add('active');
      }
    } catch (e) {
      alert('Не удалось загрузить заметку.');
      router.navigate('notes');
      return;
    }
  }

  if (initialBlocks.length === 0) {
    initialBlocks.push({
        id: `local-${Date.now()}`,
        type: 'text',
        content: ''
    });
  }

  titleInput.value = initialTitle;
  
  const editorManager = createEditorManager({
    container: editorContainer,
    toolbar: toolbar,
    addBlockMenu: addBlockMenu,
    initialBlocks: initialBlocks,
  });

  editorManager.render();
  
  if (String(noteId) === 'new' && initialBlocks.length > 0 && initialBlocks[0]) {
    editorManager.focusBlock(initialBlocks[0].id);
  }

  saveBtn.addEventListener('click', async () => {
    saveBtn.textContent = 'Сохранение...';
    saveBtn.disabled = true;

    try {
      let currentNoteId: string | number | null = (String(noteId) === 'new') ? null : noteId;
      
      if (!currentNoteId) {
        const newNote = await apiClient.createNote();
        currentNoteId = newNote.id;
        history.replaceState(null, '', `/note/${currentNoteId}`);
        if (currentNoteId){
          noteId = currentNoteId;
        }
      }
      
      if (currentNoteId) {
        await apiClient.updateNote(currentNoteId, { title: titleInput.value });
        
        const currentBlocks = editorManager.getBlocks();
        const updatePromises = currentBlocks.map(block => {
            if (block.id.toString().startsWith('local-')) {
              return apiClient.createBlock(currentNoteId as number, {}).then(newBlock => {
                return apiClient.updateBlock(newBlock.id, { text: block.content, formats: [] });
              });
            } else {
              return apiClient.updateBlock(block.id, { text: block.content, formats: [] });
            }
        });
        
        await Promise.all(updatePromises);
        alert('Сохранено!');
      }

    } catch (err) {
      console.error('Failed to save note:', err);
      alert('Ошибка при сохранении заметки.');
    } finally {
      saveBtn.textContent = 'Сохранить';
      saveBtn.disabled = false;
    }
  });

  cancelBtn.addEventListener('click', () => router.navigate('notes'));

  deleteBtn.addEventListener('click', async () => {
    if (String(noteId) === 'new') {
      router.navigate('notes');
      return;
    }
    if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
      try {
        await apiClient.deleteNote(noteId as number);
        router.navigate('notes');
      } catch (err) {
        console.error('Failed to delete note:', err);
        alert('Не удалось удалить заметку.');
      }
    }
  });

  favoriteBtn.addEventListener('click', async () => {
    if (String(noteId) === 'new') {
      alert('Сначала сохраните заметку, чтобы добавить ее в избранное.');
      return;
    }
    isFavorite = !isFavorite;
    favoriteBtn.classList.toggle('active', isFavorite);
    try {
      await apiClient.toggleFavorite(noteId as number, isFavorite);
    } catch (err) {
      console.error('Failed to update favorite status:', err);
      isFavorite = !isFavorite;
      favoriteBtn.classList.toggle('active', isFavorite);
      alert('Не удалось обновить статус избранного.');
    }
  });
}