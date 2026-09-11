import { describe, expect, it } from 'vitest';
import { exercises, exerciseById } from '../data/exercises';
import { workouts, mobilityWarmup } from '../data/program';
describe('integrità dei dati', () => {
    it('ogni exerciseId usato nel programma esiste nella libreria', () => {
        const ids = new Set();
        for (const w of workouts) {
            ids.add(w.warmup.cardio.exerciseId);
            w.warmup.mobility.forEach((i) => ids.add(i.exerciseId));
            w.strength.forEach((i) => ids.add(i.exerciseId));
            w.core.items.forEach((i) => ids.add(i.exerciseId));
            ids.add(w.cardio.exerciseId);
        }
        mobilityWarmup.forEach((i) => ids.add(i.exerciseId));
        const mancanti = [...ids].filter((id) => !exerciseById(id));
        expect(mancanti).toEqual([]);
    });
    it('la libreria non ha id duplicati', () => {
        const ids = exercises.map((e) => e.id);
        expect(new Set(ids).size).toBe(ids.length);
    });
    it('il programma ha 6 allenamenti, 2 per fase', () => {
        expect(workouts.map((w) => w.id)).toEqual(['F1-A', 'F1-B', 'F2-A', 'F2-B', 'F3-A', 'F3-B']);
        expect(workouts.filter((w) => w.phase === 1)).toHaveLength(2);
        expect(workouts.filter((w) => w.phase === 2)).toHaveLength(2);
        expect(workouts.filter((w) => w.phase === 3)).toHaveLength(2);
    });
    it('F1-A corrisponde alla scheda del programma', () => {
        const w = workouts[0];
        expect(w.strength.map((s) => [s.exerciseId, s.sets, s.reps, s.restSec, s.rir])).toEqual([
            ['box-squat', 2, '10', 60, '4'],
            ['leg-press', 3, '12-15', 90, '3'],
            ['chest-press-machine', 3, '12-15', 0, '3'],
            ['seated-cable-row', 3, '12-15', 75, '3'],
            ['glute-bridge', 3, '15', 60, '3'],
        ]);
        expect(w.core.rounds).toBe(2);
        expect(w.core.restBetweenExercisesSec).toBe(30);
        expect(w.core.restBetweenRoundsSec).toBe(60);
        expect(w.cardio).toMatchObject({ exerciseId: 'cyclette', type: 'liss', totalMin: 12 });
    });
    it('le superserie sono coppie con lo stesso gruppo e recupero 0 sul primo', () => {
        for (const w of workouts) {
            const gruppi = new Map();
            w.strength.forEach((s) => {
                if (!s.supersetGroup)
                    return;
                const arr = gruppi.get(s.supersetGroup) ?? [];
                arr.push(s);
                gruppi.set(s.supersetGroup, arr);
            });
            for (const [, items] of gruppi) {
                expect(items).toHaveLength(2);
                expect(items[0].restSec).toBe(0);
                expect(items[1].restSec).toBeGreaterThan(0);
            }
        }
    });
    it('gli intervalli cardio hanno tutti i parametri', () => {
        for (const w of workouts.filter((x) => x.cardio.type === 'intervalli')) {
            expect(w.cardio.intervals).toBeDefined();
            expect(w.cardio.intervals.rounds).toBeGreaterThan(0);
            expect(w.cardio.warmupMin).toBeGreaterThan(0);
        }
    });
});
