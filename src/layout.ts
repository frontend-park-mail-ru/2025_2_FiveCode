import ejs from "ejs";
import { Sidebar } from "./components/sidebar";
import { techSupportWrapper } from "./components/techsupportdutton";
import { loadUser } from "./utils/session";
import { apiClient } from "./api/apiClient";

const ICONS = {
  Icon: new URL("./static/svg/icon_goose.svg", import.meta.url).href,
};

export async function renderAppLayout(app: HTMLElement): Promise<void> {
  app.innerHTML = "";
  const page = document.createElement("div");
  page.className = "page page--layout";
  const isTechSupportPage = window.location.pathname === '/techsupport';
  if (isTechSupportPage){
    const mainContent = document.createElement("main");
    mainContent.id = "main-content";
    mainContent.className = "page__main";
    page.appendChild(mainContent);

    app.appendChild(page);
    return;
  }
  const user = loadUser();
  if (!user) {
    return;
  }

  let avatarUrl;
  if (user.avatar_file_id) {
    try {
      const fileData = await apiClient.getFile(user.avatar_file_id);
      avatarUrl = fileData.url;
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
    }
  }
  if (!isTechSupportPage){
    const notes = await apiClient.getNotesForUser();
    
    page.appendChild(Sidebar({ user, notes, avatarUrl }));
    page.appendChild(techSupportWrapper());
  }
  const mainContent = document.createElement("main");
  mainContent.id = "main-content";
  mainContent.className = "page__main";
  page.appendChild(mainContent);

  app.appendChild(page);
  const updatedUser = loadUser();
  const usernameEl = document.getElementById("sidebar-username");
  const avatarEl = document.getElementById(
    "sidebar-avatar"
  ) as HTMLImageElement | null;
  if (usernameEl && updatedUser) {
    usernameEl.textContent =
      updatedUser.username || (updatedUser.email || "").split("@")[0];
  }
  if (avatarEl && avatarUrl) {
    avatarEl.src = avatarUrl;
  }

  document.dispatchEvent(
    new CustomEvent("userProfileUpdated", {
      detail: { newAvatarUrl: avatarUrl },
    })
  );
}
