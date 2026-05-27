import type { RunState } from '../../domain/Run';
import type { Encounter } from '../data/encounters';

// Singleton-State, der zwischen DOM-Screens persistiert. Der Router unterstützt
// kein Daten-Passing, daher kapseln wir den aktuellen Run hier. Bei Game-Over
// oder Sieg wird `clearCurrentRun()` aufgerufen, sodass das Hauptmenü
// sauber neu starten kann.

let active: RunState | null = null;
let activeEncounter: Encounter | null = null;

export const getCurrentRun = (): RunState | null => active;
export const setCurrentRun = (run: RunState | null): void => {
  active = run;
};
export const clearCurrentRun = (): void => {
  active = null;
  activeEncounter = null;
};

export const getActiveEncounter = (): Encounter | null => activeEncounter;
export const setActiveEncounter = (enc: Encounter | null): void => {
  activeEncounter = enc;
};
