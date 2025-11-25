export function createCollaboratorsModal(editors: string[] = []): HTMLElement {
    const modalTemplate = `
        <div id="collaboratorsModal" class="exit-modal-overlay">
            <div class="exit-modal-content">
                <span class="exit-modal-close">&times;</span>

                <h2 class="exit-modal-title">Совместное редактирование</h2>

                <!-- Добавить редактора -->
                <div class="collab-add-block">
                    <label class="collab-label">Добавить редактора</label>
                    <input
                        type="email"
                        class="collab-input"
                        placeholder="Введите email"
                        id="collabEmailInput"
                    />
                    <button class="collab-invite-btn" id="inviteEditorBtn">
                        Пригласить
                    </button>
                </div>

                <!-- Список редакторов -->
                <div class="collab-list-block">
                    <label class="collab-label">Редакторы</label>
                    <ul class="collab-list" id="collabList">
                        ${editors
                            .map(
                                (email) => `
                                    <li class="collab-list-item">
                                        <span>${email}</span>
                                        <button class="collab-remove-btn" data-email="${email}">×</button>
                                    </li>`
                            )
                            .join("")}
                    </ul>
                </div>

                <!-- Доступ по ссылке -->
                <div class="collab-access-block">
                    <label class="collab-label">Доступ по ссылке</label>

                    <div class="collab-access-row">
                        <span class="collab-access-text">Только по приглашению</span>
                    </div>

                    <div class="collab-access-row">
                        <input
                            type="text"
                            class="collab-link-input"
                            value="${window.location.origin}/shared/access"
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

    modal.querySelector(".exit-modal-close")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.remove();
    });

    // Пригласить редактора
    const input = modal.querySelector("#collabEmailInput") as HTMLInputElement;
    const inviteBtn = modal.querySelector("#inviteEditorBtn") as HTMLElement;
    const list = modal.querySelector("#collabList") as HTMLElement;

    inviteBtn.addEventListener("click", () => {
        const email = input.value.trim();
        if (!email) return;
        if (!email.includes("@")) {
            alert("Некорректный email");
            return;
        }

        const li = document.createElement("li");
        li.className = "collab-list-item";
        li.innerHTML = `
            <span>${email}</span>
            <button class="collab-remove-btn" data-email="${email}">×</button>
        `;
        list.appendChild(li);

        input.value = "";
    });

    // Удаление редактора
    list.addEventListener("click", (e) => {
        const btn = (e.target as HTMLElement).closest(".collab-remove-btn");
        if (!btn) return;
        btn.parentElement?.remove();
    });

    // Копирование ссылки
    const copyBtn = modal.querySelector("#copyLinkBtn") as HTMLElement;
    const linkInput = modal.querySelector("#collabShareLink") as HTMLInputElement;

    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(linkInput.value);
        copyBtn.textContent = "Скопировано!";
        setTimeout(() => (copyBtn.textContent = "Копировать"), 1200);
    });

    return modal;
}
