import { apiClient } from "./api/apiClient.js";
import { saveUser } from "./utils/session.js";
import { renderLogin } from "./pages/login.js";
import {renderNotes} from "./pages/notes.js";

window.addEventListener("DOMContentLoaded", async () => {
  const app = document.getElementById("app");
  
  try {
    const user = await apiClient.me();
    if (user) {
      saveUser(user);
      renderNotes(app);
    } else {
      renderLogin(app);
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    renderLogin(app);
  }
});
