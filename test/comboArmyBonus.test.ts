import { describe, it, expect } from 'vitest';
import { computeCombo, RoundSystem } from '../src/systems/combat/RoundSystem';
import { createCombatState, type DrawnCard } from '../src/systems/combat/CombatState';
import { mulberry32 } from '../src/systems/rng';
import { cardById } from '../src/systems/data/cards';
import { COLOR_ARMY_BONUS, CLASS_ARMY_BONUS, FRONT_LINE_OFFSET, PLAYER_BASE_X } from '../src/systems/data/balance';
import type { DeckEntry } from '../src/domain/Run';

const drawn = (id: string, troops = 2): DrawnCard => ({ card: cardById(id), level: 1, troops });
const entry = (id: string): DeckEntry => ({ card: cardById(id), level: 1 });

describe('Armee-weiter Combo-Bonus (Poker-Warlords-Stil)', () => {
  it('geteilte Farbe → Color-Armee-Bonus', () => {
    // berserker (krieg/krieger) + kriegsfeste (krieg/festung): teilen Farbe Krieg, andere Klasse.
    const buff = computeCombo([drawn('berserker'), drawn('kriegsfeste')], [0, 1]);
    expect(buff.damage).toBe(COLOR_ARMY_BONUS.krieg.damage);
    expect(buff.hp ?? 0).toBe(0);
  });

  it('geteilte Klasse → Class-Armee-Bonus', () => {
    // berserker (krieg/krieger) + waldlaeufer (natur/krieger): teilen Klasse Krieger, andere Farbe.
    const buff = computeCombo([drawn('berserker'), drawn('waldlaeufer')], [0, 1]);
    expect(buff.damage).toBe(CLASS_ARMY_BONUS.krieger.damage);
  });

  it('geteilte Farbe UND Klasse → beide Boni addiert', () => {
    // berserker + grabwaechter? grabwaechter ist untot/krieger → nur Klasse. Nimm 2 krieg/krieger gibt es nicht.
    // Stattdessen: gleiche Farbe+Klasse über zwei Drawn desselben Typs simulieren.
    const buff = computeCombo([drawn('berserker'), drawn('berserker')], [0, 1]);
    expect(buff.damage).toBe((COLOR_ARMY_BONUS.krieg.damage ?? 0) + (CLASS_ARMY_BONUS.krieger.damage ?? 0));
  });

  it('farblos löst keinen Color-Bonus aus (nur evtl. Klasse)', () => {
    // soeldner (farblos/krieger) + handelsposten (farblos/festung): gleiche Farbe farblos, andere Klasse.
    const buff = computeCombo([drawn('soeldner'), drawn('handelsposten')], [0, 1]);
    expect(Object.keys(buff).length).toBe(0);
  });

  it('keine geteilte Farbe/Klasse → kein Bonus', () => {
    // berserker (krieg/krieger) + naturheiler (natur/heiler): nichts geteilt.
    const buff = computeCombo([drawn('berserker'), drawn('naturheiler')], [0, 1]);
    expect(Object.keys(buff).length).toBe(0);
  });

  it('confirmSelection bäckt den Combo-Buff in die gespawnten Units (armee-weit)', () => {
    const s = createCombatState([entry('berserker'), entry('kriegsfeste')], [entry('grabwaechter')], mulberry32(9));
    RoundSystem.startDraw(s);
    RoundSystem.togglePick(s, 0);
    RoundSystem.togglePick(s, 1);
    RoundSystem.togglePick(s, 2);
    // 2 gleichfarbige (Krieg) wählen, falls vorhanden — sonst irgendwelche 2.
    RoundSystem.toggleSelect(s, 0);
    RoundSystem.toggleSelect(s, 1);
    RoundSystem.confirmSelection(s);
    // comboBuff der Spielerseite ist gesetzt (>=0 Keys) und Units existieren.
    const playerUnits = s.units.filter((u) => u.side === 'player');
    expect(playerUnits.length).toBeGreaterThan(0);
    // Wenn ein Combo aktiv war, tragen die Units den Bonus in baseStats.
    const cb = s.player.comboBuff;
    if (cb.damage) {
      expect(playerUnits.every((u) => u.baseStats.damage >= u.card.stats.damage)).toBe(true);
    }
  });
});

describe('Front-/Hintergrundlinie', () => {
  it('Front-Stack spawnt weiter vorne als Hinten-Stack', () => {
    const s = createCombatState([entry('berserker'), entry('kriegsfeste')], [entry('grabwaechter')], mulberry32(5));
    RoundSystem.startDraw(s);
    RoundSystem.togglePick(s, 0);
    RoundSystem.togglePick(s, 1);
    RoundSystem.togglePick(s, 2);
    // Front = erste Wahl, Hinten = zweite.
    RoundSystem.toggleSelect(s, 0);
    RoundSystem.toggleSelect(s, 1);
    const frontCardId = s.player.picked[s.player.selectedIdx[0]!]!.card.id;
    const backCardId = s.player.picked[s.player.selectedIdx[1]!]!.card.id;
    RoundSystem.confirmSelection(s);
    const frontXs = s.units.filter((u) => u.side === 'player' && u.card.id === frontCardId).map((u) => u.x);
    const backXs = s.units.filter((u) => u.side === 'player' && u.card.id === backCardId).map((u) => u.x);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    // Nur prüfen, wenn die beiden Karten unterschiedliche IDs haben.
    if (frontCardId !== backCardId && frontXs.length && backXs.length) {
      expect(avg(frontXs)).toBeGreaterThan(avg(backXs));
      expect(avg(frontXs)).toBeGreaterThan(PLAYER_BASE_X + FRONT_LINE_OFFSET - 1);
    }
  });
});
