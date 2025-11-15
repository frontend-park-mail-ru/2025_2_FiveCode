import ejs from "ejs";
import { apiClient, Ticket } from "../../api/apiClient";
import { createImageModal } from "../../components/imageModal";

const ICONS = {
  back: new URL("../../static/svg/icon_back.svg", import.meta.url).href,
  close: new URL("../../static/svg/icon_close.svg", import.meta.url).href,
};

export function renderCreateTicketForm(page: HTMLElement, user: any, nav: any) {
  const template = `
        <div class="tech-support">
            <div class="tech-support-header">
                <% if (user) { %><button class="back-to-menu-button" id="back-to-menu-btn"><img src="<%= back %>"></button><% } %>
                <h2>Создать обращение</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tech-support-content">
                <form id="tech-support-form" novalidate>
                    <div class="form-group"><p>Имя</p><input type="text" id="support-name" value="<%= user?.username || '' %>" placeholder="Ваше имя" <%= user ? 'readonly' : '' %> /><span class="error-message" id="supportNameError">&nbsp;</span></div>
                    <div class="form-group"><p>Ваша почта</p><input type="email" id="support-email" value="<%= user?.email || '' %>" placeholder="Ваша почта" <%= user ? 'readonly' : '' %> /><span class="error-message" id="supportEmailError">&nbsp;</span></div>
                    <div class="form-group"><p>Категория</p><div class="select-wrapper"><select id="support-category">
                        <option value="bug">Сообщение о баге</option>
                        <option value="suggestion">Предложение по улучшению</option>
                        <option value="complaint">Продуктовая жалоба</option>
                        <option value="other">Другое</option>
                    </select></div></div>
                    <div class="form-group"><p>Тема</p><input type="text" id="support-title" placeholder="Кратко опишите проблему" /><span class="error-message" id="supportTitleError">&nbsp;</span></div>
                    <div class="form-group"><p>Описание</p><textarea id="support-description" class="messageContent" placeholder="Опишите вашу проблему..." rows="6"></textarea><span class="error-message" id="supportDescriptionError">&nbsp;</span></div>
                    <div class="file-attachment-section"><button type="button" class="btn-attach" id="attach-file-btn">Прикрепить файл</button><div id="file-attachment-status">Файл (необязательно)</div></div>
                    <div class="form-status-message" id="formStatusMessage"></div>
                    <div class="send-form-btn"><button type="submit" class="submit-button" id="submitButton">Отправить</button></div>
                </form>
            </div>
        </div>
    `;
  let attachedFileId: number | null = null;
  page.innerHTML = ejs.render(template, { user, ...ICONS });

  document
    .getElementById("close-iframe-btn")
    ?.addEventListener("click", nav.close);
  const backButton = document.getElementById("back-to-menu-btn");
  if (backButton) {
    backButton.addEventListener(
      "click",
      user.is_admin ? nav.toAdminMenu : nav.toUserMenu
    );
  }

  const form = document.getElementById("tech-support-form") as HTMLFormElement;
  const submitButton = document.getElementById(
    "submitButton"
  ) as HTMLButtonElement;
  const formStatusMessageEl = document.getElementById(
    "formStatusMessage"
  ) as HTMLDivElement;
  const nameErrorEl = document.getElementById(
    "supportNameError"
  ) as HTMLSpanElement;
  const emailErrorEl = document.getElementById(
    "supportEmailError"
  ) as HTMLSpanElement;
  const titleErrorEl = document.getElementById(
    "supportTitleError"
  ) as HTMLSpanElement;
  const descriptionErrorEl = document.getElementById(
    "supportDescriptionError"
  ) as HTMLSpanElement;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    [nameErrorEl, emailErrorEl, titleErrorEl, descriptionErrorEl].forEach(
      (el) => {
        el.textContent = "\u00A0";
        el.classList.remove("error-message--visible");
      }
    );
    formStatusMessageEl.innerHTML = "";
    formStatusMessageEl.className = "form-status-message";

    const fullNameInput = document.getElementById(
      "support-name"
    ) as HTMLInputElement;
    const emailInput = document.getElementById(
      "support-email"
    ) as HTMLInputElement;
    const titleInput = document.getElementById(
      "support-title"
    ) as HTMLInputElement;
    const descriptionInput = document.getElementById(
      "support-description"
    ) as HTMLTextAreaElement;

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();

    let hasError = false;
    if (!user) {
      if (!fullName) {
        nameErrorEl.textContent = "Имя не может быть пустым";
        nameErrorEl.classList.add("error-message--visible");
        hasError = true;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailErrorEl.textContent = "Введите корректный email";
        emailErrorEl.classList.add("error-message--visible");
        hasError = true;
      }
    }

    if (!title) {
      titleErrorEl.textContent = "Тема обращения не может быть пустой";
      titleErrorEl.classList.add("error-message--visible");
      hasError = true;
    }
    if (!description) {
      descriptionErrorEl.textContent = "Текст обращения не может быть пустым";
      descriptionErrorEl.classList.add("error-message--visible");
      hasError = true;
    }
    if (hasError) {
      return;
    }

    const ticketData: Ticket = {
      full_name: fullName,
      email: email,
      category: (
        document.getElementById("support-category") as HTMLSelectElement
      ).value,
      title: title,
      description: description,
      file_id: attachedFileId ?? null,
    };

    submitButton.disabled = true;
    submitButton.textContent = "Отправка...";

    try {
      await apiClient.createTicket(ticketData);
      formStatusMessageEl.textContent = "Ваше обращение успешно отправлено!";
      formStatusMessageEl.classList.add("success");
      setTimeout(() => {
        form.reset();
        clearAttachment();
        if (user) {
          user.is_admin ? nav.toAdminMenu() : nav.toUserMenu();
        } else {
          nav.close();
        }
      }, 1500);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      formStatusMessageEl.textContent =
        "Ошибка при отправке. Попробуйте снова.";
      formStatusMessageEl.classList.add("error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Отправить";
    }
  });

  const attachFileButton = document.getElementById(
    "attach-file-btn"
  ) as HTMLButtonElement;
  const fileStatusDiv = document.getElementById(
    "file-attachment-status"
  ) as HTMLDivElement;

  const clearAttachment = () => {
    attachedFileId = null;
    fileStatusDiv.innerHTML = `Файл (необязательно)`;
  };

  attachFileButton.addEventListener("click", async () => {
    const uploadedFile = await createImageModal();
    if (uploadedFile) {
      attachedFileId = uploadedFile.id;
      const fileName = uploadedFile.url.split("/").pop() || "файл";
      fileStatusDiv.innerHTML = `Прикреплен: ${fileName} <button type="button" class="remove-file-btn" title="Удалить файл">✕</button>`;
      fileStatusDiv
        .querySelector(".remove-file-btn")
        ?.addEventListener("click", clearAttachment);
    }
  });
}
