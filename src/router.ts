import { renderLogin } from "./pages/login";
import { renderRegister } from "./pages/register";
import { renderNotes } from "./pages/notes";
import { renderNoteEditor } from "./pages/notepage";
import { renderSettingsPage } from "./pages/settings";
import { renderTechSupportPage } from "./pages/techsupport";

interface Route {
  path: RegExp;
  cb: (...args: any[]) => void;
}

class Router {
  private routes: Route[] = [];
  private mode: "history" | "hash";
  private root: string;
  private current: string = "";
  private started: boolean = false;

  constructor(options: { mode?: "history" | "hash"; root?: string } = {}) {
    this.mode = "pushState" in window.history ? "history" : "hash";
    if (options.mode) this.mode = options.mode;
    this.root = options.root || "/";
  }

  public add(path: RegExp, cb: (...args: any[]) => void): this {
    this.routes.push({ path, cb });
    return this;
  }

  public remove(path: RegExp): this {
    this.routes = this.routes.filter((route) => route.path !== path);
    return this;
  }

  public flush(): this {
    this.routes = [];
    return this;
  }

  private clearSlashes(path: string): string {
    return path.replace(/\/$/, "").replace(/^\//, "");
  }

  private getFragment(): string {
    let fragment = "";
    if (this.mode === "history") {
      fragment = this.clearSlashes(
        decodeURI(window.location.pathname + window.location.search)
      );
      fragment = fragment.replace(/\?(.*)$/, "");
      fragment = this.root !== "/" ? fragment.replace(this.root, "") : fragment;
    } else {
      const match = window.location.href.match(/#(.*)$/);
      fragment = match?.[1] ?? "";
    }
    return this.clearSlashes(fragment);
  }

  public navigate(path: string = ""): this {
    if (this.mode === "history") {
      window.history.pushState(null, "", this.root + this.clearSlashes(path));
      this.interval();
    } else {
      window.location.href = `${window.location.href.replace(
        /#(.*)$/,
        ""
      )}#${path}`;
    }
    return this;
  }

  private listen(): void {
    if (this.started) return;
    this.started = true;
    window.addEventListener("popstate", () => this.interval());
    setTimeout(() => this.interval(), 0);
  }

  public start(): void {
    if (this.started) {
      this.interval();
      return;
    }
    this.listen();
  }

  public stop(): void {
    if (!this.started) return;
    this.started = false;
    window.removeEventListener("popstate", () => this.interval());
  }

  private interval = (): void => {
    const fragment = this.getFragment();
    if (this.current === fragment && this.started) {
      const shouldRecheck = this.routes.some((route) =>
        fragment.match(route.path)
      );
      if (!shouldRecheck) return;
    }
    this.current = fragment;

    this.routes.some((route) => {
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

const router = new Router({ mode: "history", root: "/" });

router
  .add(/^$/, () => renderNotes())
  .add(/^login$/, () => renderLogin(document.getElementById("app")!))
  .add(/^register$/, () => renderRegister(document.getElementById("app")!))
  .add(/^notes$/, () => renderNotes())
  .add(/^note\/(\d+)$/, (id: string) => renderNoteEditor(Number(id)))
  .add(/^settings$/, () => renderSettingsPage())
  .add(/^techsupport$/, () => renderTechSupportPage());

export default router;
