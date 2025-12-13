import ejs from 'ejs'

export function chooseIconModal(): HTMLElement {
    const modalTemplate = `
        <div id="chooseIconModal" class="icon-menu">
            <div class="icon-menu">
                <span id="closeModal" class="icon-menu">×</span>
                
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