import { apiClient } from "./api/apiClient";
import { saveUser } from "./utils/session";
import { renderLogin } from "./pages/login";
import { renderNotes } from "./pages/notes";
import router from './router';
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
      // use router to navigate to notes route
      router.navigate('notes');
    } else {
      // navigate to login route
      router.navigate('login');
    }
  } catch (error) {
    console.error("Auth check failed:", error);

    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }

    router.navigate('login');
  }

  // Global link interception for SPA navigation.
  // Intercepts links with `data-link` or hrefs that start with '/'.
  document.body.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest('a[data-link], a[href^="/"]') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href') || '';
    // external links (http/https/mailto) should not be intercepted
    if (/^https?:\/\//.test(href) || href.startsWith('mailto:') || anchor.hasAttribute('data-external')) {
      return;
    }

    e.preventDefault();

    // Normalize path: remove leading slash and hash/query
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
