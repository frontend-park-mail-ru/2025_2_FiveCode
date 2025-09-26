import { htmlToElement } from '../templates.js';

/**
 * Tabs компонент для Settings
 */
export function Tabs(tabs) {
  const el = htmlToElement(`<div class="tabs"></div>`);
  const content = htmlToElement(`<div class="tabs__content"></div>`);

  Object.entries(tabs).forEach(([label, node]) => {
    const btn = htmlToElement(`<button class="tabs__btn">${label}</button>`);
    btn.addEventListener('click', () => {
      content.innerHTML = '';
      content.appendChild(node);
    });
    el.appendChild(btn);
  });

  el.appendChild(content);
  return el;
}
