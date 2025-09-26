import { loadUser } from "./utils/session.js";
import { apiClient } from "./api/apiClient.js";
import { initRouter } from "./router.js";

window.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("app");
  initRouter(app);
  
  let user = loadUser();

  if (!user) {
    try {
      user = await apiClient.me(); // проверка по cookie
    } catch {
      user = null;
    }
  }

  try {
    const user = await apiClient.me();
    if (user) {
      window.navigate("/notes");
    } else {
      window.navigate("/login");
    }
  } catch {
    window.navigate("/login");
  }
});
