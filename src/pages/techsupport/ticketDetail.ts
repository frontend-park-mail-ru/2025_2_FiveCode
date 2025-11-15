import ejs from "ejs";
import { apiClient } from "../../api/apiClient";

const ICONS = {
  back: new URL("../../static/svg/icon_back.svg", import.meta.url).href,
  close: new URL("../../static/svg/icon_close.svg", import.meta.url).href,
};

export async function renderUserTicketDetail(
  page: HTMLElement,
  ticketId: number,
  nav: any
) {
  const template = `
        <div class="tech-support">
            <div class="tech-support-header">
                <button class="back-to-list-button" id="back-to-list-btn"><img src="<%= back %>"></button>
                <h2>Просмотр обращения</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tech-support-content">
                <form id="ticket-detail-form">
                     <div class="form-group">
                        <p>Тема обращения</p>
                        <input type="text" id="ticket-title" value="<%= ticket.title %>" />
                        <span class="error-message" id="ticketTitleError">&nbsp;</span>
                    </div>
                    <div class="form-group">
                        <p>Текст обращения</p>
                        <textarea id="ticket-description" class="messageContent" rows="6"><%= ticket.description %></textarea>
                        <span class="error-message" id="ticketDescriptionError">&nbsp;</span>
                    </div>
                    <div class="form-group readonly">
                        <p>Имя</p>
                        <input type="text" value="<%= ticket.full_name %>" disabled />
                    </div>
                    <div class="form-group readonly">
                        <p>Категория</p>
                        <input type="text" value="<%= ticket.category %>" disabled />
                    </div>
                    <div class="form-group readonly">
                        <p>Статус</p>
                        <input type="text" value="<%= ticket.status.replace('_', ' ') %>" disabled />
                    </div>
                    <% if (imageUrl) { %>
                    <div class="form-group">
                        <p>Прикрепленный файл</p>
                        <div class="ticket-image-attachment">
                            <img src="<%= imageUrl %>" alt="Прикрепленное изображение" />
                        </div>
                    </div>
                    <% } %>
                     <div class="form-status-message" id="formStatusMessage"></div>
                    <div class="send-form-btn">
                        <button type="submit" class="submit-button" id="saveTicketButton">Сохранить</button>
                        
                    </div>
                </form>
            </div>
        </div>
    `;
  try {
    const ticket = await apiClient.getTicketById(ticketId);
    let imageUrl = null;
    if (ticket.file_id) {
      try {
        const fileData = await apiClient.getFile(ticket.file_id);
        imageUrl = fileData.url;
      } catch (fileError) {
        console.error("Failed to fetch attached file:", fileError);
      }
    }

    page.innerHTML = ejs.render(template, { ticket, imageUrl, ...ICONS });
    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", nav.close);
    document
      .getElementById("back-to-list-btn")
      ?.addEventListener("click", nav.toUserTickets);
    document.getElementById("go-to-chat-btn")?.addEventListener("click", () => {
      localStorage.setItem("currentTicketId", String(ticketId));
      window.location.href = `/chat?ticketId=${ticketId}`;
    });

    const form = document.getElementById(
      "ticket-detail-form"
    ) as HTMLFormElement;
    const saveButton = document.getElementById(
      "saveTicketButton"
    ) as HTMLButtonElement;
    const formStatusMessageEl = document.getElementById(
      "formStatusMessage"
    ) as HTMLDivElement;
    const titleErrorEl = document.getElementById(
      "ticketTitleError"
    ) as HTMLSpanElement;
    const descriptionErrorEl = document.getElementById(
      "ticketDescriptionError"
    ) as HTMLSpanElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      titleErrorEl.textContent = "\u00A0";
      titleErrorEl.classList.remove("error-message--visible");
      descriptionErrorEl.textContent = "\u00A0";
      descriptionErrorEl.classList.remove("error-message--visible");

      const title = (
        document.getElementById("ticket-title") as HTMLInputElement
      ).value.trim();
      const description = (
        document.getElementById("ticket-description") as HTMLTextAreaElement
      ).value.trim();

      let hasError = false;
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

      saveButton.disabled = true;
      saveButton.textContent = "Сохранение...";
      formStatusMessageEl.innerHTML = "";
      formStatusMessageEl.className = "form-status-message";

      try {
        await apiClient.updateTicket(ticketId, { title, description });
        formStatusMessageEl.textContent = "Обращение успешно обновлено!";
        formStatusMessageEl.classList.add("success");
      } catch (error) {
        console.error("Failed to update ticket:", error);
        formStatusMessageEl.textContent =
          "Ошибка при сохранении. Попробуйте снова.";
        formStatusMessageEl.classList.add("error");
      } finally {
        setTimeout(() => {
          saveButton.disabled = false;
          saveButton.textContent = "Сохранить";
        }, 1000);
      }
    });
  } catch (error) {
    console.error(`Failed to load ticket ${ticketId}:`, error);
    page.innerHTML = `<p>Не удалось загрузить обращение. <a href="#" id="back-link">Назад к списку</a></p>`;
    document.getElementById("back-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      nav.toUserTickets();
    });
  }
}

export async function renderAdminTicketDetail(
  page: HTMLElement,
  ticketId: number,
  nav: any
) {
  const template = `
        <div class="tech-support">
            <div class="tech-support-header">
                <button class="back-to-list-button" id="back-to-all-list-btn"><img src="<%= back %>"></button>
                <h2>Обращение #<%= ticket.id %></h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tech-support-content">
                <form id="admin-ticket-detail-form">
                    <div class="form-group readonly"><p>Тема</p><input type="text" value="<%= ticket.title %>" readonly /></div>
                    <div class="form-group readonly"><p>Описание</p><textarea rows="6" readonly><%= ticket.description %></textarea></div>
                    <div class="form-group readonly"><p>Пользователь</p><input type="text" value="<%= ticket.full_name %> (<%= ticket.email %>)" readonly /></div>
                    <div class="form-group readonly"><p>Категория</p><input type="text" value="<%= ticket.category %>" readonly /></div>
                    <div class="form-group"><p>Статус</p><div class="select-wrapper"><select id="ticket-status">
                        <option value="open" <%= ticket.status === 'open' ? 'selected' : '' %>>Open</option>
                        <option value="in_progress" <%= ticket.status === 'in_progress' ? 'selected' : '' %>>In Progress</option>
                        <option value="closed" <%= ticket.status === 'closed' ? 'selected' : '' %>>Closed</option>
                    </select></div></div>
                    <% if (imageUrl) { %><div class="form-group"><p>Прикрепленный файл</p><div class="ticket-image-attachment"><img src="<%= imageUrl %>" alt="Прикрепленное изображение" /></div></div><% } %>
                    <div class="form-status-message" id="formStatusMessage"></div>
                    <div class="send-form-btn"><button type="submit" class="submit-button" id="saveTicketButton">Сохранить статус</button></div>
                </form>
            </div>
        </div>
    `;
  try {
    const ticket = await apiClient.getTicketById(ticketId);
    let imageUrl = null;
    if (ticket.file_id) {
      try {
        const fileData = await apiClient.getFile(ticket.file_id);
        imageUrl = fileData.url;
      } catch (fileError) {
        console.error("Failed to fetch attached file:", fileError);
      }
    }
    page.innerHTML = ejs.render(template, { ticket, imageUrl, ...ICONS });
    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", nav.close);
    document
      .getElementById("back-to-all-list-btn")
      ?.addEventListener("click", nav.toAllTickets);

    const form = document.getElementById(
      "admin-ticket-detail-form"
    ) as HTMLFormElement;
    const saveButton = document.getElementById(
      "saveTicketButton"
    ) as HTMLButtonElement;
    const statusSelect = document.getElementById(
      "ticket-status"
    ) as HTMLSelectElement;
    const formStatusMessageEl = document.getElementById(
      "formStatusMessage"
    ) as HTMLDivElement;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newStatus = statusSelect.value;
      saveButton.disabled = true;
      saveButton.textContent = "Сохранение...";
      formStatusMessageEl.innerHTML = "";
      formStatusMessageEl.className = "form-status-message";

      try {
        await apiClient.updateTicketStatus(ticketId, newStatus);
        formStatusMessageEl.textContent = "Статус успешно обновлен!";
        formStatusMessageEl.classList.add("success");
      } catch (error) {
        console.error("Failed to update ticket status:", error);
        formStatusMessageEl.textContent = "Ошибка при сохранении статуса.";
        formStatusMessageEl.classList.add("error");
      } finally {
        setTimeout(() => {
          saveButton.disabled = false;
          saveButton.textContent = "Сохранить статус";
        }, 1000);
      }
    });
  } catch (error) {
    console.error(`Failed to load ticket ${ticketId}:`, error);
    page.innerHTML = `<p>Не удалось загрузить обращение. <a href="#" id="back-link">Назад к списку</a></p>`;
    document.getElementById("back-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      nav.toAllTickets();
    });
  }
}
