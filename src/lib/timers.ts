import { useCallback, useEffect, useRef, useState } from 'react';
import { beepCountdown, beepEnd } from './audio';
import type { CardioBlock } from '../types';

/**
 * Tutti i timer sono basati su un istante di fine assoluto (timestamp), non
 * sul conteggio dei tick: così continuano a scorrere correttamente anche se
 * si passa a un'altra app o si spegne lo schermo. Lo stato è salvato in
 * localStorage, quindi sopravvive anche a un ricaricamento della pagina.
 */
interface StoredTimer {
  endsAt: number;
  totalSec: number;
  label?: string;
}

function readStored(key: string): StoredTimer | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredTimer;
    if (typeof parsed?.endsAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: StoredTimer | null): void {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    /* storage pieno o non disponibile: il timer funziona comunque in memoria */
  }
}

export interface CountdownApi {
  /** secondi mancanti (arrotondati per eccesso) */
  remaining: number;
  totalSec: number;
  running: boolean;
  label?: string;
  start: (seconds: number, label?: string) => void;
  add: (seconds: number) => void;
  skip: () => void;
  reset: () => void;
}

export function useCountdown(
  storageKey: string,
  onFinish?: () => void,
): CountdownApi {
  const [state, setState] = useState<StoredTimer | null>(() => readStored(storageKey));
  const [, forceTick] = useState(0);
  const lastBeepRef = useRef<number>(-1);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const firedRef = useRef(false);

  // Tick indipendente dal timestamp: ricalcola sempre da Date.now().
  useEffect(() => {
    if (!state) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 200);
    const onVisible = () => forceTick((n) => n + 1);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state]);

  const remainingMs = state ? Math.max(0, state.endsAt - Date.now()) : 0;
  const remaining = Math.ceil(remainingMs / 1000);

  // Beep negli ultimi 3 secondi e a zero.
  useEffect(() => {
    if (!state) return;
    if (remaining > 0 && remaining <= 3 && lastBeepRef.current !== remaining) {
      lastBeepRef.current = remaining;
      beepCountdown();
    }
    if (remainingMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      beepEnd();
      writeStored(storageKey, null);
      finishRef.current?.();
      setState(null);
    }
  }, [remaining, remainingMs, state, storageKey]);

  const start = useCallback(
    (seconds: number, label?: string) => {
      const next: StoredTimer = {
        endsAt: Date.now() + seconds * 1000,
        totalSec: seconds,
        label,
      };
      lastBeepRef.current = -1;
      firedRef.current = false;
      writeStored(storageKey, next);
      setState(next);
    },
    [storageKey],
  );

  const add = useCallback(
    (seconds: number) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          endsAt: prev.endsAt + seconds * 1000,
          totalSec: prev.totalSec + seconds,
        };
        lastBeepRef.current = -1;
        writeStored(storageKey, next);
        return next;
      });
    },
    [storageKey],
  );

  const skip = useCallback(() => {
    firedRef.current = true;
    writeStored(storageKey, null);
    setState(null);
    finishRef.current?.();
  }, [storageKey]);

  const reset = useCallback(() => {
    firedRef.current = true;
    writeStored(storageKey, null);
    setState(null);
  }, [storageKey]);

  return {
    remaining,
    totalSec: state?.totalSec ?? 0,
    running: !!state,
    label: state?.label,
    start,
    add,
    skip,
    reset,
  };
}

// --------------------------------------------------------- timer a fasi
export type PhaseKind = 'riscaldamento' | 'lavoro' | 'recupero' | 'defaticamento';

export interface TimerPhase {
  kind: PhaseKind;
  label: string;
  seconds: number;
  target?: string;
  round?: number;
  rounds?: number;
}

/** Costruisce la sequenza di fasi di un blocco cardio a intervalli. */
export function buildIntervalPhases(cardio: CardioBlock): TimerPhase[] {
  const phases: TimerPhase[] = [];
  if (cardio.warmupMin) {
    phases.push({
      kind: 'riscaldamento',
      label: 'RISCALDAMENTO',
      seconds: Math.round(cardio.warmupMin * 60),
      target: 'Ritmo facile',
    });
  }
  const iv = cardio.intervals;
  if (iv) {
    for (let r = 1; r <= iv.rounds; r += 1) {
      phases.push({
        kind: 'lavoro',
        label: 'LAVORO',
        seconds: iv.workSec,
        target: iv.workTarget,
        round: r,
        rounds: iv.rounds,
      });
      phases.push({
        kind: 'recupero',
        label: 'RECUPERO',
        seconds: iv.restSec,
        target: iv.restTarget,
        round: r,
        rounds: iv.rounds,
      });
    }
  }
  if (cardio.cooldownMin) {
    phases.push({
      kind: 'defaticamento',
      label: 'DEFATICAMENTO',
      seconds: Math.round(cardio.cooldownMin * 60),
      target: 'Rallenta',
    });
  }
  return phases;
}

export function totalPhaseSeconds(phases: TimerPhase[]): number {
  return phases.reduce((sum, p) => sum + p.seconds, 0);
}

export interface PhasePosition {
  index: number;
  phase: TimerPhase;
  remaining: number;
  elapsedInPhase: number;
  done: boolean;
}

/** Posizione all'interno della sequenza di fasi, dato il tempo trascorso. */
export function phaseAt(phases: TimerPhase[], elapsedSec: number): PhasePosition {
  let acc = 0;
  for (let i = 0; i < phases.length; i += 1) {
    const p = phases[i];
    if (elapsedSec < acc + p.seconds) {
      const elapsedInPhase = elapsedSec - acc;
      return {
        index: i,
        phase: p,
        remaining: Math.ceil(p.seconds - elapsedInPhase),
        elapsedInPhase,
        done: false,
      };
    }
    acc += p.seconds;
  }
  const lastPhase = phases[phases.length - 1];
  return {
    index: phases.length - 1,
    phase: lastPhase,
    remaining: 0,
    elapsedInPhase: lastPhase?.seconds ?? 0,
    done: true,
  };
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Tiene lo schermo acceso durante l'allenamento, dove supportato. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    let sentinel: { release: () => Promise<void> } | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const wl = (navigator as unknown as {
          wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> };
        }).wakeLock;
        if (!wl) return;
        const s = await wl.request('screen');
        if (cancelled) void s.release();
        else sentinel = s;
      } catch {
        /* non supportata o negata: si procede senza */
      }
    };

    void request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
