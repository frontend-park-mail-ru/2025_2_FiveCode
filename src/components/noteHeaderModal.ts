import { apiClient } from "../api/apiClient";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "./notification";

interface HeaderSettings {
  noteId: number;
  headerType: "color" | "image";
  colorValue?: string;
  imageFileId?: number;
  imageUrl?: string;
}

export async function createNoteHeaderModal(
  noteId: number,
  currentHeaderSettings?: HeaderSettings
): Promise<HTMLElement> {
  const existingModal = document.getElementById("noteHeaderModal");
  if (existingModal) {
    existingModal.remove();
  }

  const container = document.createElement("div");
  container.className = "modal-overlay";
  container.id = "noteHeaderModal";

  const modalContent = document.createElement("div");
  modalContent.className = "header-modal-content";

  modalContent.innerHTML = `
    <div class="header-modal-header">
      <h2>Оформление шапки заметки</h2>
      <button class="modal-close-btn">×</button>
    </div>

    <div class="header-modal-body">
      <div class="header-modal-section">
        <h3>Выбрать цвет</h3>
        <div class="color-picker-grid">
          <div class="color-option" data-color="#45B7D1" style="background-color: #45B7D1;"></div>
          <div class="color-option" data-color="#FF6B6B" style="background-color: #FF6B6B;"></div>
          <div class="color-option" data-color="#4ECDC4" style="background-color: #4ECDC4;"></div>
          <div class="color-option" data-color="#95E1D3" style="background-color: #95E1D3;"></div>
          <div class="color-option" data-color="#FFD93D" style="background-color: #FFD93D;"></div>
          <div class="color-option" data-color="#6BCB77" style="background-color: #6BCB77;"></div>
          <div class="color-option" data-color="#9B59B6" style="background-color: #9B59B6;"></div>
          <div class="color-option" data-color="#3498DB" style="background-color: #3498DB;"></div>
          <div class="color-option" data-color="#E74C3C" style="background-color: #E74C3C;"></div>
          <div class="color-option" data-color="#2C3E50" style="background-color: #2C3E50;"></div>
        </div>
      </div>

      <div class="header-modal-section">
        <h3>Загрузить изображение</h3>
        <label class="file-upload-label">
          <input type="file" id="headerImageInput" accept="image/*" style="display: none;">
          <span class="file-upload-btn">Выбрать изображение</span>
        </label>
        <div id="imagePreviewContainer" class="image-preview-container"></div>
      </div>

      <div class="header-modal-section">
        <h3>Предпросмотр</h3>
        <div class="header-preview" id="headerPreview" style="background-color: #45B7D1; height: 120px; border-radius: 8px;"></div>
      </div>
    </div>

    <div class="header-modal-footer">
      <button class="btn-secondary" id="cancelBtn">Отмена</button>
      <button class="btn-primary" id="saveBtn">Сохранить</button>
    </div>
  `;

  container.appendChild(modalContent);

  // State management
  let selectedColor = currentHeaderSettings?.colorValue || "#45B7D1";
  let selectedImageFileId = currentHeaderSettings?.imageFileId || null;
  let selectedImageUrl = currentHeaderSettings?.imageUrl || null;
  let selectedImageData: ArrayBuffer | null = null;
  let selectedImageName: string | null = null;

  const colorOptions = modalContent.querySelectorAll(".color-option");
  const fileInput = modalContent.querySelector(
    "#headerImageInput"
  ) as HTMLInputElement;
  const imagePreviewContainer = modalContent.querySelector(
    "#imagePreviewContainer"
  ) as HTMLElement;
  const headerPreview = modalContent.querySelector(
    "#headerPreview"
  ) as HTMLElement;
  const saveBtn = modalContent.querySelector("#saveBtn") as HTMLButtonElement;
  const cancelBtn = modalContent.querySelector(
    "#cancelBtn"
  ) as HTMLButtonElement;
  const closeBtn = modalContent.querySelector(
    ".modal-close-btn"
  ) as HTMLButtonElement;

  // Color selection
  colorOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const color = option.getAttribute("data-color");
      if (color) {
        selectedColor = color;
        selectedImageFileId = null;
        selectedImageData = null;

        headerPreview.style.backgroundImage = "none";
        headerPreview.style.backgroundColor = color;

        colorOptions.forEach((opt) => opt.classList.remove("active"));
        option.classList.add("active");

        imagePreviewContainer.innerHTML = "";
      }
    });

    if (option.getAttribute("data-color") === selectedColor) {
      option.classList.add("active");
    }
  });

  // Image upload
  fileInput.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const uploadedFile = await apiClient.uploadFile(file);
      selectedImageFileId = uploadedFile.id;
      selectedImageUrl = uploadedFile.url;
      selectedImageData = null;
      selectedImageName = file.name;

      headerPreview.style.backgroundColor = "transparent";
      headerPreview.style.backgroundImage = `url(${uploadedFile.url})`;
      headerPreview.style.backgroundSize = "cover";
      headerPreview.style.backgroundPosition = "center";

      imagePreviewContainer.innerHTML = `
        <div class="image-preview-item">
          <img src="${uploadedFile.url}" alt="Preview">
          <button class="remove-image-btn" type="button">✕</button>
        </div>
      `;

      const removeBtn = imagePreviewContainer.querySelector(
        ".remove-image-btn"
      ) as HTMLButtonElement;
      removeBtn.addEventListener("click", () => {
        selectedImageFileId = null;
        selectedImageUrl = null;
        imagePreviewContainer.innerHTML = "";
        headerPreview.style.backgroundImage = "none";
        headerPreview.style.backgroundColor = selectedColor;
        fileInput.value = "";
      });

      colorOptions.forEach((opt) => opt.classList.remove("active"));
    } catch (err) {
      handleError(err, "Ошибка при загрузке изображения");
    }
  });

  // Save handler
  saveBtn.addEventListener("click", async () => {
    try {
      const headerType: "color" | "image" = selectedImageFileId ? "image" : "color";
      const headerData: {
        header_type: "color" | "image";
        header_color?: string;
        header_image_file_id?: number;
        header_image_url?: string | null;
      } = {
        header_type: headerType,
        ...(selectedImageFileId && { 
          header_image_file_id: selectedImageFileId,
          header_image_url: selectedImageUrl,
        }),
        ...(!selectedImageFileId && { header_color: selectedColor }),
      };

      await apiClient.updateNoteHeader(noteId, headerData);

      // Store in localStorage as fallback
    //   localStorage.setItem(`note-header-${noteId}`, JSON.stringify(headerData));

      document.dispatchEvent(
        new CustomEvent("headerUpdated", {
          detail: {
            noteId,
            ...headerData,
          },
        })
      );

      showNotification("Шапка заметки обновлена", "success");
      container.remove();
    } catch (err) {
      handleError(err, "Ошибка при сохранении шапки");
    }
  });

  // Close handlers
  const closeModal = () => container.remove();
  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  container.addEventListener("click", (e) => {
    if (e.target === container) closeModal();
  });

  return container;
}
