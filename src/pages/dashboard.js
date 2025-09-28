import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { MainContent } from '../components/maincontent.js';
import { loadUser } from '../utils/session.js';


/**
 * Рендерит главную страницу 
 * @returns {HTMLElement} DOM-элемент главной страницы
 */
export function renderDashboard() {
  const page = document.createElement('div');
  page.classList.add('page');
  const user = loadUser();
  const header = Header({user: user});
  const main = MainContent({});

  page.appendChild(header);
  // page.appendChild(welcome);
  page.appendChild(main);

  return page;
}
