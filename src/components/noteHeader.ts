import ejs from "ejs";

const ICONS = {
  trash: new URL("../static/svg/icon_delete.svg", import.meta.url).href,
  star: new URL("../static/svg/icon_star.svg", import.meta.url).href,
  filled_star: new URL("../static/svg/icon_favorite.svg", import.meta.url).href,
  clear: new URL("../static/svg/icon_clear_format.svg", import.meta.url).href,
  dots: new URL("../static/svg/icon_dots_grey.svg", import.meta.url).href,
  share: new URL("../static/svg/icon_share.svg", import.meta.url).href,
  pdf: new URL("../static/svg/icon_pdf.svg", import.meta.url).href,
};

interface NoteHeaderProps {
  title: string;
  isFavorite: boolean;
}

type MenuAction = "share" | "export" | "delete";

const template = `
<header class="note-header">
  <div class="note-header__left">
    <h1 class="note-header__title"><%= title %></h1>
  </div>

  <div class="note-header__right">
    <button class="note-header__btn note-header__star <%= isFavorite ? 'active' : '' %>" title="Избранное">
      <img src="${ICONS.star}" style="width:20px; height:20px;" alt="">
    </button>

    <button class="note-header__btn note-header__menu" title="Меню">
      <img src="${ICONS.dots}" style="width:26px; height:26px;" alt="">
    </button>

    <div class="note-header__dropdown">
      <button class="note-header__dropdown-item"data-action="share">
      <img src="${ICONS.share}" alt="" style="width:16px; height:16px; margin-right:8px; vertical-align:middle;">
        Поделиться
      </button>
      <button class="note-header__dropdown-item" data-action="export">
        <img src="${ICONS.pdf}" alt="" style="width:16px; height:16px; margin-right:8px; vertical-align:middle;">
        Экспорт
      </button>
      <button class="note-header__dropdown-item danger" data-action="delete">
        <img src="${ICONS.trash}" alt="" style="width:16px; height:16px; margin-right:8px; vertical-align:middle;">
        Удалить
      </button>
    </div>
  </div>
</header>
`;

export function renderNoteHeader(
  container: HTMLElement,
  props: NoteHeaderProps
) {
  container.innerHTML = ejs.render(template, props);

  const root = container.querySelector(".note-header") as HTMLElement;
  if (!root) return;

  const starBtn = root.querySelector<HTMLButtonElement>(
    ".note-header__star"
  );
  const menuBtn = root.querySelector<HTMLButtonElement>(
    ".note-header__menu"
  );
  const dropdown = root.querySelector<HTMLElement>(
    ".note-header__dropdown"
  );

  if (!starBtn || !menuBtn || !dropdown) return;

  starBtn.addEventListener("click", () => {
    starBtn.classList.toggle("active");

    root.dispatchEvent(
      new CustomEvent("noteFavoriteToggled", {
        bubbles: true,
        detail: {
          active: starBtn.classList.contains("active"),
        },
      })
    );
  });

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("visible");
  });

  dropdown.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const action = target.getAttribute("data-action") as MenuAction | null;

    if (!action) return;

    dropdown.classList.remove("visible");

    root.dispatchEvent(
      new CustomEvent("noteMenuAction", {
        bubbles: true,
        detail: { action },
      })
    );
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("visible");
  });
}
