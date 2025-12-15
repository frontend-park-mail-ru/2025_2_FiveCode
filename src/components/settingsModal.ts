export function createSettingsModal(): HTMLElement {
  const modalTemplate = `
    <div id="settingsModal" class="settings-modal-overlay">
      <div class="settings-modal-content">
        <div class="settings-modal-header">
          <h2 class="settings-modal-title">Параметры приложения</h2>
          <span id="closeSettingsModal" class="settings-modal-close">×</span>
        </div>
        
        <div class="settings-modal-body">
          <!-- Тема приложения -->
          <div class="settings-section">
            <h3 class="settings-section-title">Тема</h3>
            <div class="settings-option">
              <label for="themeSelect" class="settings-label">Выберите тему:</label>
              <select id="themeSelect" class="settings-select">
                <option value="light">Светлая</option>
                <option value="dark">Темная</option>
                <option value="auto">Автоматически</option>
              </select>
            </div>
          </div>

          <!-- Цвет заголовка заметок -->
          <div class="settings-section">
            <h3 class="settings-section-title">Оформление заметок</h3>
            <div class="settings-option">
              <label class="settings-label">Цвет заголовка заметки:</label>
              <div class="settings-color-grid">
                <button class="settings-color-btn" data-color="#FF6B6B" style="background-color: #FF6B6B;" title="Красный"></button>
                <button class="settings-color-btn" data-color="#4ECDC4" style="background-color: #4ECDC4;" title="Бирюзовый"></button>
                <button class="settings-color-btn" data-color="#45B7D1" style="background-color: #45B7D1;" title="Голубой"></button>
                <button class="settings-color-btn" data-color="#96CEB4" style="background-color: #96CEB4;" title="Зеленый"></button>
                <button class="settings-color-btn" data-color="#FFEAA7" style="background-color: #FFEAA7;" title="Желтый"></button>
                <button class="settings-color-btn" data-color="#DDA15E" style="background-color: #DDA15E;" title="Оранжевый"></button>
                <button class="settings-color-btn" data-color="#BC6C25" style="background-color: #BC6C25;" title="Коричневый"></button>
                <button class="settings-color-btn" data-color="#9D84B7" style="background-color: #9D84B7;" title="Фиолетовый"></button>
              </div>
              <div class="settings-current-color">
                <span>Текущий цвет:</span>
                <div id="currentColorPreview" class="settings-color-preview"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-modal-footer">
          <button id="resetSettingsBtn" class="settings-btn settings-btn-secondary">Сброс</button>
          <button id="closeSettingsBtnFooter" class="settings-btn settings-btn-primary">Закрыть</button>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = modalTemplate;
  const modal = container.firstElementChild as HTMLElement;

  const closeBtn = modal.querySelector("#closeSettingsModal") as HTMLElement;
  const closeBtnFooter = modal.querySelector("#closeSettingsBtnFooter") as HTMLElement;
  const themeSelect = modal.querySelector("#themeSelect") as HTMLSelectElement;
  const colorButtons = modal.querySelectorAll(".settings-color-btn") as NodeListOf<HTMLButtonElement>;
  const resetBtn = modal.querySelector("#resetSettingsBtn") as HTMLButtonElement;
  const currentColorPreview = modal.querySelector("#currentColorPreview") as HTMLElement;

  const savedTheme = localStorage.getItem("app-theme") || "auto";
  const savedHeaderColor = localStorage.getItem("note-header-color") || "#45B7D1";

  themeSelect.value = savedTheme;
  currentColorPreview.style.backgroundColor = savedHeaderColor;

  // Подсветка текущего цвета
  colorButtons.forEach((btn) => {
    if (btn.getAttribute("data-color") === savedHeaderColor) {
      btn.classList.add("active");
    }
  });

  // Переключение темы
  themeSelect.addEventListener("change", (e) => {
    const theme = (e.target as HTMLSelectElement).value;
    localStorage.setItem("app-theme", theme);
    applyTheme(theme);
  });

  colorButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");
      if (color) {
        localStorage.setItem("note-header-color", color);
        currentColorPreview.style.backgroundColor = color;

        colorButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        document.dispatchEvent(
          new CustomEvent("headerColorChanged", { detail: { color } })
        );
      }
    });
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("app-theme");
    localStorage.removeItem("note-header-color");
    themeSelect.value = "auto";
    const defaultColor = "#45B7D1";
    currentColorPreview.style.backgroundColor = defaultColor;
    colorButtons.forEach((b) => b.classList.remove("active"));
    colorButtons.forEach((b) => {
      if (b.getAttribute("data-color") === defaultColor) {
        b.classList.add("active");
      }
    });
    applyTheme("auto");
    document.dispatchEvent(
      new CustomEvent("headerColorChanged", { detail: { color: defaultColor } })
    );
  });

  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  closeBtnFooter.addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  applyTheme(savedTheme);

  return modal;
}

function applyTheme(theme: string) {
  const htmlElement = document.documentElement;
  
  if (theme === "dark") {
    htmlElement.setAttribute("data-theme", "dark");
  } else if (theme === "light") {
    htmlElement.setAttribute("data-theme", "light");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    htmlElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  }
}

export function initializeTheme() {
  const savedTheme = localStorage.getItem("app-theme") || "auto";
  applyTheme(savedTheme);

  if (savedTheme === "auto") {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      const theme = localStorage.getItem("app-theme") || "auto";
      if (theme === "auto") {
        applyTheme("auto");
      }
    });
  }
}

initializeTheme();
