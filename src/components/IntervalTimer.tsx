import { useCallback, useEffect, useRef, useState } from 'react';
import { Flag, Pause, Play, SkipForward } from 'lucide-react';
import { Card, Chip, Etichetta } from './ui';
import { beepEnd, beepPhase } from '../lib/audio';
import { buildIntervalPhases, formatClock, phaseAt, totalPhaseSeconds } from '../lib/timers';
import type { CardioBlock } from '../types';

interface Stato {
  startedAt: number;
  offsetSec: number;
  pausedAt?: number;
}

function leggi(key: string): Stato | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stato) : null;
  } catch {
    return null;
  }
}

function scrivi(key: string, s: Stato | null): void {
  try {
    if (s) localStorage.setItem(key, JSON.stringify(s));
    else localStorage.removeItem(key);
  } catch {
    /* ignorato */
  }
}

/**
 * Timer a fasi per il cardio a intervalli: riscaldamento → lavoro/recupero × N.
 * Il tempo trascorso è calcolato dall'istante di avvio, quindi il timer
 * continua anche passando a un'altra app.
 */
export default function IntervalTimer({
  cardio,
  storageKey,
  onDone,
}: {
  cardio: CardioBlock;
  storageKey: string;
  onDone: () => void;
}) {
  const fasi = buildIntervalPhases(cardio);
  const totale = totalPhaseSeconds(fasi);
  const [stato, setStato] = useState<Stato | null>(() => leggi(storageKey));
  const [, tick] = useState(0);
  const faseRef = useRef<number>(-1);
  const finitoRef = useRef(false);

  useEffect(() => {
    if (!stato || stato.pausedAt) return;
    const id = window.setInterval(() => tick((n) => n + 1), 200);
    const onVisible = () => tick((n) => n + 1);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [stato]);

  const trascorso = stato
    ? Math.max(
        0,
        ((stato.pausedAt ?? Date.now()) - stato.startedAt) / 1000 + stato.offsetSec,
      )
    : 0;
  const pos = phaseAt(fasi, trascorso);
  const finito = trascorso >= totale;

  // Beep al cambio fase e alla fine.
  useEffect(() => {
    if (!stato || finito) return;
    if (faseRef.current !== pos.index) {
      if (faseRef.current !== -1 && (pos.phase.kind === 'lavoro' || pos.phase.kind === 'recupero')) {
        beepPhase(pos.phase.kind);
      }
      faseRef.current = pos.index;
    }
  }, [pos.index, pos.phase.kind, stato, finito]);

  useEffect(() => {
    if (stato && finito && !finitoRef.current) {
      finitoRef.current = true;
      beepEnd();
      scrivi(storageKey, null);
      onDone();
    }
  }, [stato, finito, onDone, storageKey]);

  const aggiorna = useCallback(
    (s: Stato | null) => {
      scrivi(storageKey, s);
      setStato(s);
    },
    [storageKey],
  );

  const avvia = () => {
    finitoRef.current = false;
    faseRef.current = -1;
    aggiorna({ startedAt: Date.now(), offsetSec: 0 });
  };

  const pausaRiprendi = () => {
    if (!stato) return;
    if (stato.pausedAt) {
      aggiorna({
        startedAt: Date.now(),
        offsetSec: (stato.pausedAt - stato.startedAt) / 1000 + stato.offsetSec,
      });
    } else {
      aggiorna({ ...stato, pausedAt: Date.now() });
    }
  };

  const saltaFase = () => {
    if (!stato) return;
    const nuovoTrascorso = trascorso + pos.remaining;
    aggiorna({ startedAt: Date.now(), offsetSec: nuovoTrascorso, pausedAt: undefined });
  };

  const coloreFase =
    pos.phase?.kind === 'lavoro'
      ? 'bg-lavoro text-white'
      : pos.phase?.kind === 'recupero'
        ? 'bg-recupero text-white'
        : 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro';

  if (!stato) {
    return (
      <Card forte className="space-y-3">
        <Etichetta>Cardio a intervalli · {cardio.totalMin}&#8242;</Etichetta>
        <ul className="soft space-y-1 text-sm">
          {cardio.warmupMin ? <li>{cardio.warmupMin}&#8242; di riscaldamento facile</li> : null}
          {cardio.intervals ? (
            <li>
              {cardio.intervals.rounds} × ({cardio.intervals.workSec}&quot;{' '}
              {cardio.intervals.workTarget} / {cardio.intervals.restSec}&quot;{' '}
              {cardio.intervals.restTarget})
            </li>
          ) : null}
        </ul>
        <button type="button" className="btn-primario w-full text-lg" onClick={avvia}>
          <Play size={20} /> Avvia intervalli
        </button>
      </Card>
    );
  }

  return (
    <Card forte className="space-y-4">
      <div className={`rounded-[1.4rem] p-5 text-center ${coloreFase}`}>
        <p className="text-sm font-extrabold uppercase tracking-[0.2em]">{pos.phase.label}</p>
        <p className="cifre font-display text-[64px] font-extrabold leading-none">
          {formatClock(pos.remaining)}
        </p>
        <p className="text-sm font-semibold opacity-90">{pos.phase.target}</p>
        {pos.phase.round ? (
          <p className="mt-1 text-xs font-bold opacity-80">
            Giro {pos.phase.round} di {pos.phase.rounds}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-sm font-semibold">
        <span>
          Totale {formatClock(Math.max(0, totale - trascorso))} / {formatClock(totale)}
        </span>
        <Chip>{stato.pausedAt ? 'In pausa' : 'In corso'}</Chip>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-inchiostro dark:bg-giallo"
          style={{ width: `${Math.min(100, (trascorso / totale) * 100)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" className="btn-vetro px-2 text-sm" onClick={pausaRiprendi}>
          {stato.pausedAt ? <Play size={18} /> : <Pause size={18} />}
          {stato.pausedAt ? 'Riprendi' : 'Pausa'}
        </button>
        <button type="button" className="btn-vetro px-2 text-sm" onClick={saltaFase}>
          <SkipForward size={18} /> Salta
        </button>
        <button
          type="button"
          className="btn-primario px-2 text-sm"
          onClick={() => {
            scrivi(storageKey, null);
            setStato(null);
            onDone();
          }}
        >
          <Flag size={18} /> Fine
        </button>
      </div>
    </Card>
  );
}
