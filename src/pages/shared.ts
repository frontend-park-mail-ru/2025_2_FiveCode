import { apiClient } from "../api/apiClient";
import router from "../router";
import { renderAppLayout } from "../layout";

export async function handleSharedLink(uuid: string): Promise<void> {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML = `
        <div class="page">
            <div class="page__main" style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;gap:20px;">
                <h2 style="font-size:24px;color:#333;">Обработка приглашения...</h2>
                <div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #3498db;border-radius:50%;animation:spin 1s linear infinite;"></div>
            </div>
            <style>@keyframes spin {0% {transform: rotate(0deg);} 100% {transform: rotate(360deg);}}</style>
        </div>
    `;
  }

  try {
    const response = await apiClient.activateSharedLink(uuid);

    if (app) {
      await renderAppLayout(app);
    }

    if (response && response.note_id) {
      document.dispatchEvent(new CustomEvent("notesUpdated"));
      router.navigate(`note/${response.note_id}`);
    } else {
      router.navigate("notes");
    }
  } catch (error: any) {
    console.error("Failed to activate shared link:", error);
    if (app) {
      let errorMsg =
        "Не удалось получить доступ к заметке. Возможно, ссылка устарела.";
      let actionLink = `<a href="/notes" class="btn" style="text-decoration:none;display:inline-block;margin-top:15px;">На главную</a>`;

      if (error.status === 401) {
        errorMsg = "Для доступа к заметке необходимо авторизоваться.";
        actionLink = `<a href="/login" class="btn" style="text-decoration:none;display:inline-block;margin-top:15px;">Войти</a>`;
      }

      app.innerHTML = `
        <div class="page">
            <div class="page__main" style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;text-align:center;">
                <h2 style="color:#DC3545;margin-bottom:10px;">Ошибка доступа</h2>
                <p style="color:#555;font-size:16px;">${errorMsg}</p>
                ${actionLink}
            </div>
        </div>
      `;
    }
  }
}
