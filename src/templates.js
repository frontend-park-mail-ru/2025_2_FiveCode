/**
 * Небольшой шаблонизатор: создает DOM-фрагмент из строки
 * @param {string} html
 * @returns {HTMLElement}
 */
export function htmlToElement(html){
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();
  return wrapper.firstElementChild;
}
