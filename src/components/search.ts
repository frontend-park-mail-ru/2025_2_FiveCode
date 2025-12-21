import { apiClient } from "../api/apiClient";
import router from "../router";
import { handleError } from "../utils/errorHandler";

interface SearchResult {
  note_id: number;
  title: string;
  highlighted_title?: string;
  content_snippet?: string;
  rank?: number;
  updated_at?: string;
}

export function createSearchModal(): HTMLElement {
  const modalTemplate = `
    <div id="searchModal" class="search-modal-overlay">
      <div class="search-modal-content">
        <div class="search-modal-header">
            <span class="search-icon">🔍</span>
            <input 
            type="text" 
            class="search-modal-input" 
            id="searchInput" 
            placeholder="Поиск по заметкам..."
            autocomplete="off"
            />
        </div>
        
        <div class="search-modal-results" id="searchResults">
            <div class="search-placeholder">Введите текст для поиска...</div>
        </div>
      </div>
    </div>
  `;

  const container = document.createElement("div");
  container.innerHTML = modalTemplate;
  const modal = container.firstElementChild as HTMLElement;

  const searchInput = modal.querySelector("#searchInput") as HTMLInputElement;
  const resultsContainer = modal.querySelector("#searchResults") as HTMLElement;

  const close = () => modal.remove();

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      close();
    }
  });

  document.addEventListener("keydown", function handleEsc(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", handleEsc);
    }
  });

  let debounceTimeout: NodeJS.Timeout;

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    const query = searchInput.value.trim();

    if (query.length === 0) {
      resultsContainer.innerHTML =
        '<div class="search-placeholder">Введите текст для поиска...</div>';
      return;
    }

    debounceTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });

  async function performSearch(query: string) {
    try {
      const response: any = await apiClient.searchNotes(query);
      const results = Array.isArray(response)
        ? response
        : response?.results || [];
      displayResults(results);
    } catch (err) {
      console.error(err);
      resultsContainer.innerHTML =
        '<div class="search-placeholder error">Ошибка при поиске</div>';
    }
  }

  function displayResults(results: SearchResult[]) {
    resultsContainer.innerHTML = "";

    if (results.length === 0) {
      resultsContainer.innerHTML =
        '<div class="search-placeholder">Ничего не найдено</div>';
      return;
    }

    const resultsList = document.createElement("div");
    resultsList.className = "search-list";

    results.forEach((result: SearchResult) => {
      const item = document.createElement("div");
      item.className = "search-list-item";

      const titleHtml =
        result.highlighted_title || result.title || "Без названия";
      const snippetHtml = result.content_snippet || "";

      item.innerHTML = `
        <div class="search-item-icon">📄</div>
        <div class="search-item-content">
            <div class="search-item-title">${titleHtml}</div>
            ${snippetHtml ? `<div class="search-item-snippet">${snippetHtml}</div>` : ""}
        </div>
      `;

      item.addEventListener("click", () => {
        router.navigate(`/note/${result.note_id}`);
        close();
      });

      resultsList.appendChild(item);
    });

    resultsContainer.appendChild(resultsList);
  }

  setTimeout(() => searchInput.focus(), 50);

  return modal;
}
