/**
 * Mini-Screen-Router. Jeder Screen ist eine reine Funktion:
 *   (host: HTMLElement, ctx: ScreenCtx) => void | Cleanup
 *
 * Beim Screen-Wechsel wird der host geleert und der nächste Screen montiert.
 * Cleanup-Funktionen (z.B. document-Listener) werden vorher aufgerufen.
 */

export interface ScreenCtx {
  go: (name: string) => void;
}

export type Cleanup = () => void;
export type Screen = (host: HTMLElement, ctx: ScreenCtx) => void | Cleanup;

class Router {
  private screens = new Map<string, Screen>();
  private host: HTMLElement | null = null;
  private currentCleanup: Cleanup | null = null;

  register(name: string, screen: Screen): void {
    this.screens.set(name, screen);
  }

  mount(host: HTMLElement): void {
    this.host = host;
  }

  go(name: string): void {
    if (!this.host) throw new Error('Router not mounted');
    const screen = this.screens.get(name);
    if (!screen) throw new Error(`Unknown screen: ${name}`);

    this.currentCleanup?.();
    this.currentCleanup = null;
    this.host.replaceChildren();

    const cleanup = screen(this.host, { go: (n) => this.go(n) });
    if (cleanup) this.currentCleanup = cleanup;
  }
}

export const router = new Router();
