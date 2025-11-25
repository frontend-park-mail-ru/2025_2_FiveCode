import { apiClient, Collaborator } from "../api/apiClient";

export function createCollaboratorsModal(noteId: number): HTMLElement {
  const modalTemplate = `
        <div id="collaboratorsModal" class="exit-modal-overlay">
            <div class="exit-modal-content" style="width: 500px;">
                <span class="exit-modal-close">&times;</span>

                <h2 class="exit-modal-title">Совместное редактирование</h2>

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
                        </select>
                        <button class="collab-invite-btn" id="inviteEditorBtn">
                            +
                        </button>
                    </div>
                    <div id="inviteStatus" class="status-message" style="margin-top: 8px;"></div>
                </div>

                <div class="collab-list-block">
                    <label class="collab-label">Участники</label>
                    <ul class="collab-list" id="collabList">
                        <li style="text-align:center; color:gray;">Загрузка...</li>
                    </ul>
                </div>

                <div class="collab-access-block">
                    <label class="collab-label">Публичная ссылка</label>
                    <div class="collab-access-row">
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

  const renderList = (collaborators: Collaborator[], ownerId: number) => {
    list.innerHTML = "";
    if (collaborators.length === 0) {
      list.innerHTML = `<li class="collab-list-item" style="justify-content:center;">Нет участников</li>`;
      return;
    }

    collaborators.forEach((c) => {
      const li = document.createElement("li");
      li.className = "collab-list-item";
      const displayName = c.email || c.username || `ID: ${c.user_id}`;

      let roleName = "Читатель";
      if (c.role === "editor") roleName = "Редактор";
      if (c.role === "commenter") roleName = "Комментатор";

      li.innerHTML = `
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:500;">${displayName}</span>
                    <span style="font-size:12px; color:gray;">${roleName}</span>
                </div>
                ${c.user_id !== ownerId ? `<button class="collab-remove-btn" data-id="${c.permission_id}" style="font-size:18px;">×</button>` : '<span style="font-size:12px; color: gray;">Владелец</span>'}
            `;

      const removeBtn = li.querySelector(".collab-remove-btn");
      removeBtn?.addEventListener("click", async () => {
        if (!confirm("Удалить участника?")) return;
        try {
          await apiClient.removeCollaborator(noteId, c.permission_id);
          loadCollaborators();
        } catch (e) {
          console.error(e);
          alert("Ошибка при удалении");
        }
      });

      list.appendChild(li);
    });
  };

  const loadCollaborators = async () => {
    try {
      const data = await apiClient.getSharingSettings(noteId);
      renderList(data.collaborators, data.owner_id);
      if (data.public_access && data.public_access.share_url) {
        linkInput.value =
          window.location.origin +
          "/shared/" +
          data.public_access.share_url.split("/").pop();
      } else {
        linkInput.value = window.location.origin + "/notes/" + noteId;
      }
    } catch (e) {
      console.error(e);
      list.innerHTML = `<li style="color:red; text-align:center;">Ошибка загрузки</li>`;
    }
  };

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
      input.value = "";
      loadCollaborators();
    } catch (err: any) {
      console.error(err);
      statusEl.textContent = err.message || "Ошибка при добавлении";
      statusEl.classList.add("error--visible");
    } finally {
      inviteBtn.removeAttribute("disabled");
    }
  });

  const copyBtn = modal.querySelector("#copyLinkBtn") as HTMLElement;
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(linkInput.value);
    copyBtn.textContent = "Скопировано!";
    setTimeout(() => (copyBtn.textContent = "Копировать"), 1200);
  });

  loadCollaborators();

  return modal;
}
