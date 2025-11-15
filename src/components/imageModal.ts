import { apiClient, UploadedFile } from "../api/apiClient";

export function createImageModal(): Promise<UploadedFile | null> {
  return new Promise((resolve) => {
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    modalOverlay.innerHTML = `
      <div class="modal-content" tabindex="0">
        <div class="modal-tabs">
          <div class="modal-tab active" data-tab="upload">Загрузить</div>
        </div>
        <div class="modal-body">
          <div class="modal-tab-panel active" data-panel="upload">
            <div class="input-group drop-zone" id="imageDropZone">
              <label for="imageUpload">Выберите файл или перетащите сюда / вставьте из буфера</label>
              <input type="file" id="imageUpload" />
              <div class="drop-hint">Перетащите файл сюда или нажмите Ctrl+V, чтобы вставить</div>
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

    const content = modalOverlay.querySelector(".modal-content") as HTMLElement;
    const confirmBtn = modalOverlay.querySelector(
      "#confirmBtn"
    ) as HTMLButtonElement;
    const cancelBtn = modalOverlay.querySelector(
      "#cancelBtn"
    ) as HTMLButtonElement;
    const fileInput = modalOverlay.querySelector(
      "#imageUpload"
    ) as HTMLInputElement;
    const dropZone = modalOverlay.querySelector(
      "#imageDropZone"
    ) as HTMLElement;

    const close = (value: UploadedFile | null) => {
      document.body.removeChild(modalOverlay);
      resolve(value);
    };

    confirmBtn.addEventListener("click", async () => {
      const file = fileInput.files?.[0];
      if (file) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Загрузка...";
        try {
          const response = await apiClient.uploadFile(file);
          close(response);
        } catch (error) {
          console.error("Не удалось загрузить файл.", error);
          confirmBtn.disabled = false;
          confirmBtn.textContent = "Вставить";
        }
      }
    });

    cancelBtn.addEventListener("click", () => close(null));

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) close(null);
    });

    content.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    const handleFileAndClose = async (file: File | null) => {
      if (!file) return;
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Загрузка...";
      try {
        const response = await apiClient.uploadFile(file);
        close(response);
      } catch (error) {
        console.error("Не удалось загрузить файл.", error);
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Вставить";
      }
    };

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0] ?? null;
      if (file) handleFileAndClose(file);
    });

    if (dropZone) {
      let dragCounter = 0;
      dropZone.addEventListener("dragenter", (ev) => {
        ev.preventDefault();
        dragCounter++;
        dropZone.classList.add("drop-active");
      });
      dropZone.addEventListener("dragover", (ev) => {
        ev.preventDefault();
      });
      dropZone.addEventListener("dragleave", (ev) => {
        ev.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) dropZone.classList.remove("drop-active");
      });
      dropZone.addEventListener("drop", (ev) => {
        ev.preventDefault();
        dragCounter = 0;
        dropZone.classList.remove("drop-active");
        const dt = (ev as DragEvent).dataTransfer;
        const file = dt?.files?.[0] ?? null;
        if (file) handleFileAndClose(file);
      });
    }

    content.addEventListener("paste", (ev) => {
      const clipboardItems = (ev as ClipboardEvent).clipboardData?.items;
      if (!clipboardItems) return;
      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (!item || !item.type) continue;
        const blob = item.getAsFile?.();
        if (blob) {
            ev.preventDefault();
            handleFileAndClose(blob);
            return;
        }
      }
    });
  });
}