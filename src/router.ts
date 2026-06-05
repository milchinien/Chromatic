/**
 * Mini-Screen-Router. Jeder Screen ist eine reine Funktion:
 *   (host: HTMLElement, ctx: ScreenCtx) => void | Cleanup
 *
 * Beim Screen-Wechsel wird der host geleert und der nächste Screen montiert.
 * Cleanup-Funktionen (z.B. document-Listener) werden vorher aufgerufen.
 *
 * Übergänge: Statt harter Schnitte wird zwischen zwei Screens ein dunkles
 * Overlay (.cm-transition) kurz ein- und wieder ausgeblendet. Der Screen-Tausch
 * passiert unter voller Deckung, sodass der Wechsel ruhig statt abrupt wirkt.
 * Der allererste Mount (Boot) läuft ohne Fade — es gibt keinen Vorgänger.
 */

export interface ScreenCtx {
  go: (name: string) => void;
}

export type Cleanup = () => void;
export type Screen = (host: HTMLElement, ctx: ScreenCtx) => void | Cleanup;

// Dauer der Fade-Phase. Muss mit der CSS-Transition auf .cm-transition (styles.css)
// übereinstimmen, damit der Tausch genau bei voller Deckung passiert.
const FADE_MS = 180;

class Router {
  private screens = new Map<string, Screen>();
  private host: HTMLElement | null = null;
  private currentCleanup: Cleanup | null = null;
  private overlay: HTMLElement | null = null;
  private booted = false;
  private transitioning = false;
  /** Ziel, das während eines laufenden Übergangs angefordert wurde. */
  private pending: string | null = null;

  register(name: string, screen: Screen): void {
    this.screens.set(name, screen);
  }

  mount(host: HTMLElement): void {
    this.host = host;
    if (!this.overlay) {
      const el = document.createElement('div');
      el.className = 'cm-transition';
      document.body.appendChild(el);
      this.overlay = el;
    }
  }

  private mountScreen(screen: Screen): void {
    this.currentCleanup?.();
    this.currentCleanup = null;
    this.host!.replaceChildren();
    const cleanup = screen(this.host!, { go: (n) => this.go(n) });
    if (cleanup) this.currentCleanup = cleanup;
  }

  go(name: string): void {
    if (!this.host) throw new Error('Router not mounted');
    const screen = this.screens.get(name);
    if (!screen) throw new Error(`Unknown screen: ${name}`);

    // Boot: kein Vorgänger → sofort montieren, kein Fade.
    if (!this.booted) {
      this.booted = true;
      this.mountScreen(screen);
      return;
    }

    // Läuft schon ein Übergang (z.B. ein Screen ruft beim Mounten ctx.go zur
    // Weiterleitung), merken wir uns nur das jüngste Ziel.
    if (this.transitioning) {
      this.pending = name;
      return;
    }

    this.transitioning = true;
    const ov = this.overlay!;
    ov.classList.add('cm-transition--active');

    window.setTimeout(() => {
      this.mountScreen(screen);
      ov.classList.remove('cm-transition--active');
      this.transitioning = false;
      if (this.pending) {
        const next = this.pending;
        this.pending = null;
        this.go(next);
      }
    }, FADE_MS);
  }
}

export const router = new Router();
