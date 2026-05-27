import type { Card } from '../../domain/Card';
import type { Unit } from '../../domain/Unit';
import type { CombatState } from '../combat/CombatState';

// Hardcoded Karten-Set für Phase 2. Alle 5 Farben und alle 5 Klassen sind
// mindestens 2× vertreten, damit Combos sich tatsächlich auslösen lassen.
//
// Stats grob nach Mana-Kosten skaliert: 4–6 = Aggro/Kleinvieh, 7–11 = Mittelfeld,
// 12+ = Burst-Klasse, 15+ = Farblos-Solo-Stark. Werte sind Startwerte — Balance-Pass
// in Phase 7. Combo-Buffs sind kartenspezifisch und additiv (siehe ComboAuraSystem).

const healNatureAllies = (self: Unit, state: CombatState, dt: number): void => {
  const heal = 1 * dt;
  for (const u of state.units) {
    if (!u.alive || u.side !== self.side || u === self) continue;
    if (u.card.color !== 'natur') continue;
    u.currentHp = Math.min(u.baseStats.hp, u.currentHp + heal);
  }
};

const berserkBoost = (self: Unit): void => {
  const ratio = self.currentHp / self.baseStats.hp;
  // Dauerhafter Buff via .buffs solange Threshold gilt — wird nach Reset jeden
  // Tick neu gesetzt, damit das Wegfallen sauber funktioniert.
  if (ratio < 0.5) {
    self.buffs = { ...self.buffs, damage: (self.buffs.damage ?? 0) + Math.round(self.baseStats.damage * 0.5) };
  }
};

const meteorOnSpawn = (self: Unit, state: CombatState): void => {
  for (const u of state.units) {
    if (!u.alive || u.side === self.side) continue;
    u.currentHp -= 10;
  }
};

const necromancerOnDeath = (self: Unit, state: CombatState): void => {
  const skel = ALL_CARDS.find((c) => c.id === 'skelett');
  if (!skel) return;
  state.pendingSpawns.push({ card: skel, side: self.side, x: self.x, y: self.y });
};

export const ALL_CARDS: readonly Card[] = [
  {
    id: 'druide',
    name: 'Druide',
    color: 'natur',
    class: 'magier',
    manaCost: 6,
    stats: { damage: 3, attackInterval: 1.4, hp: 12, speed: 40 },
    colorBuff: { hp: 3 },
    classBuff: { damage: 2 },
    passive: { trigger: 'onTick', apply: healNatureAllies },
    description: 'Heilt befreundete Natur-Units um 1 HP/Sek.',
  },
  {
    id: 'jaeger',
    name: 'Jäger',
    color: 'natur',
    class: 'reittier',
    manaCost: 5,
    stats: { damage: 5, attackInterval: 0.9, hp: 8, speed: 80 },
    colorBuff: { damage: 2 },
    classBuff: { speed: 15 },
  },
  {
    id: 'hain-waechter',
    name: 'Hain-Wächter',
    color: 'natur',
    class: 'festung',
    manaCost: 8,
    stats: { damage: 2, attackInterval: 1.6, hp: 25, speed: 30 },
    colorBuff: { hp: 4 },
    classBuff: { hp: 6 },
  },
  {
    id: 'berserker',
    name: 'Berserker',
    color: 'krieg',
    class: 'krieger',
    manaCost: 7,
    stats: { damage: 15, attackInterval: 1.1, hp: 8, speed: 50 },
    colorBuff: { damage: 3 },
    classBuff: { damage: 4 },
    passive: { trigger: 'onTick', apply: berserkBoost },
    description: 'Wenn HP unter 50%: +50% Damage.',
  },
  {
    id: 'wachposten',
    name: 'Wachposten',
    color: 'krieg',
    class: 'festung',
    manaCost: 10,
    stats: { damage: 8, attackInterval: 1.3, hp: 22, speed: 30 },
    colorBuff: { damage: 3 },
    classBuff: { hp: 6 },
  },
  {
    id: 'blutreiter',
    name: 'Blutreiter',
    color: 'krieg',
    class: 'reittier',
    manaCost: 9,
    stats: { damage: 10, attackInterval: 1.0, hp: 12, speed: 70 },
    colorBuff: { damage: 3 },
    classBuff: { speed: 15 },
  },
  {
    id: 'stein-golem',
    name: 'Stein-Golem',
    color: 'stein',
    class: 'festung',
    manaCost: 12,
    stats: { damage: 6, attackInterval: 1.6, hp: 40, speed: 25 },
    colorBuff: { hp: 6 },
    classBuff: { hp: 6 },
  },
  {
    id: 'stein-magier',
    name: 'Stein-Magier',
    color: 'stein',
    class: 'magier',
    manaCost: 8,
    stats: { damage: 4, attackInterval: 1.2, hp: 14, speed: 35 },
    colorBuff: { hp: 4 },
    classBuff: { damage: 2 },
  },
  {
    id: 'skelett',
    name: 'Skelett',
    color: 'untot',
    class: 'krieger',
    manaCost: 4,
    stats: { damage: 6, attackInterval: 1.0, hp: 6, speed: 50 },
    colorBuff: { damage: 2 },
    classBuff: { damage: 3 },
  },
  {
    id: 'nekromant',
    name: 'Nekromant',
    color: 'untot',
    class: 'magier',
    manaCost: 11,
    stats: { damage: 4, attackInterval: 1.3, hp: 14, speed: 35 },
    colorBuff: { damage: 2 },
    classBuff: { damage: 2 },
    passive: { trigger: 'onDeath', apply: necromancerOnDeath },
    description: 'Beim Tod: ein Skelett erscheint.',
  },
  {
    id: 'meteor',
    name: 'Meteor',
    color: 'farblos',
    class: 'magier',
    manaCost: 15,
    stats: { damage: 25, attackInterval: 1.4, hp: 5, speed: 60 },
    colorBuff: {},
    classBuff: { damage: 3 },
    passive: { trigger: 'onSpawn', apply: meteorOnSpawn },
    description: 'Beim Spawn: -10 HP auf alle Gegner-Units.',
  },
  {
    id: 'wanderheiler',
    name: 'Wanderheiler',
    color: 'farblos',
    class: 'heiler',
    manaCost: 7,
    stats: { damage: 1, attackInterval: 1.5, hp: 16, speed: 45 },
    colorBuff: {},
    classBuff: { hp: 4 },
    passive: {
      trigger: 'onTick',
      apply: (self, state, dt) => {
        const heal = 2 * dt;
        for (const u of state.units) {
          if (!u.alive || u.side !== self.side || u === self) continue;
          u.currentHp = Math.min(u.baseStats.hp, u.currentHp + heal);
        }
      },
    },
    description: 'Heilt alle befreundeten Units um 2 HP/Sek.',
  },
] as const;

export const cardById = (id: string): Card => {
  const c = ALL_CARDS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown card id: ${id}`);
  return c;
};
