import ejs from "ejs";
import { apiClient } from "../api/apiClient";

export async function chooseIconModal(
  event: MouseEvent,
  targetNoteId: number,
  currentIconId?: number | null
): Promise<HTMLElement> {
  const existingModal = document.getElementById("chooseIconModal");
  if (existingModal) {
    existingModal.remove();
  }

  const icons = await apiClient.getIcons();

  const modalTemplate = `
    <div id="chooseIconModal" class="icon-menu">
        <div class="icon-menu-inner">
            <span id="closeModal" class="icon-menu-close">×</span>
            <div class="icon-list">
                <% icons.forEach(icon => { %>
                    <img 
                      src="<%= icon.url %>" 
                      class="icon-item <%= icon.id === currentIconId ? 'selected' : '' %>" 
                      data-icon-id="<%= icon.id %>" 
                      data-icon-name="<%= icon.name %>" 
                    />
                <% }); %>
            </div>
        </div>
    </div>
`;

  const container = document.createElement("div");
  container.innerHTML = ejs.render(modalTemplate, { icons, currentIconId });
  const modal = container.firstElementChild as HTMLElement;

  const left = Math.min(event.clientX + 10, window.innerWidth - 330);
  const top = Math.min(event.clientY + 10, window.innerHeight - 310);

  modal.style.position = "absolute";
  modal.style.position = "fixed";
  modal.style.left = `${left}px`;
  modal.style.top = `${top}px`;

  modal.querySelectorAll(".icon-item").forEach((iconEl) => {
    iconEl.addEventListener("click", () => {
      const selectedIconId = iconEl.getAttribute("data-icon-id");
      const selectedIconUrl = iconEl.getAttribute("src");
      const selectedIconName = iconEl.getAttribute("data-icon-name");

      document.dispatchEvent(
        new CustomEvent("iconSelected", {
          detail: {
            iconId: Number(selectedIconId),
            name: selectedIconName,
            url: selectedIconUrl,
            targetNoteId: targetNoteId,
          },
        })
      );

      modal.remove();
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
