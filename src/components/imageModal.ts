import { apiClient, UploadedFile } from "../api/apiClient";

export function createImageModal(): Promise<UploadedFile | null> {
  return new Promise((resolve) => {
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "modal-overlay";

    modalOverlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-tabs">
          <div class="modal-tab active" data-tab="upload">Загрузить</div>
        </div>
        <div class="modal-body">
          <div class="modal-tab-panel active" data-panel="upload">
            <div class="input-group">
              <label for="imageUpload">Выберите файл</label>
              <input type="file" id="imageUpload" accept="image/png, image/jpeg, image/gif" />
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
  });
}
