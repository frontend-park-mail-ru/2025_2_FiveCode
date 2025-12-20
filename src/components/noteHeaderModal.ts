import { apiClient } from "../api/apiClient";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "./notification";

interface HeaderSettings {
  header_id?: number;
  header_image_url?: string;
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
      <h2>Выбор обоев для заметки</h2>
      <button class="modal-close-btn">×</button>
    </div>

    <div class="header-modal-body">
      <div class="header-modal-section">
        <h3>Выбрать обои</h3>
        <div class="color-picker-grid" id="headerTemplates">

        </div>
      </div>
    </div>
  `;

  container.appendChild(modalContent);

  const templatesContainer = modalContent.querySelector(
    "#headerTemplates"
  ) as HTMLElement;

  const closeBtn = modalContent.querySelector(".modal-close-btn") as HTMLButtonElement;

  try {
    const headers = await apiClient.getNoteHeaders();
    console.log("Available headers:", headers);
    headers.forEach((header: { id: number; name: string; url: string }) => {
      const item = document.createElement("div");
      item.className = "header-template";
      item.style.backgroundImage = `url(${header.url})`;
      item.title = header.name;
      item.style.backgroundSize = "cover";
      item.style.backgroundPosition = "center";
      item.className = "color-option";
      if (header.id === currentHeaderSettings?.header_id) {
        item.classList.add("active");
      }

      item.addEventListener("click", async () => {
        try {
          await apiClient.updateNoteHeader(noteId, { header_id: header.id });

          document.dispatchEvent(
            new CustomEvent("headerUpdated", {
              detail: {
                noteId,
                header_type: "image",
                header_image_url: header.url,
              },
            })
          );

          showNotification("Обои обновлены", "success");
          container.remove();
        } catch (err) {
          handleError(err, "Ошибка при обновлении обоев");
        }
      });

      templatesContainer.appendChild(item);
    });
  } catch (err) {
    handleError(err, "Не удалось загрузить обои");
  }

  const closeModal = () => container.remove();

  closeBtn.addEventListener("click", closeModal);

  container.addEventListener("click", (e) => {
    if (e.target === container) closeModal();
  });

  return container;
}
