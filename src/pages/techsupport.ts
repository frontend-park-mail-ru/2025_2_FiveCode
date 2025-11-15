import ejs from "ejs";
import router from "../router";
import {apiClient} from "../api/apiClient";
import {loadUser} from "../utils/session";


const ICONS = {
    close: new URL("../static/svg/icon_close.svg", import.meta.url).href,
};

export async function renderTechSupportPage(): Promise<void> {
    const page = document.createElement("div");
    page.className = "page page--layout";
    const mainEl = document.getElementById("main-content");
    if (!mainEl) {
        console.error("Main content element not found");
        return;
    }
    const techSupportTemplate = `
    <div class="tech-support">
        <div class="tech-support-header">
            <h2>Создать обращение </h2>
            <button class="close-button"><img src="<%= close %>"></button>
        </div>

        <div class="tech-support-content">
            <div class="name-section">
                <p>Имя</p>
                <input type="text" value="<%= user?.username || user?.email?.split('@')[0] || 'Имя' %>" placeholder="Имя" />
            </div>
            <div class="email-section">
                <p>Ваша почта</p>
                <input type="email" value="<%= user?.email %>" readonly />
            </div>
            <div class="message-section">
                <p>Текст обращения</p>
                <textarea class="messageContent" placeholder="Опишите вашу проблему здесь..." rows="10"></textarea>
            </div>
            <div class="send-form-btn">
                <button class="cancel-button" id="cancelButton">Отменить</button>
                <button class="submit-button" id="submitButton">Отправить</button>
            </div>
        </div>
    </div>
    `;
    mainEl.className = "page__main";
    const sidebar = document.querySelector('.sidebar') as HTMLElement;
    const techsupportWrapper = document.querySelector('.tech-support-wrapper') as HTMLElement;
    const layoutPage = document.querySelector('.page--layout') as HTMLElement;
    const pageMain = document.querySelector('.page__main') as HTMLElement;

    if (window.location.pathname === '/techsupport') {
    if (sidebar) sidebar.style.display = 'none';
    if (techsupportWrapper) techsupportWrapper.style.display = 'none';
    if (layoutPage) layoutPage.style.gridTemplateColumns = '1fr';
    if (pageMain) pageMain.style.padding = '0';
    }
    const user = loadUser();
    mainEl.innerHTML = ejs.render(techSupportTemplate, {
        user,
        close: ICONS.close,
    });
}