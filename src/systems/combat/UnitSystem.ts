import type { Card } from '../../domain/Card';
import type { Unit } from '../../domain/Unit';
import { effectiveStats } from '../../domain/Unit';
import type { Side } from '../../domain/Side';
import {
  ATTACK_RANGE,
  DEATH_ANIM_SEC,
  ENEMY_BASE_X,
  EXP_PER_KILL,
  FIELD_HEIGHT,
  PLAYER_BASE_X,
  SCREEN_SHAKE_DECAY_SEC,
  SCREEN_SHAKE_MAX_PX,
  SPAWN_LANE_JITTER,
  UNIT_RADIUS,
} from '../data/balance';
import { ComboAuraSystem } from './ComboAuraSystem';
import { type CombatState, getSide, logEvent } from './CombatState';

const dirInto = (side: Side): 1 | -1 => (side === 'player' ? 1 : -1);
const enemySide = (side: Side): Side => (side === 'player' ? 'enemy' : 'player');
const isBeyondBase = (side: Side, x: number): boolean =>
  side === 'player' ? x >= ENEMY_BASE_X : x <= PLAYER_BASE_X;

// Klassen-Lanes — Y-Position auf dem Spielfeld nach Rolle. Verhindert das
// Frontline-Stalemate aus Phase 7: Reittier flankiert oben, Magier/Heiler
// halten sich hinten. Werte sind Bruchteile von FIELD_HEIGHT.
const LANE_Y_FRAC: Record<Card['class'], number> = {
  reittier: 0.22,
  krieger: 0.45,
  festung: 0.55,
  magier: 0.78,
  heiler: 0.82,
};

export const UnitSystem = {
  spawn(
    state: CombatState,
    card: Card,
    side: Side,
    atX?: number,
    atY?: number,
    statsOverride?: import('../../domain/Card').UnitStats,
  ): Unit {
    const baseStats = statsOverride ? { ...statsOverride } : { ...card.stats };
    const spawnX = atX ?? (side === 'player' ? PLAYER_BASE_X + UNIT_RADIUS : ENEMY_BASE_X - UNIT_RADIUS);
    const laneCenter = (LANE_Y_FRAC[card.class] ?? 0.5) * FIELD_HEIGHT;
    // Kleiner Jitter um die Lane, damit gestapelte Units nicht 1:1 aufeinander spawnen.
    const jitter = (state.rng() - 0.5) * SPAWN_LANE_JITTER;
    const spawnY = atY ?? Math.max(UNIT_RADIUS, Math.min(FIELD_HEIGHT - UNIT_RADIUS, laneCenter + jitter));
    const unit: Unit = {
      id: `u${state.nextUnitId++}`,
      card,
      side,
      x: spawnX,
      y: spawnY,
      baseStats,
      buffs: {},
      currentHp: baseStats.hp,
      target: null,
      attackCooldown: 0,
      alive: true,
      hpThresholdFired: false,
      spawnAge: 0,
      deathAge: null,
      laneY: laneCenter,
    };
    state.units.push(unit);
    state.spawnFxQueue.push({ side, x: spawnX, y: spawnY });
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

    // FX-Timer fortschreiben (auch für gestorbene Units, damit Tod-Animation läuft).
    for (const u of state.units) {
      u.spawnAge += dt;
      if (u.deathAge !== null) u.deathAge += dt;
    }
    for (const dn of state.damageNumbers) dn.age += dt;
    state.damageNumbers = state.damageNumbers.filter((dn) => dn.age < 0.9);
    if (state.screenShake.remainingSec > 0) {
      state.screenShake.remainingSec = Math.max(0, state.screenShake.remainingSec - dt);
    }

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
            // Floating-Damage-Number über dem Ziel.
            if (dmg > 0) {
              state.damageNumbers.push({
                x: u.target.x,
                y: u.target.y - UNIT_RADIUS - 6,
                text: String(Math.round(dmg)),
                color: u.side === 'player' ? '#ffe9b8' : '#ffb6a8',
                age: 0,
              });
            }
          }
        } else {
          // In Richtung Target laufen. X folgt direkt, Y bleibt nahe der Lane
          // (sanftes Driften statt aufeinander stürzen → bricht das Frontline-Stau).
          moveTowards(u, u.target.x, u.target.y, stats.speed, dt);
        }
      } else {
        // Kein Target sichtbar → Richtung Gegner-Base laufen, auf eigener Lane bleiben.
        moveTowards(u, u.x + dirInto(u.side) * 200, u.laneY, stats.speed, dt);
      }

      // Base-Damage: erreicht Unit X-Koordinate der Gegner-Base → Damage + verschwinden
      if (isBeyondBase(u.side, u.x)) {
        const target = getSide(state, enemySide(u.side));
        const own = getSide(state, u.side);
        const dmg = Math.max(1, Math.round(stats.damage + own.globalDamageBonus));
        target.baseHp = Math.max(0, target.baseHp - dmg);
        logEvent(state, `${u.card.name} trifft Base für ${dmg}`);
        // Visuelle Effekte: Damage-Number an Base + Screen-Shake + Queue für SFX.
        const baseX = u.side === 'player' ? ENEMY_BASE_X : PLAYER_BASE_X;
        state.damageNumbers.push({
          x: baseX,
          y: FIELD_HEIGHT / 2 - 30,
          text: String(dmg),
          color: '#ff6960',
          age: 0,
        });
        state.screenShake.remainingSec = SCREEN_SHAKE_DECAY_SEC;
        state.screenShake.intensity = Math.min(SCREEN_SHAKE_MAX_PX, dmg / 3);
        state.baseHitFxQueue.push({ side: enemySide(u.side) });
        u.alive = false;
        u.deathAge = 0;
        ComboAuraSystem.markDirty(state);
      }
    }

    // 3) Tote einsammeln, EXP gutschreiben, onDeath-Passives feuern.
    //    Die Unit bleibt mit alive=false noch DEATH_ANIM_SEC im units-Array,
    //    damit der Renderer eine Shrink-/Fade-Animation zeigen kann. Targeting,
    //    Aura und Combat-Logik ignorieren sie via u.alive=false.
    for (const u of state.units) {
      if (u.alive && u.currentHp <= 0) {
        u.alive = false;
        u.deathAge = 0;
        state.deathFxQueue.push({ x: u.x, y: u.y });
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
      for (const p of pending) UnitSystem.spawn(state, p.card, p.side, p.x, p.y, p.stats);
    }

    // 5) Tote rauswerfen, nachdem die Tod-Animation abgelaufen ist.
    const expired = state.units.some((u) => !u.alive && (u.deathAge ?? 0) >= DEATH_ANIM_SEC);
    if (expired) {
      state.units = state.units.filter((u) => u.alive || (u.deathAge ?? 0) < DEATH_ANIM_SEC);
      ComboAuraSystem.markDirty(state);
    }
  },
};

/** Bewegung mit Lane-Bias: X läuft auf das Ziel zu, Y zieht zur Unit-Lane wenn
 *  das Ziel weit Y-versetzt ist. So überholen schnelle Klassen die Frontline. */
const moveTowards = (u: Unit, tx: number, ty: number, speed: number, dt: number): void => {
  const step = speed * dt;
  const dx = tx - u.x;
  // Y-Ziel: Mix aus Target-Y und Lane-Y, gewichtet nach Klasse.
  // Reittiere/Magier bleiben eher auf der Lane, Krieger/Festung schließen vertikal auf.
  const laneStickiness = u.card.class === 'reittier' || u.card.class === 'magier' ? 0.85 : 0.45;
  const desiredY = u.laneY * laneStickiness + ty * (1 - laneStickiness);
  const dyDesired = desiredY - u.y;
  const len = Math.max(1, Math.hypot(dx, dyDesired));
  // X bekommt mind. 80% des Speeds — Units stagnieren nicht, wenn sie Y-aligned sind.
  const xStep = Math.sign(dx) * Math.min(Math.abs(dx), step * Math.max(0.8, Math.abs(dx) / len));
  const yStep = (dyDesired / len) * step;
  u.x += xStep;
  u.y += yStep;
};

const findClosestEnemy = (state: CombatState, u: Unit): Unit | null => {
  // Reittiere flankieren: sie engagen nur, wenn ein Gegner direkt im Weg steht.
  // Sonst pushen sie zur Base.
  const isFlanker = u.card.class === 'reittier';
  const maxDist = isFlanker ? 60 : 220;
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
  return bestDist <= maxDist ? best : null;
};
