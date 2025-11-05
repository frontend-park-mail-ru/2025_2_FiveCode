import { Sidebar } from "./components/sidebar";
import { loadUser } from "./utils/session";
import { apiClient } from "./api/apiClient";

export async function renderAppLayout(app: HTMLElement): Promise<void> {
  app.innerHTML = "";
  const page = document.createElement("div");
  page.className = "page page--layout";

  const user = loadUser();
  const notes = await apiClient.getNotesForUser();

  page.appendChild(Sidebar({ user, notes }));

  const mainContent = document.createElement("main");
  mainContent.id = "main-content";
  mainContent.className = "page__main";
  page.appendChild(mainContent);

  app.appendChild(page);
}
