import ejs from "ejs";
import { apiClient, Ticket } from "../api/apiClient";
import { loadUser } from "../utils/session";

const ICONS = {
    close: new URL("../static/svg/icon_close.svg", import.meta.url).href,
};

export async function renderTechSupportPage(): Promise<void> {
    const app = document.getElementById("app")!;
    app.innerHTML = '';
    
    const page = document.createElement("div");
    page.className = "page";

    const techSupportTemplate = `
    <div class="tech-support">
        <div class="tech-support-header">
            <h2>Создать обращение</h2>
            <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
        </div>

        <div class="tech-support-content">
            <form id="tech-support-form">
                <div class="name-section">
                    <p>Имя</p>
                    <input type="text" id="support-name" value="<%= user?.username || user?.email?.split('@')[0] || '' %>" placeholder="Ваше имя" required />
                </div>
                <div class="email-section">
                    <p>Ваша почта</p>
                    <input type="email" id="support-email" value="<%= user?.email || '' %>" readonly required />
                </div>
                <div class="category-section" style="margin-bottom: 8px;">
                    <p>Категория</p>
                    <select id="support-category" required style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid var(--primary-300);">
                        <option value="bug">Сообщение о баге</option>
                        <option value="suggestion">Предложение по улучшению</option>
                        <option value="complaint">Продуктовая жалоба</option>
                        <option value="other">Другое</option>
                    </select>
                </div>
                <div class="title-section">
                    <p>Тема обращения</p>
                    <input type="text" id="support-title" placeholder="Кратко опишите проблему" required />
                </div>
                <div class="message-section">
                    <p>Текст обращения</p>
                    <textarea id="support-description" class="messageContent" placeholder="Опишите вашу проблему здесь..." rows="8" required></textarea>
                </div>
                <div class="send-form-btn">
                    <button type="button" class="cancel-button" id="cancelButton">Отменить</button>
                    <button type="submit" class="submit-button" id="submitButton">Отправить</button>
                </div>
            </form>
        </div>
    </div>
    `;
    
    const user = loadUser();
    page.innerHTML = ejs.render(techSupportTemplate, {
        user,
        close: ICONS.close,
    });
    
    app.appendChild(page);

    const closeIframe = () => {
        window.parent.postMessage('close-support-iframe', '*');
    };

    const form = document.getElementById("tech-support-form") as HTMLFormElement;
    const submitButton = document.getElementById("submitButton") as HTMLButtonElement;
    
    document.getElementById("close-iframe-btn")?.addEventListener("click", closeIframe);
    document.getElementById("cancelButton")?.addEventListener("click", closeIframe);

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
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
            file_id: 1
        };

        submitButton.disabled = true;
        submitButton.textContent = "Отправка...";

        try {
            await apiClient.createTicket(ticketData);
            alert("Ваше обращение успешно отправлено!");
            form.reset();
            closeIframe();
        } catch (error) {
            console.error("Failed to create ticket:", error);
            alert("Произошла ошибка при отправке обращения. Попробуйте снова.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Отправить";
        }
    });
}