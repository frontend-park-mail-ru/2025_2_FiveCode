import ejs from "ejs";

const ICONS = {
  close: new URL("../../static/svg/icon_close.svg", import.meta.url).href,
};

export function renderUserMainMenu(page: HTMLElement, nav: any) {
  const template = `
        <div class="tech-support-menu">
            <h2>Техническая поддержка</h2>
            <div class="menu-options">
                <button id="view-tickets-btn" class="menu-button">Просмотреть мои обращения</button>
                <button id="create-ticket-btn" class="menu-button">Создать новое обращение</button>
            </div>
        </div>
    `;
  page.innerHTML = ejs.render(template);
  document
    .getElementById("view-tickets-btn")
    ?.addEventListener("click", nav.toUserTickets);
  document
    .getElementById("create-ticket-btn")
    ?.addEventListener("click", nav.toCreateTicket);
}

export function renderAdminMainMenu(page: HTMLElement, nav: any) {
  const template = `
        <div class="tech-support-menu">
            <h2>Панель администратора</h2>
            <div class="menu-options">
                <button id="view-statistics-btn" class="menu-button">Статистика</button>
                <button id="view-all-tickets-btn" class="menu-button">Просмотреть все обращения</button>
            </div>
            <button class="close-button" id="close-iframe-btn" style="position: absolute; top: 20px; right: 20px;"><img src="<%= close %>"></button>
        </div>
    `;
  page.innerHTML = ejs.render(template, { close: ICONS.close });
  document
    .getElementById("view-statistics-btn")
    ?.addEventListener("click", nav.toStatistics);
  document
    .getElementById("view-all-tickets-btn")
    ?.addEventListener("click", nav.toAllTickets);
  document
    .getElementById("close-iframe-btn")
    ?.addEventListener("click", nav.close);
}
