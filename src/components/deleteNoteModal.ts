export function createDeleteNoteModal(): HTMLElement {
    const modalTemplate = `
        <div id="deleteNoteModal" class="exit-modal-overlay">
            <div class="exit-modal-content">
                <span id="closeModal" class="exit-modal-close">×</span>
                <p class="exit-modal-text">Вы уверены, что хотите удалить эту заметку?</p>
                <button class="exit-modal-button delete-note-confirm">Удалить</button>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = modalTemplate;
    const modal = container.firstElementChild as HTMLElement;

    modal.querySelector('#closeModal')?.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    return modal;
}

export function createDeleteBlock(): HTMLElement {
    const modalTemplate = `
        <div id="deleteNoteBlock" class="exit-modal-overlay">
            <div class="exit-modal-content">
                <span id="closeModal" class="exit-modal-close">×</span>
                <p class="exit-modal-text">Вы уверены, что хотите удалить этот блок?</p>
                <button class="exit-modal-button delete-note-confirm">Удалить</button>
            </div>
        </div>
    `;
    const container = document.createElement('div');
    container.innerHTML = modalTemplate;
    const modal = container.firstElementChild as HTMLElement;

    modal.querySelector('#closeModal')?.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    return modal;
}