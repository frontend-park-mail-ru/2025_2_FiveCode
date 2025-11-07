import ejs from 'ejs';

/**
 * Создаёт DOM-элемент приветственного блока
 * @returns {HTMLElement} DOM-элемент welcome
 */
export function MainContent() {
  const html = ejs.render(`
    <div class="welcome" id="welcome">
      <h1>Добро Пожаловать</h1>
    </div>
  `, {});

  const container = document.createElement('div');
  container.innerHTML = html;
  return container.firstElementChild as HTMLElement;
}
