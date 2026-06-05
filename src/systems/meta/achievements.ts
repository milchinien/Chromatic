import type { MetaSave } from '../save/MetaSave';

// Achievements (R3) — rein statistik-basiert, kern-konform (kein Mana, keine
// Karten-Freischaltung). `isMet` prüft gegen den Meta-Save.

export interface Achievement {
  readonly id: string;
  readonly name: string;
  readonly desc: string;
  /** Bedingung gegen den Meta-Save. */
  readonly isMet: (m: MetaSave) => boolean;
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first_boss',
    name: 'Erstes Blut',
    desc: 'Besiege deinen ersten Boss.',
    isMet: (m) => m.bossesBeaten >= 1,
  },
  {
    id: 'reach_act3',
    name: 'Halle des Magierrats',
    desc: 'Erreiche Akt 3.',
    isMet: (m) => m.highestActReached >= 3,
  },
  {
    id: 'reach_act5',
    name: 'Unaufhaltsam',
    desc: 'Erreiche Akt 5.',
    isMet: (m) => m.highestActReached >= 5,
  },
  {
    id: 'slayer',
    name: 'Bosskiller',
    desc: 'Besiege insgesamt 10 Bosse.',
    isMet: (m) => m.bossesBeaten >= 10,
  },
  {
    id: 'veteran',
    name: 'Veteran',
    desc: 'Starte 5 Runs.',
    isMet: (m) => m.runsStarted >= 5,
  },
  {
    id: 'hoarder',
    name: 'Goldgräber',
    desc: 'Halte einmal 1000 Coins.',
    isMet: (m) => m.bestCoins >= 1000,
  },
  {
    id: 'explorer',
    name: 'Entdecker',
    desc: 'Besuche 20 Räume in einem Run.',
    isMet: (m) => m.bestRoomsVisited >= 20,
  },
];

export const achievementById = (id: string): Achievement | undefined =>
  ACHIEVEMENTS.find((a) => a.id === id);
