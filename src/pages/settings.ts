import { AccountSettings } from "../components/userMenu";
import { loadUser, saveUser } from "../utils/session";
import router from "../router";
import { apiClient } from "../api/apiClient";
import { createDeleteAccountModal } from "../components/deleteAccountModal";

const ICONS = {
  userIcon: new URL("../static/svg/icon_account_gray.svg", import.meta.url)
    .href,
};

export async function renderSettingsPage(): Promise<void> {
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

  let avatarUrl: string | undefined;
  if (user.avatar_file_id) {
    try {
      const fileData = await apiClient.getFile(user.avatar_file_id);
      avatarUrl = fileData.url;
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
    }
  }

  const settingsComponent = AccountSettings({
    user: user,
    userIcon: ICONS.userIcon,
    isVisible: true,
    avatarUrl,
  });

  mainEl.appendChild(settingsComponent);

  const nameInput = settingsComponent.querySelector(
    ".name-section input"
  ) as HTMLInputElement;
  const saveButton = settingsComponent.querySelector(
    ".save-button"
  ) as HTMLButtonElement;
  const cancelButton = settingsComponent.querySelector(".cancel-button");
  const deleteButton = settingsComponent.querySelector(
    ".delete-account-button"
  );
  const closeButton = settingsComponent.querySelector(".close-button");
  const avatarUploadTrigger = settingsComponent.querySelector(
    "#avatar-upload-trigger"
  );
  const avatarFileInput = settingsComponent.querySelector(
    "#avatar-file-input"
  ) as HTMLInputElement;
  const avatarPreview = settingsComponent.querySelector(
    "#avatar-preview"
  ) as HTMLImageElement;

  let initialName = user?.username || user?.email?.split("@")[0] || "Имя";

  avatarUploadTrigger?.addEventListener("click", () => {
    avatarFileInput.click();
  });

  avatarFileInput?.addEventListener("change", async () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;

    try {
      const uploadedFile = await apiClient.uploadFile(file);
      const updatedUser = await apiClient.updateUser({
        avatar_file_id: uploadedFile.id,
      });
      saveUser(updatedUser);
      avatarUrl = uploadedFile.url;
      avatarPreview.src = avatarUrl;
      document.dispatchEvent(
        new CustomEvent("userProfileUpdated", {
          detail: { newAvatarUrl: uploadedFile.url },
        })
      );
    } catch (error) {
      console.error("Failed to upload avatar:", error);
    }
  });

  saveButton?.addEventListener("click", async () => {
    const newName = nameInput.value.trim();
    if (!newName || newName === initialName) {
      return;
    }

    const originalButtonText = saveButton.textContent;
    saveButton.textContent = "Сохранение...";
    saveButton.disabled = true;

    try {
      const updatedUser = await apiClient.updateUser({ username: newName });
      saveUser(updatedUser);
      initialName = updatedUser.username || initialName;
      document.dispatchEvent(new CustomEvent("userProfileUpdated"));
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setTimeout(() => {
        saveButton.textContent = originalButtonText;
        saveButton.disabled = false;
      }, 1000);
    }
  });

  cancelButton?.addEventListener("click", () => {
    nameInput.value = initialName;
    avatarPreview.src = avatarUrl || ICONS.userIcon;
  });

  deleteButton?.addEventListener("click", () => {
    const deleteModal = createDeleteAccountModal();
    document.body.appendChild(deleteModal);

    deleteModal.querySelector(".delete-account-confirm")?.addEventListener(
      "click",
      async () => {
        try {
          await apiClient.deleteUser();
          await apiClient.logout();
          deleteModal.remove();
          router.navigate("login");
        } catch (error) {
          console.error("Failed to delete account:", error);
        }
      }
    );
  });

  closeButton?.addEventListener("click", () => {
    history.back();
  });
}
