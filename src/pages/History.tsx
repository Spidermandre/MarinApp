import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { Chip, Etichetta, Foglio, StatoVuoto, Titolo } from '../components/ui';
import { db } from '../db/dexie';
import { exerciseName } from '../data/exercises';
import { formatClock } from '../lib/timers';
import { vaiA } from '../lib/router';
import type { SessionLog } from '../types';

export default function History() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const sets = useLiveQuery(() => db.sets.toArray(), [], []);
  const [dettaglio, setDettaglio] = useState<SessionLog | null>(null);

  const chiuse = sessions
    .filter((s) => s.status !== 'in_corso')
    .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1));

  return (
    <div className="space-y-3">
      <button type="button" className="btn-vetro" onClick={() => vaiA('progressi')}>
        <ChevronLeft size={18} /> Progressi
      </button>
      <Titolo sub={`${chiuse.filter((s) => s.status === 'completata').length} sessioni completate`}>
        Storico
      </Titolo>

      {chiuse.length === 0 ? (
        <StatoVuoto
          titolo="Ancora nessuna sessione"
          testo="Quando completi il primo allenamento lo ritrovi qui, con carichi e note."
          azione={
            <button type="button" className="btn-primario" onClick={() => vaiA('')}>
              Vai all&apos;allenamento
            </button>
          }
        />
      ) : null}

      <ul className="space-y-2">
        {chiuse.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setDettaglio(s)}
              className="vetro w-full px-4 py-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-base font-extrabold">
                    Sessione {s.sessionNumber} · {s.workoutId}
                  </p>
                  <p className="soft text-sm">
                    {new Date(s.startedAt).toLocaleDateString('it-IT', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {s.status === 'saltata' ? (
                  <Chip>Saltata</Chip>
                ) : (
                  <div className="text-right">
                    <p className="cifre font-display text-lg font-extrabold">
                      {s.totalVolumeKg ?? 0} kg
                    </p>
                    <p className="soft text-xs">{formatClock(s.durationSec ?? 0)}</p>
                  </div>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>

      {dettaglio ? (
        <Foglio
          titolo={`Sessione ${dettaglio.sessionNumber} · ${dettaglio.workoutId}`}
          onClose={() => setDettaglio(null)}
        >
          <p className="soft text-sm">
            {new Date(dettaglio.startedAt).toLocaleString('it-IT')} ·{' '}
            {formatClock(dettaglio.durationSec ?? 0)}
          </p>
          {dettaglio.sessionRpe ? (
            <p className="mt-2 text-sm font-semibold">Fatica percepita: {dettaglio.sessionRpe}/10</p>
          ) : null}
          {dettaglio.notes ? (
            <div className="mt-3">
              <Etichetta>Note</Etichetta>
              <p className="mt-1 text-[15px] leading-relaxed">{dettaglio.notes}</p>
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {raggruppaPerEsercizio(sets.filter((x) => x.sessionId === dettaglio.id)).map((g) => (
              <div key={g.exerciseId} className="rounded-2xl bg-white/55 p-3 dark:bg-white/[0.07]">
                <p className="font-display text-base font-extrabold">{exerciseName(g.exerciseId)}</p>
                <p className="soft cifre text-sm">{g.riga}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-vetro mt-5 w-full text-red-700 dark:text-red-300"
            onClick={async () => {
              if (!dettaglio.id) return;
              if (!confirm('Eliminare questa sessione dallo storico?')) return;
              await db.sets.where('sessionId').equals(dettaglio.id).delete();
              await db.sessions.delete(dettaglio.id);
              setDettaglio(null);
            }}
          >
            <Trash2 size={18} /> Elimina sessione
          </button>
        </Foglio>
      ) : null}
    </div>
  );
}

function raggruppaPerEsercizio(
  righe: { exerciseId: string; weightKg?: number; reps?: number; durationSec?: number; completed: boolean }[],
): { exerciseId: string; riga: string }[] {
  const mappa = new Map<string, typeof righe>();
  righe
    .filter((r) => r.completed)
    .forEach((r) => {
      const arr = mappa.get(r.exerciseId) ?? [];
      arr.push(r);
      mappa.set(r.exerciseId, arr);
    });
  return [...mappa.entries()].map(([exerciseId, arr]) => {
    if (arr.some((a) => a.durationSec)) {
      return { exerciseId, riga: arr.map((a) => `${a.durationSec ?? 0}"`).join(' · ') };
    }
    const peso = arr.find((a) => a.weightKg !== undefined)?.weightKg;
    const reps = arr.map((a) => a.reps ?? 0).join(', ');
    return {
      exerciseId,
      riga: peso !== undefined ? `${String(peso).replace('.', ',')} kg × ${reps}` : `${reps} rip.`,
    };
  });
}
