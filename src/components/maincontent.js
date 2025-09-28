import { htmlToElement } from '../templates.js';

/**
 * MainContent of dashboard
 */
export function MainContent() {
  const el = htmlToElement(`
    <div class="welcome" id="welcome">
        <h1>WELCOME</h1>
    </div>
  `);

  return el;
}
