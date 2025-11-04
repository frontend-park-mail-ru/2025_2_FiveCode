import ejs from 'ejs';
import { Sidebar } from '../components/sidebar';
import { apiClient } from '../api/apiClient';
import router from '../router';
import { loadUser } from '../utils/session';
import { initWysiwyg } from '../components/wysiwyg';

interface Note {
  id: number;
  title: string;
  content: string;
}

interface NotePageProps {
  title: string;
  content: string;
  notes: Note[];
}

export function renderNotePage({ title, content, notes }: NotePageProps): string {
  const notePageTemplate = `
  <div class="main-content">
    <h1 class="note-title"><%= title %></h1>
    <textarea class="note-editor" placeholder="Основной текст заметки"><%= content %></textarea>
  </div>
  `;
  return ejs.render(notePageTemplate, { title, content, notes });
}


export async function renderNoteEditor(app: HTMLElement, noteId: number | string): Promise<void> {
  app.innerHTML = '';
  const pageEl = document.createElement('div');
  pageEl.className = 'page page--note-editor';

  const user = loadUser();
  pageEl.appendChild(Sidebar({ user, subdirs: [] }));

  const mainTemplate = `
    <div class="note-editor__main">
      <input class="note-editor__title" placeholder="Заголовок заметки" value="<%= title %>" />

      <div id="wysiwyg-root" class="wysiwyg-root">
        <div class="wysiwyg-toolbar" role="toolbar" aria-label="Editor toolbar">
          <button class="w-btn" data-cmd="undo" title="Undo">↶</button>
          <button class="w-btn" data-cmd="redo" title="Redo">↷</button>
          <span class="w-sep"></span>
          <button class="w-btn" data-cmd="bold" title="Bold"><strong>B</strong></button>
          <button class="w-btn" data-cmd="italic" title="Italic"><em>I</em></button>
          <button class="w-btn" data-cmd="underline" title="Underline"><u>U</u></button>
          <select class="w-select" data-action="heading" title="Heading">
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
          </select>
          <button class="w-btn" data-cmd="insertUnorderedList" title="Bulleted">•</button>
          <button class="w-btn" data-cmd="insertOrderedList" title="Numbered">1.</button>
          <button class="w-btn" data-action="link" title="Insert link">URL</button>
          <button class="w-btn" data-action="image" title="Insert image">Image</button>
          <span class="w-spacer"></span>
          <button class="w-btn" data-action="html" title="Toggle HTML view">HTML</button>
        </div>

        <div id="wysiwyg-editor" class="w-editor" contenteditable="true" spellcheck="true" aria-label="Визуальный редактор">
          <p><%= content %></p>
        </div>

        <div class="w-footer">
          <div class="w-status">Готов</div>
          <div class="w-actions">
            <button class="w-btn" data-action="export">Export</button>
            <button class="w-btn" data-action="clear">Clear</button>
          </div>
        </div>

        <div class="w-modal" data-modal="prompt" aria-hidden="true">
          <div class="w-modal-inner">
            <input class="w-input" type="text" placeholder="Введите URL" />
            <div class="w-modal-actions">
              <button class="w-btn" data-modal-ok>OK</button>
              <button class="w-btn" data-modal-cancel>Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <div class="note-editor__buttons">
        <button class="btn save-btn">Сохранить</button>
        <button class="btn btn--secondary cancel-btn">Назад</button>
      </div>
    </div>
  `;

  const mainHtml = ejs.render(mainTemplate, { title: '', content: '' });
  const mainWrapper = document.createElement('div');
  mainWrapper.innerHTML = mainHtml;
  const mainEl = mainWrapper.firstElementChild as HTMLElement;
  pageEl.appendChild(mainEl);
  app.appendChild(pageEl);

  const titleInput = pageEl.querySelector<HTMLInputElement>('.note-editor__title')!;
  const saveBtn = pageEl.querySelector<HTMLButtonElement>('.save-btn')!;
  const cancelBtn = pageEl.querySelector<HTMLButtonElement>('.cancel-btn')!;

  // загружает заметку. загрузка не работает, создает новую.
  let note: any = { id: null, title: '', content: '' };
  if (String(noteId) !== 'new') {
    try {
      note = await apiClient.getNote(noteId as number);
      if (note) titleInput.value = note.title || '';
    } catch (err) {
      console.error('Failed to load note', err);
    }
  }

  // инициализация WYSIWYG редактора
  const wysiwygRoot = pageEl.querySelector('#wysiwyg-root') as HTMLElement;
  const editorApi = initWysiwyg(wysiwygRoot);
  const initialContent = note.content || note.text || '';
  editorApi.setHTML(initialContent || '<p></p>');

  
  saveBtn.addEventListener('click', async () => {
    const data = { title: titleInput.value, content: editorApi.getHTML() };
    try {
      if (String(noteId) === 'new') { // сейчас - не сохраняется
        await apiClient.createNote(data);
      } else {
        await apiClient.updateNote(noteId as number, data);
      }
      router.navigate('notes');
    } catch (err) {
      console.error('Failed to save note', err);
      alert('Не удалось сохранить заметку'); // нужно на нормальный вывод ошибки сделать
    }
  });

  cancelBtn.addEventListener('click', () => router.navigate('notes'));
}

