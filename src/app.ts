import { apiClient } from "./api/apiClient";
import { saveUser } from "./utils/session";
import ejs from "ejs";
import router from "./router";
import { renderAppLayout } from "./layout";
import "../styles.css";
import "./static/css/auth.css";
import "./static/css/globals.css";
import "./static/css/header.css";
import "./static/css/note-block.css";
import "./static/css/sidebar.css";
import "./static/css/note-editor.css";
import "./static/css/modal.css";
import "./static/css/settings.css";
import "./static/css/note-menu.css";
import "./static/css/techsupport.css";
import "./static/css/user-menu.css";
import "./static/css/search.css";

interface User {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
}

const ICONS = {
  Icon: new URL("./static/svg/icon_goose.svg", import.meta.url).href,
};


async function initializeApp(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) {
    console.error("Could not find app container");
    return;
  }
  const faviconTemplate = `
      <link rel="icon" type="image/x-icon" href="<%= icon %>" />
    `;
    const faviconHtml = ejs.render(faviconTemplate, {icon: ICONS.Icon});
    const faviconEl = document.createElement("link");
    faviconEl.innerHTML = faviconHtml;
    const favicon = faviconEl.firstElementChild as HTMLLinkElement;
    document.head.appendChild(favicon);
  const path = window.location.pathname;
  const isAuthPage = path === "/login" || path === "/register";
  const techsupportPath = path === "/techsupport";
  let user: User | null = null;
  try {
    user = await apiClient.me();
    if (user) {
      saveUser(user);
    }
  } catch (error) {
    console.error("Session check failed, assuming logged out.");
  }

  if (user) {
    // if (techsupportPath) {
    //   router.navigate("techsupport");
    //   return;
    // }
    await renderAppLayout(app);
    if (isAuthPage) {
      router.navigate("notes");
    }
  } else {
    if (!isAuthPage) {
      router.navigate("login");
    }
  }

  router.start();
}

window.addEventListener("DOMContentLoaded", () => {
  initializeApp();

  document.body.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest(
      'a[data-link], a[href^="/"]'
    ) as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute("href") || "";
    if (
      /^https?:\/\//.test(href) ||
      href.startsWith("mailto:") ||
      anchor.hasAttribute("data-external")
    ) {
      return;
    }

    e.preventDefault();
    const newPath = href.replace(/^\//, "").replace(/[#?].*$/, "");
    router.navigate(newPath);
  });
});
