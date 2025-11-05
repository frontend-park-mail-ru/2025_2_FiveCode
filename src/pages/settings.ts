import { AccountSettings } from "../components/userMenu";
import { loadUser, saveUser, clearUser } from "../utils/session";
import router from "../router";
import { apiClient } from "../api/apiClient";
import "../static/css/settings.css";

const ICONS = {
  userIcon: new URL("../static/svg/icon_account_gray.svg", import.meta.url)
    .href,
};

export function renderSettingsPage(): void {
  const mainEl = document.getElementById("main-content");
  if (!mainEl) {
    console.error("Main content element not found");
    return;
  }

  mainEl.innerHTML = "";
  mainEl.className = "page__main";

  const user = loadUser();
  if (!user) {
    router.navigate("login");
    return;
  }

  const settingsComponent = AccountSettings({
    user: user,
    userIcon: ICONS.userIcon,
    isVisible: true,
  });

  mainEl.appendChild(settingsComponent);

  const nameInput = settingsComponent.querySelector(
    ".name-section input"
  ) as HTMLInputElement;
  const saveButton = settingsComponent.querySelector(".save-button");
  const cancelButton = settingsComponent.querySelector(".cancel-button");
  const deleteButton = settingsComponent.querySelector(
    ".delete-account-button"
  );
  const closeButton = settingsComponent.querySelector(".close-button");

  const initialName = user?.email?.split("@")[0] || "Имя";

  saveButton?.addEventListener("click", async () => {
    const newName = nameInput.value.trim();
    if (!newName || newName === initialName) {
      return;
    }
    try {
      const updatedUser = await apiClient.updateUser({ username: newName });
      saveUser(updatedUser);
      alert("Данные успешно сохранены!");
      document.dispatchEvent(new CustomEvent("notesUpdated")); // Обновит сайдбар
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Не удалось сохранить изменения.");
    }
  });

  cancelButton?.addEventListener("click", () => {
    nameInput.value = initialName;
  });

  deleteButton?.addEventListener("click", async () => {
    if (
      confirm(
        "Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо."
      )
    ) {
      try {
        await apiClient.deleteUser();
        await apiClient.logout();
        router.navigate("login");
      } catch (error) {
        console.error("Failed to delete account:", error);
        alert("Не удалось удалить аккаунт.");
      }
    }
  });

  closeButton?.addEventListener("click", () => {
    history.back();
  });
}
