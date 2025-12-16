import { apiClient, Collaborator } from "../api/apiClient";
import { handleError } from "../utils/errorHandler";
import { showNotification } from "./notification";
import { deleteCollaboratorModal } from "./deleteCollaboratorModal";

export function createCollaboratorsModal(noteId: number): HTMLElement {
  const modalTemplate = `
        <div id="collaboratorsModal" class="exit-modal-overlay">
            <div class="exit-modal-content" style="width: 500px;">
                <span class="exit-modal-close">&times;</span>

                <h2 class="exit-modal-title">Совместное редактирование</h2>

                <div class="collab-access-block" style="margin-top:0; margin-bottom:20px; padding-bottom:15px; border-bottom:1px solid #eee;">
                    <label class="collab-label" style="font-weight:600;">Общий доступ</label>
                    <select id="generalAccessSelect" class="collab-input" style="margin-bottom:10px;">
                        <option value="private">Доступ ограничен</option>
                        <option value="viewer">Все, у кого есть ссылка (Читатель)</option>
                        <option value="commenter" style="display:none">Все, у кого есть ссылка (Комментатор)</option>
                        <option value="editor">Все, у кого есть ссылка (Редактор)</option>
                    </select>
                    
                    <div id="linkContainer" class="collab-access-row" style="display:none;">
                        <input
                            type="text"
                            class="collab-link-input"
                            value="" 
                            readonly
                            id="collabShareLink"
                        />
                        <button class="collab-copy-btn" id="copyLinkBtn">Копировать</button>
                    </div>
                </div>

                <div class="collab-add-block">
                    <label class="collab-label">Добавить участника по Email</label>
                    <div style="display:flex; gap:8px;">
                        <input
                            type="email"
                            class="collab-input"
                            placeholder="user@example.com"
                            id="collabEmailInput"
                            style="margin-bottom:0;"
                        />
                        <select id="collabRoleSelect" class="collab-input" style="width: 120px; margin-bottom:0;">
                            <option value="editor">Редактор</option>
                            <option value="viewer">Читатель</option>
                            <option value="commenter" style="display:none">Комментатор</option>
                        </select>
                        <button class="collab-invite-btn" id="inviteEditorBtn">
                            +
                        </button>
                    </div>
                    <div id="inviteStatus" class="status-message" style="margin-top: 8px;"></div>
                </div>

                <div class="collab-list-block">
                    <label class="collab-label">Участники с доступом</label>
                    <ul class="collab-list" id="collabList">
                        <li style="text-align:center; color:gray;">Загрузка...</li>
                    </ul>
                </div>
            </div>
        </div>
    `;

  const container = document.createElement("div");
  container.innerHTML = modalTemplate;
  const modal = container.firstElementChild as HTMLElement;

  const close = () => modal.remove();
  modal.querySelector(".exit-modal-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });

  const list = modal.querySelector("#collabList") as HTMLElement;
  const input = modal.querySelector("#collabEmailInput") as HTMLInputElement;
  const roleSelect = modal.querySelector(
    "#collabRoleSelect"
  ) as HTMLSelectElement;
  const inviteBtn = modal.querySelector("#inviteEditorBtn") as HTMLElement;
  const statusEl = modal.querySelector("#inviteStatus") as HTMLElement;
  const linkInput = modal.querySelector("#collabShareLink") as HTMLInputElement;
  const generalAccessSelect = modal.querySelector(
    "#generalAccessSelect"
  ) as HTMLSelectElement;
  const linkContainer = modal.querySelector("#linkContainer") as HTMLElement;

  const renderList = (
    collaborators: Collaborator[],
    ownerId: number,
    isOwner: boolean
  ) => {
    list.innerHTML = "";
    if (collaborators.length === 0) {
      list.innerHTML = `<li class="collab-list-item" style="justify-content:center;">Нет участников</li>`;
      return;
    }

    collaborators.forEach((c) => {
      const li = document.createElement("li");
      li.className = "collab-list-item";
      const displayName = c.email || c.username || `ID: ${c.user_id}`;
      const isTargetOwner = c.user_id === ownerId;

      let roleDisplay = "";

      if (isTargetOwner) {
        roleDisplay = `<span style="font-size:12px; color:gray; padding: 4px;">Владелец</span>`;
      } else if (isOwner) {
        roleDisplay = `
          <select class="collab-role-change" data-permission-id="${c.permission_id}" style="padding: 3px;">
            <option value="editor" ${c.role === "editor" ? "selected" : ""}>Редактор</option>
            <option value="viewer" ${c.role === "viewer" ? "selected" : ""}>Читатель</option>
            <option value="commenter" ${c.role === "commenter" ? "selected" : ""}>Комментатор</option>
          </select>
        `;
      } else {
        const roleMap: Record<string, string> = {
          editor: "Редактор",
          viewer: "Читатель",
          commenter: "Комментатор",
        };
        roleDisplay = `<span style="font-size:12px; color:gray;">${roleMap[c.role] || c.role}</span>`;
      }

      li.innerHTML = `
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:500;">${displayName}</span>
                </div>
                <div style="display:flex; align-items:center; gap: 10px;">
                    ${roleDisplay}
                    ${isOwner && !isTargetOwner ? `<button class="collab-remove-btn" data-id="${c.permission_id}" style="font-size:18px;">×</button>` : ""}
                </div>
            `;

      if (isOwner && !isTargetOwner) {
        const removeBtn = li.querySelector(".collab-remove-btn");
        removeBtn?.addEventListener("click", async () => {
          const deleteModal = deleteCollaboratorModal();
          document.body.appendChild(deleteModal);
          deleteModal
            .querySelector(".delete-collaborator-confirm")
            ?.addEventListener("click", async () => {
              try {
                await apiClient.removeCollaborator(noteId, c.permission_id);
                deleteModal.remove();
                showNotification("Участник удален", "success");
                loadCollaborators();
              } catch (e) {
                handleError(e, "Ошибка при удалении участника");
              }
            });
        });

        const roleChangeSelect = li.querySelector(
          ".collab-role-change"
        ) as HTMLSelectElement;
        roleChangeSelect?.addEventListener("change", async (e) => {
          const newRole = roleChangeSelect.value as
            | "editor"
            | "viewer"
            | "commenter";
          try {
            await apiClient.updateCollaboratorRole(
              noteId,
              c.permission_id,
              newRole
            );
            showNotification("Роль обновлена", "success");
          } catch (err) {
            handleError(err, "Не удалось обновить роль");
            roleChangeSelect.value = c.role;
          }
        });
      }

      list.appendChild(li);
    });
  };

  const updateLinkVisibility = (
    accessLevel: string | null,
    shareUrl?: string
  ) => {
    if (accessLevel && accessLevel !== "private") {
      generalAccessSelect.value = accessLevel;
      linkContainer.style.display = "flex";
      if (shareUrl) {
        linkInput.value =
          window.location.origin + "/shared/" + shareUrl.split("/").pop();
      }
    } else {
      generalAccessSelect.value = "private";
      linkContainer.style.display = "none";
    }
  };

  const loadCollaborators = async () => {
    try {
      const data = await apiClient.getSharingSettings(noteId);
      const isOwner = data.is_owner;

      renderList(data.collaborators, data.owner_id, isOwner);

      if (!isOwner) {
        input.disabled = true;
        roleSelect.disabled = true;
        inviteBtn.style.display = "none";
        const addBlock = modal.querySelector(
          ".collab-add-block"
        ) as HTMLElement;
        if (addBlock) addBlock.style.display = "none";

        generalAccessSelect.disabled = true;
        generalAccessSelect.style.opacity = "0.5";
        generalAccessSelect.style.backgroundColor = "var(--gray-100, #f1f3f5)";
        generalAccessSelect.style.cursor = "not-allowed";
      }

      updateLinkVisibility(
        data.public_access?.access_level,
        data.public_access?.share_url
      );
    } catch (e) {
      console.error(e);
      list.innerHTML = `<li style="color:red; text-align:center;">Ошибка загрузки</li>`;
    }
  };

  generalAccessSelect.addEventListener("change", async () => {
    const newAccess = generalAccessSelect.value;
    const accessLevel =
      newAccess === "private"
        ? null
        : (newAccess as "editor" | "viewer" | "commenter");

    try {
      await apiClient.setPublicAccess(noteId, accessLevel);
      showNotification("Настройки доступа обновлены", "success");
      document.dispatchEvent(new CustomEvent("sharingSettingsUpdated"));
      loadCollaborators();
    } catch (e) {
      handleError(e, "Не удалось обновить настройки доступа");
    }
  });

  inviteBtn.addEventListener("click", async () => {
    const email = input.value.trim();
    const role = roleSelect.value as "editor" | "viewer" | "commenter";

    if (!email) return;

    statusEl.textContent = "Отправка...";
    statusEl.className = "status-message";
    inviteBtn.setAttribute("disabled", "true");

    try {
      await apiClient.addCollaborator(noteId, email, role);
      statusEl.textContent = "Успешно добавлено";
      statusEl.classList.add("complete--visible");
      showNotification("Приглашение отправлено", "success");
      document.dispatchEvent(new CustomEvent("sharingSettingsUpdated"));
      input.value = "";
      loadCollaborators();
    } catch (err: any) {
      handleError(err, "Ошибка при добавлении участника");
      statusEl.textContent = err.message || "Ошибка при добавлении";
      statusEl.classList.add("error--visible");
    } finally {
      inviteBtn.removeAttribute("disabled");
    }
  });

  const copyBtn = modal.querySelector("#copyLinkBtn") as HTMLElement;
  copyBtn.addEventListener("click", async () => {
    const text = linkInput.value;

    const copyToClipboard = async (str: string) => {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(str);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = str;
        textArea.style.position = "absolute";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
    };

    try {
      await copyToClipboard(text);
      copyBtn.textContent = "Скопировано!";
      showNotification("Ссылка скопирована в буфер обмена", "success");
      setTimeout(() => (copyBtn.textContent = "Копировать"), 1200);
    } catch (err) {
      console.error(err);
      showNotification("Не удалось скопировать ссылку", "error");
    }
  });

  loadCollaborators();

  return modal;
}
