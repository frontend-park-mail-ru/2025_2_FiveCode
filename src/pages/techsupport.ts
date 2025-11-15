import "../static/css/techsupport.css";
import ejs from "ejs";
import { apiClient, Ticket } from "../api/apiClient";
import { loadUser } from "../utils/session";
import { createImageModal } from "../components/imageModal";

const ICONS = {
    close: new URL("../static/svg/icon_close.svg", import.meta.url).href,
    back: new URL("../static/svg/icon_back.svg", import.meta.url).href,
};

interface SupportFormErrors {
  title?: string;
  description?: string;
}

function validateSupportForm(form: HTMLFormElement): SupportFormErrors {
  const errors: SupportFormErrors = {};
  const title = (
    form.querySelector<HTMLInputElement>("#support-title")?.value ?? ""
  ).trim();
  const description = (
    form.querySelector<HTMLTextAreaElement>("#support-description")?.value ?? ""
  ).trim();

  if (!title) {
    errors.title = "Тема обращения не может быть пустой";
  }
  if (!description) {
    errors.description = "Текст обращения не может быть пустым";
  }
  return errors;
}

export async function renderTechSupportPage(): Promise<void> {
    const app = document.getElementById("app")!;
    app.innerHTML = '';
    
    const page = document.createElement("div");
    page.className = "page";

    let attachedFileId: number | null = null;


    const mainMenuTemplate = `
        <div class="tech-support-menu">
            <h2>Техническая поддержка</h2>
            <div class="menu-options">
                <button id="view-tickets" class="menu-button">Просмотреть все обращения</button>
                <button id="create-ticket" class="menu-button">Создать новое обращение</button>
            </div>
        </div>
    `

  const techSupportTemplate = `
    <div class="tech-support">
        <div class="tech-support-header">
            <h2>Создать обращение</h2>
            <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
        </div>

        <div class="tech-support-content">
            <form id="tech-support-form" novalidate>
                <div class="form-group">
                    <p>Имя</p>
                    <input type="text" id="support-name" value="<%= user?.username || user?.email?.split('@')[0] || '' %>" placeholder="Ваше имя" />
                </div>
                <div class="form-group">
                    <p>Ваша почта</p>
                    <input type="email" id="support-email" value="<%= user?.email || '' %>" readonly />
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
                    <button type="button" class="cancel-button" id="cancelButton">Отменить</button>
                    <button type="submit" class="submit-button" id="submitButton">Отправить</button>
                </div>
            </form>
        </div>
    </div>
    `;

    const ticketsListTemplate = `
        <div class="tickets-list">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="menu-btn"><img src="<%= back %>"></button>
                <h2>Список обращений</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tickets-content">
                <% if (tickets.length === 0) { %>
                    <p>Нет обращений.</p>
                <% } else { %>
                    <ul>
                        <% tickets.forEach(ticket => { %>
                            <li>
                                <h3><%= ticket.title %></h3>
                                <p><%= ticket.description %></p>
                                <p><strong>Категория:</strong> <%= ticket.category %></p>
                                <p><strong>Статус:</strong> <%= ticket.status || 'Новый' %></p>
                            </li>
                        <% }); %>
                    </ul>
                <% } %>
            </div>
        </div>
    `;



    
    const user = loadUser();
    page.innerHTML = ejs.render(mainMenuTemplate);
    app.appendChild(page);
    document.getElementById("view-tickets")?.addEventListener("click", async () => {
        try {
            const tickets = await apiClient.getMyTickets();
            page.innerHTML = ejs.render(ticketsListTemplate, { tickets, back: ICONS.back, close: ICONS.close });
            setupTicketsListHandlers();
        } catch (error) {
            console.error("Failed to load tickets:", error);
            alert("Не удалось загрузить список обращений.");
        }
    });

    document.getElementById("create-ticket")?.addEventListener("click", () => {
        page.innerHTML = ejs.render(techSupportTemplate, { user, close: ICONS.close, back: ICONS.back });
        setupFormHandlers();
    });

    function setupTicketsListHandlers() {
        const closeIframe = () => {
            window.parent.postMessage('close-support-iframe', '*');
        };
        const backToMenu = () => {
            page.innerHTML = ejs.render(mainMenuTemplate);
            document.getElementById("view-tickets")?.addEventListener("click", async () => {
                try {
                    const tickets = await apiClient.getMyTickets();
                    page.innerHTML = ejs.render(ticketsListTemplate, { tickets, back: ICONS.back, close: ICONS.close });
                    setupTicketsListHandlers();
                } catch (error) {
                    console.error("Failed to load tickets:", error);
                    alert("Не удалось загрузить список обращений.");
                }
            });
            document.getElementById("create-ticket")?.addEventListener("click", () => {
                page.innerHTML = ejs.render(techSupportTemplate, { user, back: ICONS.back, close: ICONS.close });
                setupFormHandlers();
            });
        };
        document.getElementById("close-iframe-btn")?.addEventListener("click", closeIframe);
        document.getElementById("menu-btn")?.addEventListener("click", backToMenu);
    }

    function setupFormHandlers() {
        const closeIframe = () => {
            window.parent.postMessage('close-support-iframe', '*');
        };
        const backToMenu = () => {
            page.innerHTML = ejs.render(mainMenuTemplate);
            document.getElementById("view-tickets")?.addEventListener("click", async () => {
                try {
                    const tickets = await apiClient.getMyTickets();
                    page.innerHTML = ejs.render(ticketsListTemplate, { tickets, back: ICONS.back, close: ICONS.close });
                    setupTicketsListHandlers();
                } catch (error) {
                    console.error("Failed to load tickets:", error);
                    alert("Не удалось загрузить список обращений.");
                }
            });
            document.getElementById("create-ticket")?.addEventListener("click", () => {
                page.innerHTML = ejs.render(techSupportTemplate, { user, back: ICONS.back, close: ICONS.close });
                setupFormHandlers();
            });
        };
        const form = document.getElementById("tech-support-form") as HTMLFormElement;
        const submitButton = document.getElementById("submitButton") as HTMLButtonElement;
        const attachFileButton = document.getElementById("attach-file-btn") as HTMLButtonElement;
        const fileStatusDiv = document.getElementById("file-attachment-status") as HTMLDivElement;
        const titleErrorEl = document.getElementById("supportTitleError") as HTMLSpanElement;
        const descriptionErrorEl = document.getElementById("supportDescriptionError") as HTMLSpanElement;
        const formStatusMessageEl = document.getElementById("formStatusMessage") as HTMLDivElement;
        const errorSpans = [titleErrorEl, descriptionErrorEl];


        document.getElementById("close-iframe-btn")?.addEventListener("click", closeIframe);
        document.getElementById("cancelButton")?.addEventListener("click", closeIframe);
        document.getElementById("menu-btn")?.addEventListener("click", backToMenu);

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
            
            errorSpans.forEach((span) => {
            span.textContent = "\u00A0";
            span.classList.remove("error-message--visible");
            });
            formStatusMessageEl.innerHTML = "";
            formStatusMessageEl.className = "form-status-message";


            const fullNameInput = document.getElementById("support-name") as HTMLInputElement;
            const emailInput = document.getElementById("support-email") as HTMLInputElement;
            const categoryInput = document.getElementById("support-category") as HTMLSelectElement;
            const titleInput = document.getElementById("support-title") as HTMLInputElement;
            const descriptionInput = document.getElementById("support-description") as HTMLTextAreaElement;

              const ticketData: Ticket = {
                full_name: fullNameInput.value,
                email: emailInput.value,
                category: categoryInput.value,
                title: titleInput.value,
                description: descriptionInput.value,
                file_id: attachedFileId !== null ? attachedFileId : 1,
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
                    closeIframe();
                }, 2000);
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
    }
}
