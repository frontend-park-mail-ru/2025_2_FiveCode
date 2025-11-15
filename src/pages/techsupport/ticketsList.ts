import ejs from "ejs";
import { apiClient } from "../../api/apiClient";

const ICONS = {
  back: new URL("../../static/svg/icon_back.svg", import.meta.url).href,
  close: new URL("../../static/svg/icon_close.svg", import.meta.url).href,
};

export async function renderUserTicketsList(page: HTMLElement, nav: any) {
  const template = `
        <div class="tickets-list">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="back-to-menu-btn"><img src="<%= back %>"></button>
                <h2>Мои обращения</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tickets-content">
                <% if (tickets.length === 0) { %><p>Нет обращений.</p><% } else { %>
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
  try {
    const tickets = await apiClient.getMyTickets();
    page.innerHTML = ejs.render(template, { tickets, ...ICONS });
    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", nav.close);
    document
      .getElementById("back-to-menu-btn")
      ?.addEventListener("click", nav.toUserMenu);
    page.querySelector(".ticket-title-list")?.addEventListener("click", (e) => {
      const link = (e.target as HTMLElement).closest("a");
      if (link?.dataset.ticketId) {
        e.preventDefault();
        nav.toUserTicketDetail(Number(link.dataset.ticketId));
      }
    });
  } catch (error) {
    console.error("Failed to load tickets:", error);
    page.innerHTML = `<p>Не удалось загрузить список обращений. <a href="#" id="back-link">Назад</a></p>`;
    document.getElementById("back-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      nav.toUserMenu();
    });
  }
}

export async function renderAllTicketsList(page: HTMLElement, nav: any) {
  const template = `
        <div class="tickets-list">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="back-to-admin-menu-btn"><img src="<%= back %>"></button>
                <h2>Все обращения</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="tickets-content">
                <% if (tickets.length === 0) { %><p>Нет обращений.</p><% } else { %>
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
  try {
    const tickets = await apiClient.getAllTickets();
    page.innerHTML = ejs.render(template, { tickets, ...ICONS });
    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", nav.close);
    document
      .getElementById("back-to-admin-menu-btn")
      ?.addEventListener("click", nav.toAdminMenu);
    page.querySelector(".ticket-title-list")?.addEventListener("click", (e) => {
      const link = (e.target as HTMLElement).closest("a");
      if (link?.dataset.ticketId) {
        e.preventDefault();
        nav.toAdminTicketDetail(Number(link.dataset.ticketId));
      }
    });
  } catch (error) {
    console.error("Failed to load all tickets:", error);
    page.innerHTML = `<p>Не удалось загрузить список обращений. <a href="#" id="back-link">Назад</a></p>`;
    document.getElementById("back-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      nav.toAdminMenu();
    });
  }
}
