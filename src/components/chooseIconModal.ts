import ejs from "ejs";
import { apiClient } from "../api/apiClient";

export async function chooseIconModal(
  event: MouseEvent,
  targetNoteId: number
): Promise<HTMLElement> {
  const icons = await apiClient.getIcons();

  const modalTemplate = `
    <div id="chooseIconModal" class="icon-menu">
        <div class="icon-menu-inner">
            <span id="closeModal" class="icon-menu-close">×</span>
            <div class="icon-list">
                <% icons.forEach(icon => { %>
                    <img src="<%= icon.url %>" class="icon-item" data-icon-id="<%= icon.id %>" data-icon-name="<%= icon.name %>" />
                <% }); %>
            </div>
        </div>
    </div>
`;

  const container = document.createElement("div");
  container.innerHTML = ejs.render(modalTemplate, { icons });
  const modal = container.firstElementChild as HTMLElement;

  modal.style.position = "absolute";
  modal.style.left = `${event.clientX + 10}px`;
  modal.style.top = `${event.clientY + 10}px`;

  modal.querySelectorAll(".icon-item").forEach((iconEl) => {
    iconEl.addEventListener("click", () => {
      const selectedIconId = iconEl.getAttribute("data-icon-id");
      const selectedIconUrl = iconEl.getAttribute("src");
      const selectedIconName = iconEl.getAttribute("data-icon-name");

      document.dispatchEvent(
        new CustomEvent("iconSelected", {
          detail: {
            iconId: selectedIconId,
            name: selectedIconName,
            url: selectedIconUrl,
            targetNoteId: targetNoteId,
          },
        })
      );
    });
  });

  modal.querySelector("#closeModal")?.addEventListener("click", () => {
    modal.remove();
  });

  setTimeout(() => {
    const closeOnClickOutside = (e: Event) => {
      if (!modal.contains(e.target as Node)) {
        modal.remove();
        document.removeEventListener("click", closeOnClickOutside);
      }
    };
    document.addEventListener("click", closeOnClickOutside);
  }, 0);

  return modal;
}
