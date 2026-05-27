import type { Card } from '../../domain/Card';
import type { Unit } from '../../domain/Unit';
import { effectiveStats } from '../../domain/Unit';
import type { Side } from '../../domain/Side';
import {
  ATTACK_RANGE,
  ENEMY_BASE_X,
  EXP_PER_KILL,
  FIELD_HEIGHT,
  PLAYER_BASE_X,
  SPAWN_LANE_JITTER,
  UNIT_RADIUS,
} from '../data/balance';
import { ComboAuraSystem } from './ComboAuraSystem';
import { type CombatState, getSide, logEvent } from './CombatState';

const dirInto = (side: Side): 1 | -1 => (side === 'player' ? 1 : -1);
const enemySide = (side: Side): Side => (side === 'player' ? 'enemy' : 'player');
const isBeyondBase = (side: Side, x: number): boolean =>
  side === 'player' ? x >= ENEMY_BASE_X : x <= PLAYER_BASE_X;

export const UnitSystem = {
  spawn(state: CombatState, card: Card, side: Side, atX?: number, atY?: number): Unit {
    const spawnX = atX ?? (side === 'player' ? PLAYER_BASE_X + UNIT_RADIUS : ENEMY_BASE_X - UNIT_RADIUS);
    const centerY = FIELD_HEIGHT / 2;
    const jitter = (state.rng() - 0.5) * 2 * SPAWN_LANE_JITTER;
    const spawnY = atY ?? Math.max(UNIT_RADIUS, Math.min(FIELD_HEIGHT - UNIT_RADIUS, centerY + jitter));
    const unit: Unit = {
      id: `u${state.nextUnitId++}`,
      card,
      side,
      x: spawnX,
      y: spawnY,
      baseStats: { ...card.stats },
      buffs: {},
      currentHp: card.stats.hp,
      target: null,
      attackCooldown: 0,
      alive: true,
      hpThresholdFired: false,
    };
    state.units.push(unit);
    ComboAuraSystem.markDirty(state);
    if (card.passive?.trigger === 'onSpawn') {
      // onSpawn-Passives feuern sofort einmal — Effekte wie Meteor wirken global.
      card.passive.apply(unit, state, 0);
    }
    logEvent(state, `${side === 'player' ? '⊕' : '⊖'} ${card.name} spawnt`);
    return unit;
  },

  tick(state: CombatState, dt: number): void {
    ComboAuraSystem.recomputeIfDirty(state);

    // 1) Berserker-artige Tick-Passives feuern lassen — sie justieren u.buffs
    //    nach der Aura-Recompute, damit der Damage-Boost auf der Aura sitzt.
    for (const u of state.units) {
      if (!u.alive) continue;
      const passive = u.card.passive;
      if (!passive) continue;
      if (passive.trigger === 'onTick') passive.apply(u, state, dt);
      if (passive.trigger === 'onHpThreshold' && !u.hpThresholdFired) {
        const threshold = passive.hpThreshold ?? 0.5;
        if (u.currentHp / u.baseStats.hp <= threshold) {
          passive.apply(u, state, dt);
          u.hpThresholdFired = true;
        }
      }
    }

    // 2) Targeting + Bewegung + Angriff
    for (const u of state.units) {
      if (!u.alive) continue;
      const stats = effectiveStats(u);

      if (u.target && !u.target.alive) u.target = null;
      if (!u.target) {
        u.target = findClosestEnemy(state, u);
      }

      if (u.attackCooldown > 0) u.attackCooldown = Math.max(0, u.attackCooldown - dt);

      if (u.target) {
        const dx = u.target.x - u.x;
        const dy = u.target.y - u.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= ATTACK_RANGE + UNIT_RADIUS) {
          // Angriff — globaler Damage-Bonus der eigenen Seite (Perks / Level-Up)
          if (u.attackCooldown === 0) {
            const sideState = getSide(state, u.side);
            const dmg = Math.max(0, stats.damage + sideState.globalDamageBonus);
            u.target.currentHp -= dmg;
            u.attackCooldown = stats.attackInterval;
          }
        } else {
          // In Richtung Target laufen
          const step = stats.speed * dt;
          if (dist > 0) {
            u.x += (dx / dist) * step;
            u.y += (dy / dist) * step;
          }
        }
      } else {
        // Kein Target sichtbar → Richtung Gegner-Base laufen
        const step = stats.speed * dt;
        u.x += dirInto(u.side) * step;
      }

      // Base-Damage: erreicht Unit X-Koordinate der Gegner-Base → Damage + verschwinden
      if (isBeyondBase(u.side, u.x)) {
        const target = getSide(state, enemySide(u.side));
        const own = getSide(state, u.side);
        const dmg = Math.max(1, Math.round(stats.damage + own.globalDamageBonus));
        target.baseHp = Math.max(0, target.baseHp - dmg);
        logEvent(state, `${u.card.name} trifft Base für ${dmg}`);
        u.alive = false;
        ComboAuraSystem.markDirty(state);
      }
    }

    // 3) Tote einsammeln, EXP gutschreiben, onDeath-Passives feuern
    for (const u of state.units) {
      if (u.alive && u.currentHp <= 0) {
        u.alive = false;
        const killer = enemySide(u.side);
        const winnerSide = getSide(state, killer);
        winnerSide.exp += EXP_PER_KILL(u.card.manaCost);
        if (u.card.passive?.trigger === 'onDeath') {
          u.card.passive.apply(u, state, 0);
        }
        logEvent(state, `${u.card.name} stirbt`);
        ComboAuraSystem.markDirty(state);
      }
    }

    // 4) Pending Spawns (z.B. Nekromant-Skelett) abarbeiten
    if (state.pendingSpawns.length > 0) {
      const pending = state.pendingSpawns.splice(0, state.pendingSpawns.length);
      for (const p of pending) UnitSystem.spawn(state, p.card, p.side, p.x, p.y);
    }

    // 5) Tote rauswerfen
    if (state.units.some((u) => !u.alive)) {
      state.units = state.units.filter((u) => u.alive);
      ComboAuraSystem.markDirty(state);
    }
  },
};

const findClosestEnemy = (state: CombatState, u: Unit): Unit | null => {
  let best: Unit | null = null;
  let bestDist = Infinity;
  for (const o of state.units) {
    if (!o.alive || o.side === u.side) continue;
    const d = Math.hypot(o.x - u.x, o.y - u.y);
    if (d < bestDist) {
      bestDist = d;
      best = o;
    }
  }
  // Nur „in Sichtweite" — sonst läuft Unit weiter Richtung Base.
  return bestDist <= 220 ? best : null;
};
