import type { Card, CardClass, PassiveEffect, UnitStats } from '../../domain/Card';

// =====================================================================
// 25 Karten — 5 Farben × 5 Klassen, exakt nach User-Anhang.
//
// Sichtbare Felder (Name, Mana, DMG, HP, Farbe, Klasse) sind 1:1 aus dem
// Anhang übernommen — KEINE Änderungen.
//
// Combo-Buffs (colorBuff / classBuff) und Passives stehen gemäß GAME_DESIGN
// §6.4 (Punkt 5 + 6) PRO KARTE fest — es gibt KEINE globalen Default-Tabellen
// mehr. attackInterval & speed bleiben Klassen-Defaults (reine Stat-Filler,
// nicht sichtbar im Anhang).
// =====================================================================

interface ClassStatDefaults {
  readonly attackInterval: number; // Sek. zwischen Angriffen
  readonly speed: number; // Pixel/Sek. auf dem Spielfeld
}

const CLASS_STAT_DEFAULTS: Record<CardClass, ClassStatDefaults> = {
  krieger: { attackInterval: 1.0, speed: 50 },
  festung: { attackInterval: 1.6, speed: 28 },
  reittier: { attackInterval: 0.9, speed: 75 },
  magier: { attackInterval: 1.3, speed: 38 },
  heiler: { attackInterval: 1.4, speed: 45 },
};

// --- Passive-Fabriken (GAME_DESIGN §6.4 Punkt 5) -------------------------
// Alle Effekte modifizieren currentHp / baseStats / pendingSpawns — NIE u.buffs,
// damit sie nicht von der Combo-Aura-Recompute (die buffs={} setzt) überschrieben
// werden oder sich über Ticks aufaddieren.

const dist = (ax: number, ay: number, bx: number, by: number): number =>
  Math.hypot(ax - bx, ay - by);

/** Heiler: heilt befreundete Units (inkl. sich selbst) im Radius pro Sekunde. */
const healAura = (radius: number, perSec: number): PassiveEffect => ({
  trigger: 'onTick',
  apply: (self, state, dt) => {
    for (const o of state.units) {
      if (!o.alive || o.side !== self.side) continue;
      if (dist(self.x, self.y, o.x, o.y) <= radius) {
        o.currentHp = Math.min(o.baseStats.hp, o.currentHp + perSec * dt);
      }
    }
  },
});

/** Magier: AoE — schadet gegnerischen Units im Radius pro Sekunde. */
const damageAura = (radius: number, perSec: number): PassiveEffect => ({
  trigger: 'onTick',
  apply: (self, state, dt) => {
    for (const o of state.units) {
      if (!o.alive || o.side === self.side) continue;
      if (dist(self.x, self.y, o.x, o.y) <= radius) {
        o.currentHp -= perSec * dt;
      }
    }
  },
});

/** Festung: repariert die eigene HP langsam (Bollwerk). */
const selfRepair = (perSec: number): PassiveEffect => ({
  trigger: 'onTick',
  apply: (self, _state, dt) => {
    self.currentHp = Math.min(self.baseStats.hp, self.currentHp + perSec * dt);
  },
});

/** Krieger: unter 50 % HP steigt der Grund-Damage dauerhaft (Berserker-Wut). */
const rageOnLowHp = (mult: number): PassiveEffect => ({
  trigger: 'onHpThreshold',
  hpThreshold: 0.5,
  apply: (self) => {
    self.baseStats.damage = Math.round(self.baseStats.damage * mult);
  },
});

/** Reittier: unter 50 % HP beschleunigt die Unit (Panik-Galopp / Evasion). */
const sprintOnLowHp = (bonus: number): PassiveEffect => ({
  trigger: 'onHpThreshold',
  hpThreshold: 0.5,
  apply: (self) => {
    self.baseStats.speed += bonus;
  },
});

/** Nekromant: beim Tod erhebt sich ein Skelett am Sterbeort (Dark Magic). */
const raiseSkeletonOnDeath: PassiveEffect = {
  trigger: 'onDeath',
  apply: (self, state) => {
    state.pendingSpawns.push({ card: SKELETT, side: self.side, x: self.x, y: self.y });
  },
};

// --- Per-Karte: Combo-Buffs + Passive (§6.4 Punkt 5 + 6) ----------------
// Farb-Identität: krieg/untot → Damage-Buff, natur/stein → HP-Buff, farblos → kein
// Color-Buff (§6.5). Magnitude variiert pro Karte → echte kartenspezifische Werte.

interface CardSpec {
  readonly colorBuff: Partial<UnitStats>;
  readonly classBuff: Partial<UnitStats>;
  readonly passive: PassiveEffect;
}

const CARD_SPECS: Record<string, CardSpec> = {
  // Krieger — Class-Buff: Damage · Passive: Berserker-Wut
  berserker: { colorBuff: { damage: 5 }, classBuff: { damage: 5 }, passive: rageOnLowHp(1.5) },
  waldlaeufer: { colorBuff: { hp: 5 }, classBuff: { damage: 4 }, passive: rageOnLowHp(1.5) },
  steinbrecher: { colorBuff: { hp: 6 }, classBuff: { damage: 4 }, passive: rageOnLowHp(1.5) },
  grabwaechter: { colorBuff: { damage: 4 }, classBuff: { damage: 4 }, passive: rageOnLowHp(1.5) },
  soeldner: { colorBuff: {}, classBuff: { damage: 4 }, passive: rageOnLowHp(1.5) },

  // Festung — Class-Buff: HP · Passive: Selbst-Reparatur
  kriegsfeste: { colorBuff: { damage: 4 }, classBuff: { hp: 8 }, passive: selfRepair(2.5) },
  wurzelbastion: { colorBuff: { hp: 8 }, classBuff: { hp: 8 }, passive: selfRepair(2.5) },
  steinfestung: { colorBuff: { hp: 10 }, classBuff: { hp: 10 }, passive: selfRepair(3) },
  totenzitadelle: { colorBuff: { damage: 3 }, classBuff: { hp: 8 }, passive: selfRepair(2.5) },
  handelsposten: { colorBuff: {}, classBuff: { hp: 8 }, passive: selfRepair(2.5) },

  // Reittier — Class-Buff: Speed · Passive: Panik-Galopp
  kriegspferd: { colorBuff: { damage: 4 }, classBuff: { speed: 14 }, passive: sprintOnLowHp(25) },
  'hirsch-des-waldes': { colorBuff: { hp: 5 }, classBuff: { speed: 14 }, passive: sprintOnLowHp(25) },
  steinwolf: { colorBuff: { hp: 6 }, classBuff: { speed: 12 }, passive: sprintOnLowHp(25) },
  knochenross: { colorBuff: { damage: 4 }, classBuff: { speed: 14 }, passive: sprintOnLowHp(25) },
  wanderkamel: { colorBuff: {}, classBuff: { speed: 14 }, passive: sprintOnLowHp(25) },

  // Magier — Class-Buff: Damage · Passive: AoE-Aura (Nekromant: onDeath-Skelett)
  feuermagier: { colorBuff: { damage: 4 }, classBuff: { damage: 3 }, passive: damageAura(70, 4) },
  waldweiser: { colorBuff: { hp: 5 }, classBuff: { damage: 3 }, passive: damageAura(70, 4) },
  steinbeschwoerer: { colorBuff: { hp: 6 }, classBuff: { damage: 3 }, passive: damageAura(70, 4) },
  nekromant: { colorBuff: { damage: 5 }, classBuff: { damage: 3 }, passive: raiseSkeletonOnDeath },
  zeitweiser: { colorBuff: {}, classBuff: { damage: 3 }, passive: damageAura(70, 4) },

  // Heiler — Class-Buff: HP · Passive: Heil-Aura
  kriegssanitaeter: { colorBuff: { damage: 3 }, classBuff: { hp: 5 }, passive: healAura(90, 3) },
  naturheiler: { colorBuff: { hp: 6 }, classBuff: { hp: 5 }, passive: healAura(90, 3) },
  steinhueter: { colorBuff: { hp: 7 }, classBuff: { hp: 5 }, passive: healAura(90, 3) },
  seelenheiler: { colorBuff: { damage: 3 }, classBuff: { hp: 5 }, passive: healAura(90, 3) },
  gebetswirker: { colorBuff: {}, classBuff: { hp: 5 }, passive: healAura(90, 3) },
};

interface RowSpec {
  readonly cls: CardClass;
  readonly manaCost: number;
  readonly damage: number;
  readonly hp: number;
}

// Eine Zeile = eine Klasse mit gleicher Mana/DMG/HP über alle 5 Farben.
const ROWS: ReadonlyArray<
  RowSpec & { readonly names: readonly { id: string; name: string; color: Card['color'] }[] }
> = [
  {
    cls: 'krieger',
    manaCost: 7,
    damage: 15,
    hp: 8,
    names: [
      { id: 'berserker', name: 'Berserker', color: 'krieg' },
      { id: 'waldlaeufer', name: 'Waldläufer', color: 'natur' },
      { id: 'steinbrecher', name: 'Steinbrecher', color: 'stein' },
      { id: 'grabwaechter', name: 'Grabwächter', color: 'untot' },
      { id: 'soeldner', name: 'Söldner', color: 'farblos' },
    ],
  },
  {
    cls: 'festung',
    manaCost: 6,
    damage: 20,
    hp: 25,
    names: [
      { id: 'kriegsfeste', name: 'Kriegsfeste', color: 'krieg' },
      { id: 'wurzelbastion', name: 'Wurzelbastion', color: 'natur' },
      { id: 'steinfestung', name: 'Steinfestung', color: 'stein' },
      { id: 'totenzitadelle', name: 'Totenzitadelle', color: 'untot' },
      { id: 'handelsposten', name: 'Handelsposten', color: 'farblos' },
    ],
  },
  {
    cls: 'reittier',
    manaCost: 5,
    damage: 12,
    hp: 10,
    names: [
      { id: 'kriegspferd', name: 'Kriegspferd', color: 'krieg' },
      { id: 'hirsch-des-waldes', name: 'Hirsch des Waldes', color: 'natur' },
      { id: 'steinwolf', name: 'Steinwolf', color: 'stein' },
      { id: 'knochenross', name: 'Knochenross', color: 'untot' },
      { id: 'wanderkamel', name: 'Wanderkamel', color: 'farblos' },
    ],
  },
  {
    cls: 'magier',
    manaCost: 4,
    damage: 10,
    hp: 6,
    names: [
      { id: 'feuermagier', name: 'Feuermagier', color: 'krieg' },
      { id: 'waldweiser', name: 'Waldweiser', color: 'natur' },
      { id: 'steinbeschwoerer', name: 'Steinbeschwörer', color: 'stein' },
      { id: 'nekromant', name: 'Nekromant', color: 'untot' },
      { id: 'zeitweiser', name: 'Zeitweiser', color: 'farblos' },
    ],
  },
  {
    cls: 'heiler',
    manaCost: 3,
    damage: 8,
    hp: 12,
    names: [
      { id: 'kriegssanitaeter', name: 'Kriegssanitäter', color: 'krieg' },
      { id: 'naturheiler', name: 'Naturheiler', color: 'natur' },
      { id: 'steinhueter', name: 'Steinhüter', color: 'stein' },
      { id: 'seelenheiler', name: 'Seelenheiler', color: 'untot' },
      { id: 'gebetswirker', name: 'Gebetswirker', color: 'farblos' },
    ],
  },
];

const buildCards = (): Card[] => {
  const out: Card[] = [];
  for (const row of ROWS) {
    const cd = CLASS_STAT_DEFAULTS[row.cls];
    for (const entry of row.names) {
      const spec = CARD_SPECS[entry.id];
      if (!spec) throw new Error(`Missing CardSpec for ${entry.id}`);
      out.push({
        id: entry.id,
        name: entry.name,
        color: entry.color,
        class: row.cls,
        manaCost: row.manaCost,
        stats: {
          damage: row.damage,
          attackInterval: cd.attackInterval,
          hp: row.hp,
          speed: cd.speed,
        },
        colorBuff: { ...spec.colorBuff },
        classBuff: { ...spec.classBuff },
        passive: spec.passive,
        rarity: 'common',
      });
    }
  }
  return out;
};

// Beschwörbares Skelett des Nekromanten — NICHT im Deck/Pool, nur via onDeath.
// Schwach, ohne eigene Combo-Buffs/Passive (verhindert Beschwörungs-Ketten).
const SKELETT: Card = {
  id: 'skelett',
  name: 'Skelett',
  color: 'untot',
  class: 'krieger',
  manaCost: 0,
  stats: { damage: 5, attackInterval: 1.1, hp: 6, speed: 55 },
  colorBuff: {},
  classBuff: {},
  rarity: 'common',
};

export const ALL_CARDS: readonly Card[] = Object.freeze(buildCards());

export const cardById = (id: string): Card => {
  const c = ALL_CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
};
