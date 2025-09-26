import { htmlToElement } from '../templates.js';
import { Tabs } from '../components/tabs.js';
import { Forms } from '../components/forms.js';

export function Settings() {
  const el = htmlToElement(`<div class="page"></div>`);
  const tabs = Tabs({
    Profile: Forms({ type: 'profile' }),
    Password: Forms({ type: 'password' })
  });
  el.appendChild(tabs);
  return el;
}
