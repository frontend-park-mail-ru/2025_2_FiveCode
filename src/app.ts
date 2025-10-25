import { apiClient } from "./api/apiClient";
import { saveUser } from "./utils/session";
import { renderLogin } from "./pages/login";
import { renderNotes } from "./pages/notes";
import "../styles.css";
import "./static/css/auth.css";
import "./static/css/globals.css";
import "./static/css/header.css";
import "./static/css/note-block.css";
import "./static/css/sidebar.css";


interface User{
  id?: number;
  username?: string;
  password?: string;
  email?: string;
}


async function initializeApp(): Promise<void> {
  const app = document.getElementById("app");

  if (!app) {
    console.error("Could not find app container");
    return;
  }

  try {
    const user: User | null = await apiClient.me();

    if (user) {
      saveUser(user);
      renderNotes(app);
    } else {
      renderLogin(app);
    }
  } catch (error) {
    console.error("Auth check failed:", error);

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    renderLogin(app);
  }
}

window.addEventListener("DOMContentLoaded", initializeApp);


// window.addEventListener("DOMContentLoaded", async () => {
//   const app = document.getElementById("app") as HTMLElement;
  
//   try {
//     const user : User | null = await apiClient.me();
//     if (user) {
//       saveUser(user);
//       renderNotes(app);
//     } else {
//       renderLogin(app);
//     }
//   } catch (error) {
//     console.error("Auth check failed:", error);
//     renderLogin(app);
//   }
// });
