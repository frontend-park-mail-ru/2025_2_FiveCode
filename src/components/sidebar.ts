import ejs from "ejs";
import { Subdirectories } from "./subdirectories";
import { apiClient } from "../api/apiClient";
import router from "../router";
import { UserMenu, createExitConfirmationModal, createSearchModal } from "./userMenu";
import { loadUser } from "../utils/session";
import { exit } from "process";

const ICONS = {
  home: new URL("../static/svg/icon_home_active.svg", import.meta.url).href,
  search: new URL("../static/svg/icon_search.svg", import.meta.url).href,
  settings: new URL("../static/svg/icon_settings.svg", import.meta.url).href,
  logout: new URL("../static/svg/icon_logout_gray.svg", import.meta.url).href,
  account: new URL("../static/svg/icon_account_gray.svg", import.meta.url).href,
  trash: new URL("../static/svg/icon_delete.svg", import.meta.url).href,
  dots: new URL("../static/svg/icon_dots.svg", import.meta.url).href,
  collapse: new URL("../static/svg/icon_arrow.svg", import.meta.url).href,
};

interface User {
  id?: number;
  username?: string;
  password?: string;
  email?: string;
  avatar_file_id?: number;
  avatarUrl?: string | undefined;
}

interface SidebarParams {
  user: User | null;
  notes?: any[];
  avatarUrl?: string | undefined;
}

const handleTitleUpdate = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { noteId, newTitle } = customEvent.detail;
  if (!noteId || typeof newTitle === "undefined") return;

  const noteLinkTitle = document.querySelector(
    `.sidebar a[href="/note/${noteId}"] .subdir-title`
  );
  if (noteLinkTitle) {
    noteLinkTitle.textContent = newTitle;
  }
};

document.removeEventListener("noteTitleUpdated", handleTitleUpdate);
document.addEventListener("noteTitleUpdated", handleTitleUpdate);

export function Sidebar({
  user,
  notes,
  avatarUrl,
}: SidebarParams): HTMLElement {
  const template = `
        <aside class="sidebar">
            <div class="sidebar__user">
                <img src="<%= avatarUrl || account %>" class="sidebar__usericon" alt="user icon" id="sidebar-avatar" />
                <div class="sidebar__user-info">
                    <div class="sidebar__username" id="sidebar-username"><%= user?.username || user?.email?.split('@')[0] || 'Имя' %></div>
                </div>
                <button class="sidebar__user-dots" aria-label="Открыть меню пользователя">
                    <img src="<%= dots %>" alt="menu" />
                </button>
            </div>
            <nav class="sidebar__nav">
                <a href="/notes" class="sidebar__item" data-link> <img src="<%= home %>" class="sidebar__icon" alt="user icon" /> Домой</a>
                <a class="sidebar__item" id="search-btn" data-link style="cursor:pointer"> <img src="<%= search %>" class="sidebar__icon" alt="user icon" /> Поиск</a>
            </nav>
            <div class="sidebar__subs"></div>
            <a class="sidebar__item" data-link> <img src="<%= trash %>" class="sidebar__icon" /> Корзина</a>
            <a class="sidebar__item" data-link> <img src="<%= settings %>" class="sidebar__icon" /> Настройки</a>
            <a class="sidebar__item" data-link> <img style="transform: rotate(90deg); transition: transform 0.2s ease;" src="<%= collapse %>" class="sidebar__icon" /> Свернуть </a>
        </aside>
    `;

  const html = ejs.render(template, {
    user: user,
    account: ICONS.account,
    home: ICONS.home,
    trash: ICONS.trash,
    settings: ICONS.settings,
    search: ICONS.search,
    dots: ICONS.dots,
    avatarUrl: avatarUrl,
    collapse: ICONS.collapse,
  });
  const container = document.createElement("div");
  container.innerHTML = html;
  const el = container.firstElementChild as HTMLElement;
  let userMenuComponent: HTMLElement | null = null;

  document.addEventListener("DOMContentLoaded", highlightActiveMenuLink);

  const handleCreateNewNote = async (event: Event) => {
    event.preventDefault();
    const button = event.currentTarget as HTMLElement;
    button.textContent = "Создание...";
    try {
      const newNote = await apiClient.createNote();
      document.dispatchEvent(new CustomEvent("notesUpdated"));
      router.navigate(`note/${newNote.id}`);
    } catch (error) {
      console.error("Failed to create new note", error);
    }
  };

  const searchBtn = el.querySelector('#search-btn');

  searchBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (document.querySelector('#searchModal')) return;
    const searchModal = createSearchModal();
    document.body.appendChild(searchModal);
  });

  const handleDotsClick = (event: Event) => {
    event.stopPropagation();
    const dotsButton = event.currentTarget as HTMLElement;
    const rect = dotsButton.getBoundingClientRect();

    if (!userMenuComponent) {
      userMenuComponent = UserMenu({
        user,
        userIcon: avatarUrl || ICONS.account,
        isVisible: false,
        position: {
          top: rect.bottom + 8,
          left: rect.left < 220 ? 230 : rect.left,
        },
        settingsIcon: ICONS.settings,
        logoutIcon: ICONS.logout,
      });
      document.body.appendChild(userMenuComponent);
      userMenuComponent
        .querySelector(".user-menu__btn--settings")
        ?.addEventListener("click", () => {
          userMenuComponent!.classList.remove("user-menu--visible");
          router.navigate("settings");
        });

      userMenuComponent
        .querySelector(".user-menu__btn--logout")
        ?.addEventListener("click", () => {
          userMenuComponent!.classList.remove("user-menu--visible");
          const exitModal = createExitConfirmationModal();
          document.body.appendChild(exitModal);

          exitModal
            .querySelector(".exit-modal-button")
            ?.addEventListener("click", async () => {
              await apiClient.logout();
              exitModal.remove();

              router.navigate("login");
            });
        });
      
    }

    
    userMenuComponent.style.top = `${rect.bottom + 8}px`;
    userMenuComponent.style.left = `${rect.left < 220 ? 230 : rect.left}px`;
    userMenuComponent.classList.toggle("user-menu--visible");
  };

  document.addEventListener("click", (event) => {
    if (!userMenuComponent) return;

    const target = event.target as Node;
    const isClickOnDots = (target as HTMLElement).closest(
      ".sidebar__user-dots"
    );
    const isClickInsideMenu = userMenuComponent.contains(target);

    if (!isClickInsideMenu && !isClickOnDots) {
      userMenuComponent.classList.remove("user-menu--visible");
    }
  });

  const handleProfileUpdate = (event: CustomEvent) => {
    const updatedUser = loadUser();
    const usernameEl = document.getElementById("sidebar-username");
    const avatarEl = document.getElementById(
      "sidebar-avatar"
    ) as HTMLImageElement;
    if (usernameEl && updatedUser) {
      usernameEl.textContent =
        updatedUser.username || updatedUser.email.split("@")[0];
    }
    if (avatarEl && event.detail?.newAvatarUrl) {
      avatarEl.src = event.detail.newAvatarUrl;
    }
  };

  document.removeEventListener(
    "userProfileUpdated",
    handleProfileUpdate as EventListener
  );
  document.addEventListener(
    "userProfileUpdated",
    handleProfileUpdate as EventListener
  );

  el.querySelector(".sidebar__user-dots")?.addEventListener(
    "click",
    handleDotsClick
  );

  const subs = el.querySelector(".sidebar__subs") as HTMLElement;

  const renderSubdirectories = (notesData: any[]) => {
    const mappedNotes = (Array.isArray(notesData) ? notesData : []).map(
      (n) => ({ ...n, favorite: n.is_favorite })
    );
    subs.innerHTML = "";
    const subdirComponent = Subdirectories({ items: mappedNotes });

    const addNoteButtons = subdirComponent.querySelectorAll(".add-note-button");
    addNoteButtons.forEach((button) => {
      button.addEventListener("click", handleCreateNewNote as EventListener);
    });

    subs.appendChild(subdirComponent);
  };

  const refreshNotes = () => {
    apiClient
      .getNotesForUser()
      .then(renderSubdirectories)
      .catch((err) => {
        console.error("Failed to refresh notes for sidebar", err);
      });
  };

  document.removeEventListener("notesUpdated", refreshNotes);
  document.addEventListener("notesUpdated", refreshNotes);

  if (notes) {
    renderSubdirectories(notes);
  } else {
    refreshNotes();
  }

  return el;
}

type MenuLinkElement = HTMLAnchorElement & {
  dataset: {
    page?: string;
  };
};

function highlightActiveMenuLink(): void {
  const currentPath: string = window.location.pathname;
  const currentPage: string = currentPath.split("/").pop() || "";
  const menuLinks: NodeListOf<MenuLinkElement> =
    document.querySelectorAll(".sidebar__item");
  menuLinks.forEach((link: MenuLinkElement) => {
    if (link.dataset.page === currentPage) {
      link.classList.add("active");
    }
  });
}
