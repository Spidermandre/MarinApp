import { describe, expect, it } from 'vitest';
import {
  DEFAULT_INCREMENTS,
  parseRepRange,
  roundToIncrement,
  suggestCardioAdjust,
  suggestDuration,
  suggestWeight,
  type ExerciseHistoryEntry,
} from '../lib/progression';
import { exerciseById } from '../data/exercises';
import type { PrescribedItem } from '../types';

const legPress = exerciseById('leg-press')!;
const chestPress = exerciseById('chest-press-machine')!;
const goblet = exerciseById('goblet-squat')!;
const deadBug = exerciseById('dead-bug')!;

const item = (over: Partial<PrescribedItem> = {}): PrescribedItem => ({
  exerciseId: 'leg-press',
  sets: 3,
  reps: '12-15',
  restSec: 90,
  ...over,
});

const entry = (
  sessionNumber: number,
  prescribedReps: string,
  sets: { weightKg: number; reps: number }[],
): ExerciseHistoryEntry => ({
  sessionNumber,
  prescribedReps,
  sets: sets.map((s) => ({ ...s, completed: true })),
});

describe('utilità', () => {
  it('legge i range di ripetizioni', () => {
    expect(parseRepRange('12-15')).toEqual([12, 15]);
    expect(parseRepRange('12–15')).toEqual([12, 15]);
    expect(parseRepRange('10')).toEqual([10, 10]);
    expect(parseRepRange(undefined)).toBeUndefined();
  });

  it('arrotonda agli incrementi disponibili', () => {
    expect(roundToIncrement(11.3, 2.5)).toBe(12.5);
    expect(roundToIncrement(11.1, 2.5)).toBe(10);
    expect(roundToIncrement(11.3, 2.5, 'up')).toBe(12.5);
    expect(roundToIncrement(11.3, 2.5, 'down')).toBe(10);
  });
});

describe('doppia progressione', () => {
  it('esercizio nuovo: nessun carico, messaggio guida', () => {
    const s = suggestWeight(goblet, item({ exerciseId: 'goblet-squat', reps: '10-12' }), []);
    expect(s.action).toBe('nuovo');
    expect(s.weightKg).toBeUndefined();
    expect(s.message).toMatch(/RIR/);
  });

  it('tutte le serie al limite alto: aumenta di una piastra', () => {
    const h = [entry(3, '12-15', [
      { weightKg: 30, reps: 15 },
      { weightKg: 30, reps: 15 },
      { weightKg: 30, reps: 15 },
    ])];
    const s = suggestWeight(legPress, item(), h);
    expect(s.action).toBe('aumenta');
    expect(s.weightKg).toBe(35); // leg press: +5 kg
  });

  it('rispetta l’incremento per tipo di attrezzo', () => {
    const h = [entry(3, '12-15', [{ weightKg: 20, reps: 15 }, { weightKg: 20, reps: 15 }])];
    expect(suggestWeight(chestPress, item({ exerciseId: 'chest-press-machine' }), h).weightKg).toBe(22.5);
    expect(
      suggestWeight(goblet, item({ exerciseId: 'goblet-squat', reps: '12-15' }), h).weightKg,
    ).toBe(22);
    expect(
      suggestWeight(goblet, item({ exerciseId: 'goblet-squat', reps: '12-15' }), h, {
        ...DEFAULT_INCREMENTS,
        dumbbellStepKg: 1,
      }).weightKg,
    ).toBe(21);
  });

  it('serie dentro il range ma non al massimo: mantiene il carico', () => {
    const h = [entry(3, '12-15', [
      { weightKg: 30, reps: 15 },
      { weightKg: 30, reps: 13 },
      { weightKg: 30, reps: 12 },
    ])];
    const s = suggestWeight(legPress, item(), h);
    expect(s.action).toBe('mantieni');
    expect(s.weightKg).toBe(30);
  });

  it('sotto il limite basso una volta: mantiene; due volte di fila: riduce del 10%', () => {
    const sotto1 = entry(3, '12-15', [
      { weightKg: 40, reps: 12 },
      { weightKg: 40, reps: 10 },
    ]);
    const sotto2 = entry(5, '12-15', [
      { weightKg: 40, reps: 11 },
      { weightKg: 40, reps: 9 },
    ]);
    expect(suggestWeight(legPress, item(), [sotto1]).action).toBe('mantieni');
    const s = suggestWeight(legPress, item(), [sotto1, sotto2]);
    expect(s.action).toBe('riduci');
    expect(s.weightKg).toBe(35); // 36 arrotondato in basso al passo da 5 kg
  });

  it('cambio fase verso un range più basso: +5% arrotondato per eccesso', () => {
    const h = [entry(14, '10-12', [
      { weightKg: 30, reps: 12 },
      { weightKg: 30, reps: 11 },
    ])];
    const s = suggestWeight(legPress, item({ reps: '8-10' }), h);
    expect(s.action).toBe('cambio-fase');
    expect(s.weightKg).toBe(35); // 31,5 → arrotondato per eccesso a 35
  });

  it('esercizi a corpo libero: solo obiettivo, nessun carico', () => {
    const s = suggestWeight(deadBug, item({ exerciseId: 'dead-bug', reps: '8', perSide: true }), []);
    expect(s.action).toBe('corpo-libero');
    expect(s.weightKg).toBeUndefined();
    expect(s.message).toMatch(/per lato/);
  });

  it('riprende l’ultimo carico registrato anche dopo una pausa lunga', () => {
    const h = [
      entry(3, '12-15', [{ weightKg: 25, reps: 15 }]),
      entry(5, '12-15', [{ weightKg: 30, reps: 13 }]),
    ];
    expect(suggestWeight(legPress, item(), h).weightKg).toBe(30);
  });
});

describe('esercizi a tempo e cardio', () => {
  it('plank: +5" fino al massimo del range', () => {
    const plankItem: PrescribedItem = {
      exerciseId: 'plank',
      sets: 1,
      durationRange: [20, 30],
      restSec: 30,
    };
    expect(suggestDuration(plankItem, []).durationSec).toBe(20);
    const h: ExerciseHistoryEntry[] = [
      { sessionNumber: 1, sets: [{ durationSec: 20, completed: true }] },
    ];
    expect(suggestDuration(plankItem, h).durationSec).toBe(25);
    const h2: ExerciseHistoryEntry[] = [
      { sessionNumber: 3, sets: [{ durationSec: 28, completed: true }] },
    ];
    expect(suggestDuration(plankItem, h2).durationSec).toBe(30);
  });

  it('cardio LISS: se facile suggerisce di alzare', () => {
    expect(suggestCardioAdjust('facile')).toMatch(/pendenza/);
    expect(suggestCardioAdjust('giusto')).toMatch(/zona 2/);
    expect(suggestCardioAdjust('difficile')).toMatch(/stesse impostazioni/);
  });
});
