import { apiClient } from "../api/apiClient";
import router from "../router";
import { handleError } from "../utils/errorHandler";

interface SearchResult {
  id?: number;
  note_id?: number;
  title: string;
  highlighted_title?: string;
  parent_note_id?: number | null;
}

export function createSearchModal(): HTMLElement {
  const modalTemplate = `
    <div id="searchModal" class="search-modal-overlay">
      <div class="search-modal-content">
        <span id="closeSearchModal" class="search-modal-close">×</span>
        <p class="search-modal-title">Поиск по заметкам</p>
        <input 
          type="text" 
          class="search-modal-input" 
          id="searchInput" 
          placeholder="Введите текст для поиска..."
          autocomplete="off"
        />
        <div class="search-modal-results" id="searchResults"></div>
        <button class="search-modal-button" id="searchButton">Поиск</button>
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = modalTemplate;
  const modal = container.firstElementChild as HTMLElement;

  const searchInput = modal.querySelector("#searchInput") as HTMLInputElement;
  const searchButton = modal.querySelector("#searchButton") as HTMLButtonElement;
  const resultsContainer = modal.querySelector("#searchResults") as HTMLElement;
  const closeBtn = modal.querySelector("#closeSearchModal") as HTMLElement;

  closeBtn.addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  searchButton.addEventListener("click", performSearch);

  searchInput.addEventListener("input", () => {
    if (searchInput.value.length > 2) {
      performSearch();
    } else {
      resultsContainer.innerHTML = "";
    }
  });

  async function performSearch() {
    const query = searchInput.value.trim();

    if (!query) {
      resultsContainer.innerHTML = '';
      return;
    }

    try {
      const response: any = await apiClient.searchNotes(query);
      let results = Array.isArray(response) ? response : (response?.results || response?.notes || response?.data || []);
      displayResults(results);
    } catch (err) {
      handleError(err, "Ошибка при поиске");
      resultsContainer.innerHTML = '<p style="color: var(--danger);">Ошибка при поиске</p>';
    }
  }

  function displayResults(results: SearchResult[]) {
    resultsContainer.innerHTML = "";

    if (!Array.isArray(results)) {
      resultsContainer.innerHTML = '<p style="color: #999;">Некорректный формат ответа</p>';
      return;
    }

    if (results.length === 0) {
      resultsContainer.innerHTML = '<p style="color: #999;">Ничего не найдено</p>';
      return;
    }

    const resultsList = document.createElement("ul");
    resultsList.style.listStyle = "none";
    resultsList.style.padding = "0";
    resultsList.style.margin = "0 0 12px 0";

    results.slice(0, 5).forEach((result: SearchResult) => {
      const li = document.createElement("li");
      li.style.padding = "8px 10px";
      li.style.borderRadius = "6px";
      li.style.cursor = "pointer";
      li.style.backgroundColor = "rgba(74, 144, 226, 0.1)";
      li.style.marginBottom = "6px";
      li.style.transition = "background-color 0.2s";

      const link = document.createElement("a");
      link.href = `/note/${result.id || result.note_id}`;
      link.style.textDecoration = "none";
      link.style.color = "inherit";
      link.style.display = "block";
      link.dataset.link = "";
      
      const titleText = result.title || "Без названия";
      link.innerHTML = result.highlighted_title || titleText;

      li.appendChild(link);

      li.addEventListener("mouseenter", () => {
        li.style.backgroundColor = "rgba(74, 144, 226, 0.2)";
      });

      li.addEventListener("mouseleave", () => {
        li.style.backgroundColor = "rgba(74, 144, 226, 0.1)";
      });

      li.addEventListener("click", () => {
        router.navigate(`/note/${result.id || result.note_id}`);
        modal.remove();
      });

      resultsList.appendChild(li);
    });

    resultsContainer.appendChild(resultsList);

    if (results.length > 5) {
      const moreInfo = document.createElement("p");
      moreInfo.style.fontSize = "12px";
      moreInfo.style.color = "#999";
      moreInfo.textContent = `Показано 5 из ${results.length} результатов`;
      resultsContainer.appendChild(moreInfo);
    }
  }

  setTimeout(() => searchInput.focus(), 100);

  return modal;
}
