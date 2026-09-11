import { describe, expect, it } from 'vitest';
import {
  hoursUntil48h,
  isProgramComplete,
  nextSessionNumber,
  phaseOfSession,
  setsForSession,
  weekOfSession,
  workoutForSession,
  workoutIdForSession,
} from '../lib/session-sequence';
import type { SessionLog } from '../types';

const log = (n: number, status: SessionLog['status'], finishedAt?: string): SessionLog => ({
  sessionNumber: n,
  workoutId: workoutIdForSession(n),
  startedAt: finishedAt ?? new Date().toISOString(),
  finishedAt,
  status,
});

describe('sequenza delle sessioni', () => {
  it('alterna A e B e assegna le fasi per numero di sessione', () => {
    expect(workoutIdForSession(1)).toBe('F1-A');
    expect(workoutIdForSession(2)).toBe('F1-B');
    expect(workoutIdForSession(8)).toBe('F1-B');
    expect(workoutIdForSession(9)).toBe('F2-A');
    expect(workoutIdForSession(16)).toBe('F2-B');
    expect(workoutIdForSession(17)).toBe('F3-A');
    expect(workoutIdForSession(24)).toBe('F3-B');
    expect(phaseOfSession(8)).toBe(1);
    expect(phaseOfSession(9)).toBe(2);
    expect(phaseOfSession(17)).toBe(3);
    expect(weekOfSession(3)).toBe(2);
    expect(weekOfSession(24)).toBe(12);
  });

  it('la settimana 1 usa 2 serie per tutti gli esercizi di forza', () => {
    const s1 = workoutForSession(1);
    expect(s1.strength.every((s) => s.sets === 2)).toBe(true);
    const s2 = workoutForSession(2);
    expect(s2.strength.every((s) => s.sets === 2)).toBe(true);
    const s3 = workoutForSession(3);
    expect(s3.strength.map((s) => s.sets)).toEqual([2, 3, 3, 3, 3]);
    expect(setsForSession({ exerciseId: 'leg-press', sets: 4, restSec: 60 }, 1)).toBe(2);
    expect(setsForSession({ exerciseId: 'leg-press', sets: 4, restSec: 60 }, 17)).toBe(4);
  });

  it('riprende dalla sessione successiva a quella completata, anche dopo una pausa', () => {
    expect(nextSessionNumber([])).toBe(1);
    expect(nextSessionNumber([log(1, 'completata'), log(2, 'completata')])).toBe(3);
    // pausa di tre settimane: non si salta avanti
    expect(nextSessionNumber([log(1, 'completata'), log(2, 'completata'), log(3, 'completata')])).toBe(4);
    // una sessione contrassegnata come saltata fa comunque avanzare la sequenza
    expect(nextSessionNumber([log(1, 'completata'), log(2, 'saltata')])).toBe(3);
    // una sessione in corso non avanza la sequenza
    expect(nextSessionNumber([log(1, 'completata'), log(2, 'in_corso')])).toBe(2);
  });

  it('riconosce il programma completato', () => {
    const tutte = Array.from({ length: 24 }, (_, i) => log(i + 1, 'completata'));
    expect(isProgramComplete(tutte)).toBe(true);
    expect(isProgramComplete(tutte.slice(0, 23))).toBe(false);
  });

  it('calcola le ore mancanti alle 48 h di recupero', () => {
    const now = new Date('2026-01-10T18:00:00Z');
    const venti = new Date('2026-01-09T22:00:00Z').toISOString(); // 20 h fa
    expect(hoursUntil48h([log(1, 'completata', venti)], now)).toBe(28);
    const tre = new Date('2026-01-07T18:00:00Z').toISOString(); // 72 h fa
    expect(hoursUntil48h([log(1, 'completata', tre)], now)).toBe(0);
    expect(hoursUntil48h([], now)).toBe(0);
  });
});
