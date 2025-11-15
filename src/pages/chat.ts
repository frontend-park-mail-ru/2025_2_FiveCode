import ejs from "ejs";
import { apiClient } from "../api/apiClient";
import { loadUser } from "../utils/session";

const ICONS = {
  close: new URL("../static/svg/icon_close.svg", import.meta.url).href,
  back: new URL("../static/svg/icon_back.svg", import.meta.url).href,
};

export async function renderChatPage(ticketId: number): Promise<void> {
  const app = document.getElementById("app")!;
  app.innerHTML = "";
  const page = document.createElement("div");
  page.className = "page";
  app.appendChild(page);

  const user = loadUser();
  if (!user) {
    page.innerHTML = "<p>Пожалуйста, войдите в систему для доступа к чату.</p>";
    return;
  }

  const closeIframe = () => {
    window.parent.postMessage("close-support-iframe", "*");
  };

  const chatTemplate = `
    <div class="chat-support">
      <div class="tech-support-header">
        <button class="back-to-list-button" id="back-to-list-btn">
          <img src="<%= back %>">
        </button>
        <h2>Чат по обращению #<%= ticketId %></h2>
        <button class="close-button" id="close-iframe-btn">
          <img src="<%= close %>">
        </button>
      </div>
      <div class="chat-support-content">
        <div class="chat-messages" id="chat-messages">
          <% if (messages && messages.length > 0) { %>
            <% messages.forEach(message => { %>
              <div class="chat-message <%= message.sender === 'user' ? 'user-message' : 'support-message' %>">
                <p><%= message.text %></p>
                <span>
                  <%= new Date(message.created_at).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) %>
                </span>
              </div>
            <% }); %>
          <% } else { %>
            <p>Сообщений пока нет.</p>
          <% } %>
        </div>
        <div class="chat-input-section">
          <input type="text" id="chat-input" placeholder="Напишите сообщение..." />
          <button id="send-chat-message">Отправить</button>
        </div>
      </div>
    </div>
  `;

  try {
    const messages = await apiClient.getChatMessages(ticketId);

    page.innerHTML = ejs.render(chatTemplate, {
      ticketId,
      messages,
      back: ICONS.back,
      close: ICONS.close,
    });

    document
      .getElementById("close-iframe-btn")
      ?.addEventListener("click", closeIframe);

    document
      .getElementById("back-to-list-btn")
      ?.addEventListener("click", () => {
        window.location.href = "/support";
      });

    const sendButton = document.getElementById("send-chat-message");
    const chatInput = document.getElementById("chat-input") as HTMLInputElement;

    sendButton?.addEventListener("click", async () => {
      const messageText = chatInput.value.trim();
      if (!messageText) return;

      try {
        await apiClient.sendChatMessage(ticketId, messageText);
        chatInput.value = "";
        renderChatPage(ticketId);
      } catch (error) {
        console.error("Ошибка отправки сообщения:", error);
        alert("Не удалось отправить сообщение. Попробуйте снова.");
      }
    });

    chatInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendButton?.click();
      }
    });

  } catch (error) {
    console.error(`Ошибка загрузки чата для обращения ${ticketId}:`, error);
    page.innerHTML = `
      <p>Не удалось загрузить чат.
        <a href="#" id="back-to-list-link">Назад к списку обращений</a>
      </p>
    `;
    document
      .getElementById("back-to-list-link")
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "/support";
      });
  }
}
