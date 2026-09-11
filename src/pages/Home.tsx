import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarClock, ChevronRight, Clock, Play, SkipForward } from 'lucide-react';
import { Logo } from '../App';
import { Barra, Card, Chip, Etichetta } from '../components/ui';
import { db } from '../db/dexie';
import { phases, TOTAL_SESSIONS } from '../data/program';
import { exerciseName } from '../data/exercises';
import { vaiA } from '../lib/router';
import {
  hoursUntil48h,
  isProgramComplete,
  letterOfSession,
  nextSessionNumber,
  phaseOfSession,
  sessionsThisWeek,
  weekOfSession,
  workoutOptionsForSession,
} from '../lib/session-sequence';
import type { Workout } from '../types';

export default function Home() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const inCorso = sessions.find((s) => s.status === 'in_corso');

  if (isProgramComplete(sessions)) {
    vaiA('completato');
  }

  const prossima = Math.min(nextSessionNumber(sessions), TOTAL_SESSIONS);
  const [allenamentoA, allenamentoB] = workoutOptionsForSession(prossima);
  const consigliata = letterOfSession(prossima);
  const fase = phases[phaseOfSession(prossima) - 1];
  const completate = sessions.filter((s) => s.status === 'completata').length;
  const oreMancanti = hoursUntil48h(sessions);
  const settimana = sessionsThisWeek(sessions);

  const iniziaSessione = async (numero: number, workout: Workout) => {
    const esistente = sessions.find((s) => s.status === 'in_corso');
    if (esistente?.id) {
      vaiA(`allenamento/${esistente.sessionNumber}`);
      return;
    }
    await db.sessions.add({
      sessionNumber: numero,
      workoutId: workout.id,
      startedAt: new Date().toISOString(),
      status: 'in_corso',
    });
    vaiA(`allenamento/${numero}`);
  };

  const saltaSessione = async () => {
    if (!confirm(`Contrassegnare la sessione ${prossima} come saltata?`)) return;
    await db.sessions.add({
      sessionNumber: prossima,
      workoutId: allenamentoA.id,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      status: 'saltata',
    });
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 pb-1">
        <Logo size={44} />
        <div className="flex-1">
          <p className="font-display text-2xl font-extrabold leading-none">Martina</p>
          <p className="soft text-sm">Ciao! Pronta ad allenarti?</p>
        </div>
      </header>

      {inCorso ? (
        <Card forte className="animate-glass-in">
          <Etichetta>Sessione interrotta</Etichetta>
          <p className="mt-1 font-display text-lg font-extrabold">
            Hai la sessione {inCorso.sessionNumber} ancora aperta
          </p>
          <p className="soft mt-1 text-sm">Vuoi riprenderla da dove eri rimasta?</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="btn-primario flex-1"
              onClick={() => vaiA(`allenamento/${inCorso.sessionNumber}`)}
            >
              <Play size={18} /> Riprendi
            </button>
            <button
              type="button"
              className="btn-vetro"
              onClick={async () => {
                if (!inCorso.id) return;
                if (!confirm('Vuoi scartare la sessione in corso?')) return;
                await db.sets.where('sessionId').equals(inCorso.id).delete();
                await db.active.where('sessionId').equals(inCorso.id).delete();
                await db.sessions.delete(inCorso.id);
              }}
            >
              Scarta
            </button>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Etichetta>Fase {fase.id} · {fase.name}</Etichetta>
            <p className="font-display mt-1 text-xl font-extrabold">
              Sessione {prossima} di {TOTAL_SESSIONS}
            </p>
            <p className="soft text-sm">
              Settimana {weekOfSession(prossima)} di 12 · {fase.rir}
            </p>
          </div>
          <Chip tono="scuro">{completate} fatte</Chip>
        </div>
        <Barra className="mt-4" value={completate} max={TOTAL_SESSIONS} showLabel />
        <button
          type="button"
          onClick={() => vaiA('programma')}
          className="soft mt-3 flex w-full items-center justify-between text-sm font-semibold"
        >
          Il tuo programma <ChevronRight size={16} />
        </button>
      </Card>

      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <Etichetta>Scegli l&apos;allenamento di oggi</Etichetta>
          <span className="soft text-xs font-semibold">Sessione {prossima} di {TOTAL_SESSIONS}</span>
        </div>

        {oreMancanti > 0 ? (
          <div className="vetro mb-3 flex items-start gap-2 p-3 text-sm">
            <CalendarClock size={18} className="mt-0.5 shrink-0" />
            <p>
              Dall'ultimo allenamento non sono ancora passate 48 ore (mancano {oreMancanti} h).
              Puoi allenarti lo stesso, ma il recupero aiuta i risultati.
            </p>
          </div>
        ) : null}

        <div className="space-y-3">
          {[allenamentoA, allenamentoB].map((w) => (
            <CartaAllenamento
              key={w.id}
              workout={w}
              consigliata={w.id.endsWith(consigliata)}
              onInizia={() => void iniziaSessione(prossima, w)}
            />
          ))}
        </div>

        <button
          type="button"
          className="soft mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold"
          onClick={() => void saltaSessione()}
        >
          <SkipForward size={15} /> Segna la sessione come saltata
        </button>
      </div>

      <Card>
        <Etichetta>Questa settimana</Etichetta>
        <div className="mt-2 flex items-center gap-3">
          <p className="font-display text-3xl font-extrabold">
            {settimana}
            <span className="soft text-lg font-bold"> / 2</span>
          </p>
          <div className="flex-1">
            <Barra value={settimana} max={2} />
            <p className="soft mt-1 text-xs">
              {settimana >= 2
                ? 'Settimana completata, bravissima!'
                : 'Lascia almeno 48 ore tra un allenamento e l’altro (es. lunedì e giovedì).'}
            </p>
          </div>
        </div>
      </Card>

      <button
        type="button"
        onClick={() => vaiA('storico')}
        className="vetro flex min-h-[56px] w-full items-center justify-between px-4 text-sm font-bold"
      >
        Storico delle sessioni <ChevronRight size={18} />
      </button>
    </div>
  );
}

/** Scheda selezionabile per un allenamento (A o B) tra cui l'utente sceglie. */
function CartaAllenamento({
  workout,
  consigliata,
  onInizia,
}: {
  workout: Workout;
  consigliata: boolean;
  onInizia: () => void;
}) {
  return (
    <Card forte>
      <div className="flex items-start justify-between gap-2">
        <p className="font-display text-xl font-extrabold leading-tight">{workout.title}</p>
        {consigliata ? <Chip tono="scuro">Consigliata</Chip> : null}
      </div>
      <div className="soft mt-2 flex flex-wrap items-center gap-2 text-sm">
        <Chip>
          <Clock size={13} /> ~{workout.estimatedMin} min
        </Chip>
        <Chip>{workout.strength.length} esercizi di forza</Chip>
        <Chip>Core {workout.core.rounds} giri</Chip>
        <Chip>
          Cardio {workout.cardio.totalMin}&#8242;{' '}
          {workout.cardio.type === 'liss' ? 'zona 2' : 'a intervalli'}
        </Chip>
      </div>

      <ul className="soft mt-3 space-y-1 text-sm">
        {workout.strength.map((s, i) => (
          <li key={`${s.exerciseId}-${i}`} className="flex justify-between gap-3">
            <span className="truncate">{exerciseName(s.exerciseId)}</span>
            <span className="cifre shrink-0 font-semibold">
              {s.sets}×{s.reps ?? `${s.durationSec}"`}
            </span>
          </li>
        ))}
      </ul>

      <button type="button" className="btn-primario mt-4 w-full text-lg" onClick={onInizia}>
        <Play size={20} /> Inizia allenamento {workout.id.slice(-1)}
      </button>
    </Card>
  );
}
