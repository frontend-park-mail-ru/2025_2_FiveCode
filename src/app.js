import { apiClient } from "./api/apiClient.js";
import { initRouter } from "./router.js";
import { saveUser } from "./utils/session.js";

window.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("app");
  initRouter(app);
  
  try {
    const user = await apiClient.me();
    if (user) {
      saveUser(user);
      window.navigate("/notes");
    } else {
      window.navigate("/login");
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    window.navigate("/login");
  }
});
