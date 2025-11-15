import ejs from "ejs";
import { apiClient } from "../../api/apiClient";

const ICONS = {
  back: new URL("../../static/svg/icon_back.svg", import.meta.url).href,
  close: new URL("../../static/svg/icon_close.svg", import.meta.url).href,
};

export async function renderStatistics(page: HTMLElement, nav: any) {
  const template = `
        <div class="statistics-view">
            <div class="tech-support-header">
                <button class="back-to-menu-button" id="back-to-admin-menu-btn"><img src="<%= back %>"></button>
                <h2>Статистика</h2>
                <button class="close-button" id="close-iframe-btn"><img src="<%= close %>"></button>
            </div>
            <div class="statistics-content">
                <table class="statistics-table">
                    <thead>
                        <tr><th>Категория</th><th>Всего</th><th>Открыто</th><th>В процессе</th><th>Закрыто</th></tr>
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
  try {
    const statsData = await apiClient.getTicketStatistics();
    page.innerHTML = ejs.render(template, {
      statistics: statsData.statistics,
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
