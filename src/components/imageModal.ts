import { apiClient } from "../api/apiClient";

export function createImageModal(): Promise<string | null> {
  return new Promise((resolve) => {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';

    modalOverlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-tabs">
          <div class="modal-tab active" data-tab="upload">Загрузить</div>
          <div class="modal-tab" data-tab="url">По ссылке</div>
        </div>
        <div class="modal-body">
          <div class="modal-tab-panel active" data-panel="upload">
            <div class="input-group">
              <label for="imageUpload">Выберите файл</label>
              <input type="file" id="imageUpload" accept="image/png, image/jpeg, image/gif" />
            </div>
          </div>
          <div class="modal-tab-panel" data-panel="url">
            <div class="input-group">
              <label for="imageUrl">URL изображения</label>
              <input type="text" id="imageUrl" placeholder="https://example.com/image.png" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn modal-btn-secondary" id="cancelBtn">Отмена</button>
          <button class="modal-btn modal-btn-primary" id="confirmBtn">Вставить</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    const content = modalOverlay.querySelector('.modal-content') as HTMLElement;
    const confirmBtn = modalOverlay.querySelector('#confirmBtn') as HTMLButtonElement;
    const cancelBtn = modalOverlay.querySelector('#cancelBtn') as HTMLButtonElement;
    const urlInput = modalOverlay.querySelector('#imageUrl') as HTMLInputElement;
    const fileInput = modalOverlay.querySelector('#imageUpload') as HTMLInputElement;
    const tabs = modalOverlay.querySelectorAll('.modal-tab');
    const panels = modalOverlay.querySelectorAll('.modal-tab-panel');

    let activeTab = 'upload';
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab;
        if (!tabName) return;

        activeTab = tabName;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        panels.forEach(p => p.classList.remove('active'));
        modalOverlay.querySelector(`[data-panel="${tabName}"]`)?.classList.add('active');
        
        if (tabName === 'url') urlInput.focus();
      });
    });

    const close = (value: string | null) => {
      document.body.removeChild(modalOverlay);
      resolve(value);
    };

    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      if (activeTab === 'url') {
        if (urlInput.value) close(urlInput.value);
      } else {
        const file = fileInput.files?.[0];
        if (file) {
          try {
            const response = await apiClient.uploadImage(file);
            close(response.url);
          } catch (error) {
            alert('Не удалось загрузить файл.');
            console.error(error);
            confirmBtn.disabled = false;
          }
        }
      }
    });

    cancelBtn.addEventListener('click', () => close(null));

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) close(null);
    });
    
    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });
}