import { apiClient } from "./api/apiClient";
import { saveUser } from "./utils/session";
import { renderLogin } from "./pages/login";
import { renderNotes } from "./pages/notes";
import { renderNotePage } from "./pages/notepage";
import router from './router';
import "../styles.css";
import "./static/css/auth.css";
import "./static/css/globals.css";
import "./static/css/header.css";
import "./static/css/note-block.css";
import "./static/css/sidebar.css";
import "./static/css/note-editor.css";


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
      router.navigate('notes');
    } else {
      router.navigate('login');
    }
  } catch (error) {
    console.error("Auth check failed:", error);

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    router.navigate('login');
  }

  document.body.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('a[data-link], a[href^="/"]') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    if (/^https?:\/\//.test(href) || href.startsWith('mailto:') || anchor.hasAttribute('data-external')) {
      return;
    }

    e.preventDefault();
    //непонятное проклятье из интернета
    const path = href.replace(/^\//, '').replace(/[#?].*$/, '');
    router.navigate(path);
  });
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
