import ejs from "ejs";
import { apiClient } from "../../api/apiClient";

const ICONS = {
  back: new URL("../../static/svg/icon_back.svg", import.meta.url).href,
  close: new URL("../../static/svg/icon_close.svg", import.meta.url).href,
};

function formatCategoryName(category: string): string {
  const names: { [key: string]: string } = {
    total: "Всего обращений",
    bug: "Сообщения о багах",
    suggestion: "Предложения",
    complaint: "Жалобы",
    other: "Другое",
  };
  return names[category] || category;
}

export async function renderStatistics(page: HTMLElement, nav: any) {
  const template = `
        <div class="statistics-view">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="back-to-admin-menu-btn"><img src="<%= back %>"></button>
                <h2>Статистика обращений</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="statistics-content">
                <% statistics.forEach(stat => { %>
                    <div class="stat-card">
                        <h3 class="stat-card-title"><%= formatCategoryName(stat.category) %></h3>
                        <div class="stat-card-main-value"><%= stat.total_tickets %></div>
                        <div class="stat-card-details">
                            <div class="stat-item">
                                <span class="stat-label">Открыто</span>
                                <span class="stat-value status-open"><%= stat.open_tickets %></span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">В процессе</span>
                                <span class="stat-value status-in_progress"><%= stat.in_progress_tickets %></span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Закрыто</span>
                                <span class="stat-value status-closed"><%= stat.closed_tickets %></span>
                            </div>
                        </div>
                    </div>
                <% }); %>
            </div>
        </div>
    `;
  try {
    const statsData = await apiClient.getTicketStatistics();
    page.innerHTML = ejs.render(template, {
      statistics: statsData.statistics,
      formatCategoryName,
      ...ICONS,
    });
    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", nav.close);
    document
      .getElementById("back-to-admin-menu-btn")
      ?.addEventListener("click", nav.toAdminMenu);
  } catch (error) {
    console.error("Failed to load statistics:", error);
    page.innerHTML = `<p>Не удалось загрузить статистику. <a href="#" id="back-link">Назад</a></p>`;
    document.getElementById("back-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      nav.toAdminMenu();
    });
  }
}
