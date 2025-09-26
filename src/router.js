import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderNotes } from './pages/notes.js';
import { renderRegister } from './pages/register.js';
import { renderNoteEdit } from './pages/noteedit.js';

/**
 * Простая маршрутизация без перезагрузки.
 * Поддерживает pushState и обработку back/forward.
 */
export function initRouter(rootEl){
    const routes = {
        '/': renderDashboard,
        '/login': renderLogin,
        '/notes': renderNotes,
        '/register': renderRegister,
    };

    function renderPath(path){
        if (path.startsWith("/notes/")) {
            const id = path.split("/")[2];
            return rootEl.appendChild(renderNoteEdit({ id }));
        }
        const view = routes[path] || routes['/'];
        rootEl.innerHTML = '';
        rootEl.appendChild(view({}));
    }

    window.navigate = (path) => {
        history.pushState({}, '', path);
        renderPath(path);
    };

    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(renderDashboard());
    renderPath(location.pathname);
    window.addEventListener('popstate', ()=> renderPath(location.pathname));
    
}
