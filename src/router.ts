import { renderLogin } from './pages/login';
import { renderRegister } from './pages/register';
import { renderDashboard } from './pages/dashboard';
import { renderNotes } from './pages/notes';
import { renderNoteEditor } from './pages/notepage';

interface Route {
  path: RegExp;
  cb: (...args: any[]) => void;
}

class Router {
  private routes: Route[] = [];
  private mode: 'history' | 'hash';
  private root: string;
  private current: string = '';
  private intervalId: number | null = null;

  constructor(options: { mode?: 'history' | 'hash'; root?: string } = {}) {
    this.mode = 'pushState' in window.history ? 'history' : 'hash';
    if (options.mode) this.mode = options.mode;
    this.root = options.root || '/';
    this.listen();
  }

  public add(path: RegExp, cb: (...args: any[]) => void): this {
    this.routes.push({ path, cb });
    return this;
  }

  public remove(path: RegExp): this {
    this.routes = this.routes.filter(route => route.path !== path);
    return this;
  }

  public flush(): this {
    this.routes = [];
    return this;
  }

  private clearSlashes(path: string): string {
    return path.replace(/\/$/, '').replace(/^\//, '');
  }

  private getFragment(): string {
    let fragment = '';
    if (this.mode === 'history') {
      fragment = this.clearSlashes(decodeURI(window.location.pathname + window.location.search));
      fragment = fragment.replace(/\?(.*)$/, '');
      fragment = this.root !== '/' ? fragment.replace(this.root, '') : fragment;
    } else {
      const match = window.location.href.match(/#(.*)$/);
      fragment = match?.[1] ?? '';
    }
    return this.clearSlashes(fragment);
  }

  public navigate(path: string = ''): this {
    if (this.mode === 'history') {
      window.history.pushState(null, '', this.root + this.clearSlashes(path));
    } else {
      window.location.href = `${window.location.href.replace(/#(.*)$/, '')}#${path}`;
    }
    return this;
  }

  private listen(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = window.setInterval(() => this.interval(), 50);
  }

  private interval = (): void => {
    const fragment = this.getFragment();
    if (this.current === fragment) return;
    this.current = fragment;

    this.routes.some(route => {
      const match = fragment.match(route.path);
      if (match) {
        match.shift();
        route.cb(...match);
        return true;
      }
      return false;
    });
  };
}

const router = new Router({ mode: 'history', root: '/' });

router
  .add(/^login$/, () => renderLogin(document.getElementById('app')!))
  .add(/^register$/, () => renderRegister(document.getElementById('app')!))
  .add(/^notes$/, () => renderNotes(document.getElementById('app')!))
  .add(/^note\/(\d+)$/, (id: string) => renderNoteEditor(document.getElementById('app')!, Number(id)))
  .add(/^note\/new$/, () => renderNoteEditor(document.getElementById('app')!, 'new'));

export default router;