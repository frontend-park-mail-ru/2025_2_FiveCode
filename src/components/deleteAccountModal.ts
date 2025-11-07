export function createDeleteAccountModal(): HTMLElement {
    const modalTemplate = `
        <div id="deleteAccountModal" class="exit-modal-overlay">
            <div class="exit-modal-content">
                <span id="closeModal" class="exit-modal-close">×</span>
                <p class="exit-modal-text">Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.</p>
                <div class="modal-buttons">
                    <button class="exit-modal-button delete-account-confirm" style="background-color: red; color: white;">Удалить</button>
                    <button class="exit-modal-button cancel-button">Отмена</button>
                </div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = modalTemplate;
    const modal = container.firstElementChild as HTMLElement;

    modal.querySelector('#closeModal')?.addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('.cancel-button')?.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    return modal;
}