import type { Card, CardClass, Color } from '../../domain/Card';

// =====================================================================
// 25 Karten — 5 Farben × 5 Klassen, exakt nach User-Anhang.
//
// Sichtbare Felder (Name, Mana, DMG, HP, Farbe, Klasse) sind 1:1 aus dem
// Anhang übernommen — KEINE Änderungen.
//
// Nicht-sichtbare Felder (Speed, Angriffstakt, Combo-Buffs) sind Code-
// Defaults pro Klasse/Farbe, damit das Combat-System läuft. Sie können
// in einer späteren Balance-Iteration zentral hier nachjustiert werden.
// =====================================================================

interface ClassDefaults {
  readonly attackInterval: number; // Sek. zwischen Angriffen
  readonly speed: number; // Pixel/Sek. auf dem Spielfeld
  readonly classBuff: Card['classBuff'];
}

const CLASS_DEFAULTS: Record<CardClass, ClassDefaults> = {
  krieger: { attackInterval: 1.0, speed: 50, classBuff: { damage: 3 } },
  festung: { attackInterval: 1.6, speed: 28, classBuff: { hp: 5 } },
  reittier: { attackInterval: 0.9, speed: 75, classBuff: { speed: 12 } },
  magier: { attackInterval: 1.3, speed: 38, classBuff: { damage: 2 } },
  heiler: { attackInterval: 1.4, speed: 45, classBuff: { hp: 3 } },
};

const COLOR_BUFF: Record<Color, Card['colorBuff']> = {
  krieg: { damage: 2 },
  natur: { hp: 3 },
  stein: { hp: 4 },
  untot: { damage: 2 },
  // Farblos hat per GAME_DESIGN keinen Color-Buff (löst nicht aus, empfängt keinen).
  farblos: {},
};

interface RowSpec {
  readonly cls: CardClass;
  readonly manaCost: number;
  readonly damage: number;
  readonly hp: number;
}

interface ColSpec {
  readonly color: Color;
  readonly suffix: string; // Color-spezifischer Name-Slot pro Klassen-Zeile
  readonly id: string;
}

// Eine Zeile = eine Klasse mit gleicher Mana/DMG/HP über alle 5 Farben.
const ROWS: ReadonlyArray<RowSpec & { readonly names: readonly { id: string; name: string }[] }> = [
  {
    cls: 'krieger',
    manaCost: 7,
    damage: 15,
    hp: 8,
    names: [
      { id: 'berserker', name: 'Berserker' },
      { id: 'waldlaeufer', name: 'Waldläufer' },
      { id: 'steinbrecher', name: 'Steinbrecher' },
      { id: 'grabwaechter', name: 'Grabwächter' },
      { id: 'soeldner', name: 'Söldner' },
    ],
  },
  {
    cls: 'festung',
    manaCost: 6,
    damage: 20,
    hp: 25,
    names: [
      { id: 'kriegsfeste', name: 'Kriegsfeste' },
      { id: 'wurzelbastion', name: 'Wurzelbastion' },
      { id: 'steinfestung', name: 'Steinfestung' },
      { id: 'totenzitadelle', name: 'Totenzitadelle' },
      { id: 'handelsposten', name: 'Handelsposten' },
    ],
  },
  {
    cls: 'reittier',
    manaCost: 5,
    damage: 12,
    hp: 10,
    names: [
      { id: 'kriegspferd', name: 'Kriegspferd' },
      { id: 'hirsch-des-waldes', name: 'Hirsch des Waldes' },
      { id: 'steinwolf', name: 'Steinwolf' },
      { id: 'knochenross', name: 'Knochenross' },
      { id: 'wanderkamel', name: 'Wanderkamel' },
    ],
  },
  {
    cls: 'magier',
    manaCost: 4,
    damage: 10,
    hp: 6,
    names: [
      { id: 'feuermagier', name: 'Feuermagier' },
      { id: 'waldweiser', name: 'Waldweiser' },
      { id: 'steinbeschwoerer', name: 'Steinbeschwörer' },
      { id: 'nekromant', name: 'Nekromant' },
      { id: 'zeitweiser', name: 'Zeitweiser' },
    ],
  },
  {
    cls: 'heiler',
    manaCost: 3,
    damage: 8,
    hp: 12,
    names: [
      { id: 'kriegssanitaeter', name: 'Kriegssanitäter' },
      { id: 'naturheiler', name: 'Naturheiler' },
      { id: 'steinhueter', name: 'Steinhüter' },
      { id: 'seelenheiler', name: 'Seelenheiler' },
      { id: 'gebetswirker', name: 'Gebetswirker' },
    ],
  },
];

const COLORS: readonly ColSpec[] = [
  { color: 'krieg', suffix: 'Krieg', id: 'krieg' },
  { color: 'natur', suffix: 'Natur', id: 'natur' },
  { color: 'stein', suffix: 'Stein', id: 'stein' },
  { color: 'untot', suffix: 'Untot', id: 'untot' },
  { color: 'farblos', suffix: 'Farblos', id: 'farblos' },
];

const buildCards = (): Card[] => {
  const out: Card[] = [];
  for (const row of ROWS) {
    const cd = CLASS_DEFAULTS[row.cls];
    row.names.forEach((entry, colIdx) => {
      const color = COLORS[colIdx]!.color;
      out.push({
        id: entry.id,
        name: entry.name,
        color,
        class: row.cls,
        manaCost: row.manaCost,
        stats: {
          damage: row.damage,
          attackInterval: cd.attackInterval,
          hp: row.hp,
          speed: cd.speed,
        },
        colorBuff: { ...COLOR_BUFF[color] },
        classBuff: { ...cd.classBuff },
        rarity: 'common',
      });
    });
  }
  return out;
};

export const ALL_CARDS: readonly Card[] = Object.freeze(buildCards());

export const cardById = (id: string): Card => {
  const c = ALL_CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
};
