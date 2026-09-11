import { db } from '../db/dexie';
import { workoutForSession } from './session-sequence';
import type { ExerciseHistoryEntry } from './progression';
import type { SessionLog, SetLog } from '../types';

/** Range di ripetizioni prescritto per un esercizio in una data sessione. */
export function prescribedRepsFor(sessionNumber: number, exerciseId: string): string | undefined {
  try {
    const w = workoutForSession(sessionNumber);
    const item =
      w.strength.find((s) => s.exerciseId === exerciseId) ??
      w.core.items.find((s) => s.exerciseId === exerciseId);
    return item?.reps;
  } catch {
    return undefined;
  }
}

/** Storico di un esercizio, dalla sessione più vecchia alla più recente. */
export function buildHistory(
  exerciseId: string,
  sessions: SessionLog[],
  sets: SetLog[],
): ExerciseHistoryEntry[] {
  const completate = sessions
    .filter((s) => s.status === 'completata' && s.id !== undefined)
    .sort((a, b) => a.sessionNumber - b.sessionNumber);

  return completate
    .map((s): ExerciseHistoryEntry | null => {
      const righe = sets
        .filter((x) => x.sessionId === s.id && x.exerciseId === exerciseId)
        .sort((a, b) => a.setIndex - b.setIndex);
      if (righe.length === 0) return null;
      return {
        sessionNumber: s.sessionNumber,
        prescribedReps: prescribedRepsFor(s.sessionNumber, exerciseId),
        sets: righe.map((r) => ({
          weightKg: r.weightKg,
          reps: r.reps,
          durationSec: r.durationSec,
          completed: r.completed,
        })),
      };
    })
    .filter((x): x is ExerciseHistoryEntry => x !== null);
}

/** Riga "Ultima volta: 8 kg × 12, 12, 11". */
export function lastTimeLabel(history: ExerciseHistoryEntry[]): string | null {
  const last = history[history.length - 1];
  if (!last) return null;
  const fatte = last.sets.filter((s) => s.completed);
  if (fatte.length === 0) return null;
  if (fatte.some((s) => typeof s.durationSec === 'number')) {
    return `Ultima volta: ${fatte.map((s) => `${s.durationSec ?? 0}"`).join(', ')}`;
  }
  const peso = fatte.find((s) => typeof s.weightKg === 'number')?.weightKg;
  const reps = fatte.map((s) => s.reps ?? 0).join(', ');
  return peso !== undefined
    ? `Ultima volta: ${String(peso).replace('.', ',')} kg × ${reps}`
    : `Ultima volta: ${reps} ripetizioni`;
}

export async function loadAll(): Promise<{ sessions: SessionLog[]; sets: SetLog[] }> {
  const [sessions, sets] = await Promise.all([db.sessions.toArray(), db.sets.toArray()]);
  return { sessions, sets };
}

/** Volume totale (kg × ripetizioni) delle serie completate di una sessione. */
export function volumeOf(sets: SetLog[]): number {
  return Math.round(
    sets
      .filter((s) => s.completed && s.weightKg && s.reps)
      .reduce((sum, s) => sum + (s.weightKg as number) * (s.reps as number), 0),
  );
}

/** Media mobile a 7 giorni del peso corporeo. */
export function movingAverage(
  points: { date: string; value: number }[],
  days = 7,
): { date: string; value: number; media: number }[] {
  const ordinati = [...points].sort((a, b) => a.date.localeCompare(b.date));
  return ordinati.map((p, i) => {
    const limite = new Date(p.date);
    limite.setDate(limite.getDate() - (days - 1));
    const finestra = ordinati
      .slice(0, i + 1)
      .filter((q) => new Date(q.date) >= limite)
      .map((q) => q.value);
    const media = finestra.reduce((a, b) => a + b, 0) / finestra.length;
    return { ...p, media: Math.round(media * 100) / 100 };
  });
}
