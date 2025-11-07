import ejs from 'ejs';
import { Header } from '../components/header';
import { MainContent } from '../components/maincontent';
import { loadUser } from '../utils/session';
import { renderNotes } from './notes';
import { renderLogin } from './login';

interface User {
  id: number;
  username: string;
}

/**
 * Рендерит главную страницу 
 * @returns {HTMLElement} DOM-элемент главной страницы
 */
export function renderDashboard(app: HTMLElement) : void {
  app.innerHTML = '';
  const page = document.createElement('div');
  page.classList.add('page');
  const user: User = loadUser();
  const header = Header({user, app});
  const main = MainContent();

  page.appendChild(header);
  page.appendChild(main);

  app.appendChild(page);
}
