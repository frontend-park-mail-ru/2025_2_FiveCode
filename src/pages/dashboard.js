import { htmlToElement } from '../templates.js';
import { Header } from '../components/header.js';
import { MainContent } from '../components/maincontent.js';

export function renderDashboard() {
  const page = document.createElement('div');
  page.classList.add('page');

  const header = Header();
  const main = MainContent({});

  page.appendChild(header);
  // page.appendChild(welcome);
  page.appendChild(main);

  return page;
}
