import "../static/css/techsupport.css";
import ejs from "ejs";
import { apiClient, Ticket, StatisticForCategory } from "../api/apiClient";
import { loadUser } from "../utils/session";
import { createImageModal } from "../components/imageModal";
import { renderChatPage } from "./chat";

const ICONS = {
  close: new URL("../static/svg/icon_close.svg", import.meta.url).href,
  back: new URL("../static/svg/icon_back.svg", import.meta.url).href,
};

export async function renderTechSupportPage(): Promise<void> {
  const app = document.getElementById("app")!;
  app.innerHTML = "";

  const page = document.createElement("div");
  page.className = "page";
  app.appendChild(page);

  const user = loadUser();

  const closeIframe = () => {
    window.parent.postMessage("close-support-iframe", "*");
  };

  const userMenuTemplate = `
        <div class="tech-support-menu">
            <h2>Техническая поддержка</h2>
            <div class="menu-options">
                <button id="view-tickets-btn" class="menu-button">Просмотреть мои обращения</button>
                <button id="create-ticket-btn" class="menu-button">Создать новое обращение</button>
            </div>
        </div>
    `;

  const adminMenuTemplate = `
        <div class="tech-support-menu">
            <h2>Панель администратора</h2>
            <div class="menu-options">
                <button id="view-statistics-btn" class="menu-button">Статистика</button>
                <button id="view-all-tickets-btn" class="menu-button">Просмотреть все обращения</button>
            </div>
             <button class="close-button" id="close-iframe-btn" style="position: absolute; top: 20px; right: 20px;"><img src="<%= close %>"></button>
        </div>
    `;

  const createTicketTemplate = `
        <div class="tech-support">
            <div class="tech-support-header">
                <% if (user) { %>
                <button class="back-to-menu-button" id="back-to-menu-btn"><img src="<%= back %>"></button>
                <% } %>
                <h2>Создать обращение</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tech-support-content">
                <form id="tech-support-form" novalidate>
                    <div class="form-group">
                        <p>Имя</p>
                        <input type="text" id="support-name" value="<%= user?.username || '' %>" placeholder="Ваше имя" <%= user ? 'readonly' : '' %> />
                        <span class="error-message" id="supportNameError">&nbsp;</span>
                    </div>
                    <div class="form-group">
                        <p>Ваша почта</p>
                        <input type="email" id="support-email" value="<%= user?.email || '' %>" placeholder="Ваша почта" <%= user ? 'readonly' : '' %> />
                         <span class="error-message" id="supportEmailError">&nbsp;</span>
                    </div>
                    <div class="form-group">
                        <p>Категория</p>
                        <div class="select-wrapper">
                            <select id="support-category">
                                <option value="bug">Сообщение о баге</option>
                                <option value="suggestion">Предложение по улучшению</option>
                                <option value="complaint">Продуктовая жалоба</option>
                                <option value="other">Другое</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <p>Тема обращения</p>
                        <input type="text" id="support-title" placeholder="Кратко опишите проблему" />
                        <span class="error-message" id="supportTitleError">&nbsp;</span>
                    </div>
                    <div class="form-group">
                        <p>Текст обращения</p>
                        <textarea id="support-description" class="messageContent" placeholder="Опишите вашу проблему здесь..." rows="6"></textarea>
                        <span class="error-message" id="supportDescriptionError">&nbsp;</span>
                    </div>
                    <div class="file-attachment-section">
                        <button type="button" class="btn-attach" id="attach-file-btn">Прикрепить файл</button>
                        <div id="file-attachment-status">Файл (необязательно)</div>
                    </div>
                    <div class="form-status-message" id="formStatusMessage"></div>
                    <div class="send-form-btn">
                        <button type="submit" class="submit-button" id="submitButton">Отправить</button>
                    </div>
                </form>
            </div>
        </div>
    `;

  const userTicketsListTemplate = `
        <div class="tickets-list">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="back-to-menu-btn"><img src="<%= back %>"></button>
                <h2>Мои обращения</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tickets-content">
                <% if (tickets.length === 0) { %>
                    <p>Нет обращений.</p>
                <% } else { %>
                    <ul class="ticket-title-list">
                        <% tickets.forEach(ticket => { %>
                            <li class="ticket-item">
                                <a href="#" data-ticket-id="<%= ticket.id %>">
                                    <div class="ticket-item-main">
                                        <span class="ticket-item-title"><%= ticket.title %></span>
                                        <span class="ticket-item-date"><%= new Date(ticket.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) %></span>
                                    </div>
                                    <div class="ticket-item-status status-<%= ticket.status %>"><%= ticket.status.replace('_', ' ') %></div>
                                </a>
                            </li>
                        <% }); %>
                    </ul>
                <% } %>
            </div>
        </div>
    `;

  const allTicketsListTemplate = `
        <div class="tickets-list">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="back-to-admin-menu-btn"><img src="<%= back %>"></button>
                <h2>Все обращения</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tickets-content">
                <% if (tickets.length === 0) { %>
                    <p>Нет обращений.</p>
                <% } else { %>
                    <ul class="ticket-title-list">
                        <% tickets.forEach(ticket => { %>
                            <li class="ticket-item">
                                <a href="#" data-ticket-id="<%= ticket.id %>">
                                    <div class="ticket-item-main">
                                        <span class="ticket-item-title"><%= ticket.title %></span>
                                        <span class="ticket-item-date"><%= new Date(ticket.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) %></span>
                                    </div>
                                    <div class="ticket-item-user"><%= ticket.email %></div>
                                    <div class="ticket-item-status status-<%= ticket.status %>"><%= ticket.status.replace('_', ' ') %></div>
                                </a>
                            </li>
                        <% }); %>
                    </ul>
                <% } %>
            </div>
        </div>
    `;

  const statisticsTemplate = `
        <div class="statistics-view">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="back-to-admin-menu-btn"><img src="<%= back %>"></button>
                <h2>Статистика</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="statistics-content">
                <table class="statistics-table">
                    <thead>
                        <tr>
                            <th>Категория</th>
                            <th>Всего</th>
                            <th>Открыто</th>
                            <th>В процессе</th>
                            <th>Закрыто</th>
                        </tr>
                    </thead>
                    <tbody>
                        <% statistics.forEach(stat => { %>
                            <tr>
                                <td><%= stat.category === 'total' ? 'Всего' : stat.category %></td>
                                <td><%= stat.total_tickets %></td>
                                <td><%= stat.open_tickets %></td>
                                <td><%= stat.in_progress_tickets %></td>
                                <td><%= stat.closed_tickets %></td>
                            </tr>
                        <% }); %>
                    </tbody>
                </table>
            </div>
        </div>
    `;

  const ticketDetailTemplate = `
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
                        <button type="button" class="go-to-chat-btn" id="go-to-chat-btn" data-ticket-id="<%= ticket.id %>">Перейти к чату</button>
                    </div>
                </form>
            </div>
        </div>
    `;

  const adminTicketDetailTemplate = `
        <div class="tech-support">
            <div class="tech-support-header">
                <button class="back-to-list-button" id="back-to-all-list-btn"><img src="<%= back %>"></button>
                <h2>Обращение #<%= ticket.id %></h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tech-support-content">
                <form id="admin-ticket-detail-form">
                    <div class="form-group readonly">
                        <p>Тема обращения</p>
                        <input type="text" id="ticket-title" value="<%= ticket.title %>" readonly />
                    </div>
                    <div class="form-group readonly">
                        <p>Текст обращения</p>
                        <textarea id="ticket-description" class="messageContent" rows="6" readonly><%= ticket.description %></textarea>
                    </div>
                    <div class="form-group readonly">
                        <p>Пользователь</p>
                        <input type="text" value="<%= ticket.full_name %> (<%= ticket.email %>)" readonly />
                    </div>
                    <div class="form-group readonly">
                        <p>Категория</p>
                        <input type="text" value="<%= ticket.category %>" readonly />
                    </div>
                    <div class="form-group">
                        <p>Статус</p>
                         <div class="select-wrapper">
                            <select id="ticket-status">
                                <option value="open" <%= ticket.status === 'open' ? 'selected' : '' %>>Open</option>
                                <option value="in_progress" <%= ticket.status === 'in_progress' ? 'selected' : '' %>>In Progress</option>
                                <option value="closed" <%= ticket.status === 'closed' ? 'selected' : '' %>>Closed</option>
                            </select>
                        </div>
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
                        <button type="submit" class="submit-button" id="saveTicketButton">Сохранить статус</button>
                    </div>
                </form>
            </div>
        </div>
    `;

  const renderUserMainMenu = () => {
    page.innerHTML = ejs.render(userMenuTemplate);
    document
      .getElementById("view-tickets-btn")
      ?.addEventListener("click", renderUserTicketsList);
    document
      .getElementById("create-ticket-btn")
      ?.addEventListener("click", renderCreateTicketForm);
  };

  const renderAdminMainMenu = () => {
    page.innerHTML = ejs.render(adminMenuTemplate, { close: ICONS.close });
    document
      .getElementById("view-statistics-btn")
      ?.addEventListener("click", renderStatistics);
    document
      .getElementById("view-all-tickets-btn")
      ?.addEventListener("click", renderAllTicketsList);
    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", closeIframe);
  };

  const renderCreateTicketForm = () => {
    let attachedFileId: number | null = null;
    page.innerHTML = ejs.render(createTicketTemplate, {
      user,
      close: ICONS.close,
      back: ICONS.back,
    });

    const form = document.getElementById(
      "tech-support-form"
    ) as HTMLFormElement;
    const submitButton = document.getElementById(
      "submitButton"
    ) as HTMLButtonElement;
    const attachFileButton = document.getElementById(
      "attach-file-btn"
    ) as HTMLButtonElement;
    const fileStatusDiv = document.getElementById(
      "file-attachment-status"
    ) as HTMLDivElement;
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

    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", closeIframe);

    const backButton = document.getElementById("back-to-menu-btn");
    if (backButton) {
      backButton.addEventListener(
        "click",
        user.is_admin ? renderAdminMainMenu : renderUserMainMenu
      );
    }

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
            user.is_admin ? renderAdminMainMenu() : renderUserMainMenu();
          } else {
            closeIframe();
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
  };

  const renderUserTicketsList = async () => {
    try {
      const tickets = await apiClient.getMyTickets();
      page.innerHTML = ejs.render(userTicketsListTemplate, {
        tickets,
        back: ICONS.back,
        close: ICONS.close,
      });

      document
        .getElementById("close-iframe-btn")
        ?.addEventListener("click", closeIframe);
      document
        .getElementById("back-to-menu-btn")
        ?.addEventListener("click", renderUserMainMenu);

      page
        .querySelector(".ticket-title-list")
        ?.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const link = target.closest("a");
          if (link && link.dataset.ticketId) {
            e.preventDefault();
            renderUserTicketDetail(Number(link.dataset.ticketId));
          }
        });
    } catch (error) {
      console.error("Failed to load tickets:", error);
      page.innerHTML = `<p>Не удалось загрузить список обращений. <a href="#" id="back-to-menu-link">Назад</a></p>`;
      document
        .getElementById("back-to-menu-link")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          renderUserMainMenu();
        });
    }
  };

  const renderAllTicketsList = async () => {
    try {
      const tickets = await apiClient.getAllTickets();
      page.innerHTML = ejs.render(allTicketsListTemplate, {
        tickets,
        back: ICONS.back,
        close: ICONS.close,
      });

      document
        .getElementById("close-iframe-btn")
        ?.addEventListener("click", closeIframe);
      document
        .getElementById("back-to-admin-menu-btn")
        ?.addEventListener("click", renderAdminMainMenu);

      page
        .querySelector(".ticket-title-list")
        ?.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const link = target.closest("a");
          if (link && link.dataset.ticketId) {
            e.preventDefault();
            renderAdminTicketDetail(Number(link.dataset.ticketId));
          }
        });
    } catch (error) {
      console.error("Failed to load all tickets:", error);
      page.innerHTML = `<p>Не удалось загрузить список обращений. <a href="#" id="back-to-admin-menu-link">Назад</a></p>`;
      document
        .getElementById("back-to-admin-menu-link")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          renderAdminMainMenu();
        });
    }
  };

  const renderStatistics = async () => {
    try {
      const statsData = await apiClient.getTicketStatistics();
      page.innerHTML = ejs.render(statisticsTemplate, {
        statistics: statsData.statistics,
        back: ICONS.back,
        close: ICONS.close,
      });
      document
        .getElementById("close-iframe-btn")
        ?.addEventListener("click", closeIframe);
      document
        .getElementById("back-to-admin-menu-btn")
        ?.addEventListener("click", renderAdminMainMenu);
    } catch (error) {
      console.error("Failed to load statistics:", error);
      page.innerHTML = `<p>Не удалось загрузить статистику. <a href="#" id="back-to-admin-menu-link">Назад</a></p>`;
      document
        .getElementById("back-to-admin-menu-link")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          renderAdminMainMenu();
        });
    }
  };

  const renderUserTicketDetail = async (ticketId: number) => {
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

      page.innerHTML = ejs.render(ticketDetailTemplate, {
        ticket,
        imageUrl,
        back: ICONS.back,
        close: ICONS.close,
      });

      document
        .getElementById("close-iframe-btn")
        ?.addEventListener("click", closeIframe);
      document
        .getElementById("back-to-list-btn")
        ?.addEventListener("click", renderUserTicketsList);
      document
        .getElementById("go-to-chat-btn")
        ?.addEventListener("click", () => {
          openChatForTicket(ticketId);
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

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = (
          document.getElementById("ticket-title") as HTMLInputElement
        ).value;
        const description = (
          document.getElementById("ticket-description") as HTMLTextAreaElement
        ).value;

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
      page.innerHTML = `<p>Не удалось загрузить обращение. <a href="#" id="back-to-list-link">Назад к списку</a></p>`;
      document
        .getElementById("back-to-list-link")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          renderUserTicketsList();
        });
    }
  };

  const renderAdminTicketDetail = async (ticketId: number) => {
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

      page.innerHTML = ejs.render(adminTicketDetailTemplate, {
        ticket,
        imageUrl,
        back: ICONS.back,
        close: ICONS.close,
      });
      document
        .getElementById("close-iframe-btn")
        ?.addEventListener("click", closeIframe);
      document
        .getElementById("back-to-all-list-btn")
        ?.addEventListener("click", renderAllTicketsList);

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
      console.error(`Failed to load ticket ${ticketId} for admin:`, error);
      page.innerHTML = `<p>Не удалось загрузить обращение. <a href="#" id="back-to-all-list-link">Назад к списку</a></p>`;
      document
        .getElementById("back-to-all-list-link")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          renderAllTicketsList();
        });
    }
  };

  const openChatForTicket = (ticketId: number) => {
    localStorage.setItem("currentTicketId", String(ticketId));
    // window.location.href = `/techsupport/chat?ticketId=${ticketId}`;
      renderChatPage(ticketId);
};

  if (user && user.is_admin) {
    renderAdminMainMenu();
  } else if (user) {
    renderUserMainMenu();
  } else {
    renderCreateTicketForm();
  }
}
