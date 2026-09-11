import { describe, expect, it } from 'vitest';
import { buildIntervalPhases, formatClock, phaseAt, totalPhaseSeconds } from '../lib/timers';
import { workoutById } from '../data/program';
describe('timer a fasi del cardio a intervalli', () => {
    const cardio = workoutById('F2-A').cardio; // 3' facile + 6 × (30" / 60")
    const fasi = buildIntervalPhases(cardio);
    it('costruisce riscaldamento e giri lavoro/recupero', () => {
        expect(fasi[0]).toMatchObject({ kind: 'riscaldamento', seconds: 180 });
        expect(fasi).toHaveLength(1 + 6 * 2);
        expect(fasi[1]).toMatchObject({ kind: 'lavoro', seconds: 30, round: 1, rounds: 6 });
        expect(fasi[2]).toMatchObject({ kind: 'recupero', seconds: 60, round: 1 });
        expect(fasi[fasi.length - 1]).toMatchObject({ kind: 'recupero', round: 6 });
        expect(totalPhaseSeconds(fasi)).toBe(180 + 6 * 90);
    });
    it('individua la fase corrente dal tempo trascorso', () => {
        expect(phaseAt(fasi, 0)).toMatchObject({ index: 0, remaining: 180 });
        expect(phaseAt(fasi, 179)).toMatchObject({ index: 0, remaining: 1 });
        expect(phaseAt(fasi, 180)).toMatchObject({ index: 1, remaining: 30 });
        expect(phaseAt(fasi, 200)).toMatchObject({ index: 1, remaining: 10 });
        expect(phaseAt(fasi, 210)).toMatchObject({ index: 2, remaining: 60 });
        expect(phaseAt(fasi, 100000).done).toBe(true);
    });
    it('formatta il tempo in minuti e secondi', () => {
        expect(formatClock(0)).toBe('0:00');
        expect(formatClock(9)).toBe('0:09');
        expect(formatClock(75)).toBe('1:15');
        expect(formatClock(600)).toBe('10:00');
    });
});
describe('superserie', () => {
    it('il primo esercizio della superserie non ha recupero', () => {
        const w = workoutById('F1-A');
        const superserie = w.strength.filter((s) => s.supersetGroup === 'S1');
        expect(superserie).toHaveLength(2);
        expect(superserie[0].restSec).toBe(0);
        expect(superserie[1].restSec).toBe(75);
    });
});
