
type ModalCallback = (value: string | null) => void;

export function initWysiwyg(root: HTMLElement | string) {
  const rootEl = typeof root === 'string' ? document.querySelector(root) as HTMLElement : root as HTMLElement;
  if (!rootEl) throw new Error('WYSIWYG: root element not found');

  const editor = rootEl.querySelector<HTMLElement>('#wysiwyg-editor')!;
  const toolbar = rootEl.querySelector<HTMLElement>('.wysiwyg-toolbar')!;
  const statusEl = rootEl.querySelector<HTMLElement>('.w-status')!;
  const modal = rootEl.querySelector<HTMLElement>('[data-modal="prompt"]')!;
  const modalInput = modal.querySelector<HTMLInputElement>('.w-input')!;

  let htmlMode = false;

  function setStatus(text: string) {
    statusEl.textContent = text;
    setTimeout(() => { statusEl.textContent = 'Готов'; }, 1200);
  }

  function exec(cmd: string, value?: string | null) {
    // @ts-ignore - самая лучшая вещь. Где она была раньше?
    document.execCommand(cmd, false, value ?? null);
    setStatus(cmd + (value ? ` (${value})` : ''));
  }

  toolbar.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest('.w-btn') as HTMLElement | null;
    if (!btn) return;

    const cmd = btn.getAttribute('data-cmd');
    const action = btn.getAttribute('data-action');

    if (action === 'link') {
      openPrompt('Введите URL ссылки', (val) => {
        if (val) exec('createLink', val);
      });
      return;
    }

    if (action === 'image') {
      openPrompt('Введите URL изображения', (val) => {
        if (val) exec('insertImage', val);
      });
      return;
    }

    if (action === 'html') {
      toggleHtmlView();
      return;
    }

    if (action === 'clear') {
      if (confirm('Очистить содержимое?')) editor.innerHTML = '';
      return;
    }
  });

  rootEl.querySelectorAll('.w-select').forEach((sel) => {
    sel.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const action = target.getAttribute('data-action');
      if (action === 'heading') {
        const val = target.value;
        exec('formatBlock', val === 'p' ? '<p>' : `<${val}>`);
      }
    });
  });

  function openPrompt(placeholder: string, cb: ModalCallback) {
    modal.setAttribute('aria-hidden', 'false');
    modalInput.value = '';
    modalInput.placeholder = placeholder;
    modalInput.focus();

    function ok() {
      close();
      cb(modalInput.value || null);
    }
    function cancel() { close(); cb(null); }

    function close() {
      modal.setAttribute('aria-hidden', 'true');
      modalOk.removeEventListener('click', ok);
      modalCancel.removeEventListener('click', cancel);
    }

    const modalOk = modal.querySelector('[data-modal-ok]') as HTMLElement;
    const modalCancel = modal.querySelector('[data-modal-cancel]') as HTMLElement;

    modalOk.addEventListener('click', ok);
    modalCancel.addEventListener('click', cancel);
  }

  function toggleHtmlView() {
    htmlMode = !htmlMode;
    const btn = toolbar.querySelector('[data-action="html"]') as HTMLElement | null;
    if (htmlMode) {
      const ta = document.createElement('textarea');
      ta.className = 'w-editor-source';
      ta.value = editor.innerHTML;
      ta.style.width = '100%';
      ta.style.minHeight = '220px';
      editor.replaceWith(ta);
    } else {
      const ta = rootEl.querySelector<HTMLTextAreaElement>('.w-editor-source')!;
      const div = document.createElement('div');
      div.id = 'wysiwyg-editor';
      div.className = 'w-editor';
      div.contentEditable = 'true';
      div.innerHTML = ta.value;
      ta.replaceWith(div);
    }
    if (btn) btn.classList.toggle('active', htmlMode);
  }

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element && e.target.closest('.wysiwyg-root'))) {
      if (modal.getAttribute('aria-hidden') === 'false') modal.setAttribute('aria-hidden', 'true');
    }
  });

  return {
    getHTML() { return (rootEl.querySelector('#wysiwyg-editor') || editor).innerHTML; },
    setHTML(html: string) { const el = (rootEl.querySelector('#wysiwyg-editor') || editor); el.innerHTML = html; },
  };
}
