import ejs from 'ejs';
import { apiClient } from '../api/apiClient';

export async function chooseIconModal(event: MouseEvent): Promise<HTMLElement> {
    const icons = await apiClient.getIcons();

    const modalTemplate = `
        <div id="chooseIconModal" class="icon-menu">
            <div class="icon-menu">
                <span id="closeModal" class="icon-menu-close">×</span>
                <div class="icon-list">
                    <% icons.forEach(icon => { %>
                        <img src="<%= icon.url %>" class="icon-item" data-icon-id="<%= icon.id %>" />
                    <% }); %>
                </div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = ejs.render(modalTemplate, { icons });
    const modal = container.firstElementChild as HTMLElement;

    modal.style.position = 'absolute';
    modal.style.left = `${event.clientX}px`;
    modal.style.top = `${event.clientY}px`;

    modal.querySelectorAll('.icon-item').forEach(iconEl => {
        iconEl.addEventListener('click', () => {
            const selectedIconId = iconEl.getAttribute('data-icon-id');
            document.dispatchEvent(new CustomEvent('iconSelected', { detail: { iconId: selectedIconId } }));
        });
    });

    modal.querySelector('#closeModal')?.addEventListener('click', () => {
        modal.remove();
    });

    return modal;
}