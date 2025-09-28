import { htmlToElement } from '../templates.js';

/**
 * Создаёт DOM-элемент приветственного блока
 * @returns {HTMLElement} DOM-элемент welcome
 */
export function MainContent() {
  const el = htmlToElement(`
    <div class="welcome" id="welcome">
        <h1>Добро Пожаловать</h1>
    </div>
  `);

  return el;
}
