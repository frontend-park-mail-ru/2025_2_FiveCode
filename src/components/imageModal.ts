import { apiClient, UploadedFile } from "../api/apiClient";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "./notification";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/bmp",
];
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];

function isValidFile(file: File): boolean {
  if (ALLOWED_MIME_TYPES.includes(file.type)) {
    return true;
  }
  const fileName = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

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
              <input type="file" id="imageUpload" accept="image/png, image/jpeg, image/gif, image/webp, image/bmp" />
              <div class="drop-hint">Поддерживаются: JPG, PNG, GIF, WEBP, BMP.</div>
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

    const handleFileAndClose = async (file: File | null) => {
      if (!file) return;

      if (!isValidFile(file)) {
        showNotification(
          "Недопустимый формат файла. Разрешены только изображения (JPG, PNG, GIF, WEBP, BMP).",
          "error"
        );
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = "Загрузка...";
      try {
        const response = await apiClient.uploadFile(file);
        close(response);
      } catch (error) {
        handleError(error, "Не удалось загрузить файл");
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Вставить";
      }
    };

    confirmBtn.addEventListener("click", () => {
      const file = fileInput.files?.[0] ?? null;
      handleFileAndClose(file);
    });

    cancelBtn.addEventListener("click", () => close(null));

    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) close(null);
    });

    content.addEventListener("click", (e) => {
      e.stopPropagation();
    });

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
