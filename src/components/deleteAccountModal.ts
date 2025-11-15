import ejs from 'ejs'

export function createDeleteAccountModal(): HTMLElement {
    const trash = new URL("../static/svg/icon_delete.svg", import.meta.url).href;

    const modalTemplate = `
        <div id="deleteAccountModal" class="exit-modal-overlay">
            <div class="exit-modal-content">
                <span id="closeModal" class="exit-modal-close">×</span>
                <p class="exit-modal-title"> Удаление аккаунта </p>
                <p class="exit-modal-text">После удаления восстановить аккаунт будет невозможно.</p>
                <div class="modal-buttons">
                    <button class="exit-modal-button delete-account-confirm"> 
                        <svg width="19" height="24" viewBox="0 0 19 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.33333 21.3333C1.33333 22.8 2.53333 24 4 24H14.6667C16.1333 24 17.3333 22.8 17.3333 21.3333V5.33333H1.33333V21.3333ZM18.6667 1.33333H14L12.6667 0H6L4.66667 1.33333H0V4H18.6667V1.33333Z" fill="white"/>
                        </svg>
                        Удалить</button>
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