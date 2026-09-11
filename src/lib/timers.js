import { useCallback, useEffect, useRef, useState } from 'react';
import { beepCountdown, beepEnd } from './audio';
function readStored(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed?.endsAt !== 'number')
            return null;
        return parsed;
    }
    catch {
        return null;
    }
}
function writeStored(key, value) {
    try {
        if (value)
            localStorage.setItem(key, JSON.stringify(value));
        else
            localStorage.removeItem(key);
    }
    catch {
        /* storage pieno o non disponibile: il timer funziona comunque in memoria */
    }
}
export function useCountdown(storageKey, onFinish) {
    const [state, setState] = useState(() => readStored(storageKey));
    const [, forceTick] = useState(0);
    const lastBeepRef = useRef(-1);
    const finishRef = useRef(onFinish);
    finishRef.current = onFinish;
    const firedRef = useRef(false);
    // Tick indipendente dal timestamp: ricalcola sempre da Date.now().
    useEffect(() => {
        if (!state)
            return;
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
        if (!state)
            return;
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
    const start = useCallback((seconds, label) => {
        const next = {
            endsAt: Date.now() + seconds * 1000,
            totalSec: seconds,
            label,
        };
        lastBeepRef.current = -1;
        firedRef.current = false;
        writeStored(storageKey, next);
        setState(next);
    }, [storageKey]);
    const add = useCallback((seconds) => {
        setState((prev) => {
            if (!prev)
                return prev;
            const next = {
                ...prev,
                endsAt: prev.endsAt + seconds * 1000,
                totalSec: prev.totalSec + seconds,
            };
            lastBeepRef.current = -1;
            writeStored(storageKey, next);
            return next;
        });
    }, [storageKey]);
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
/** Costruisce la sequenza di fasi di un blocco cardio a intervalli. */
export function buildIntervalPhases(cardio) {
    const phases = [];
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
export function totalPhaseSeconds(phases) {
    return phases.reduce((sum, p) => sum + p.seconds, 0);
}
/** Posizione all'interno della sequenza di fasi, dato il tempo trascorso. */
export function phaseAt(phases, elapsedSec) {
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
export function formatClock(totalSeconds) {
    const s = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
}
/** Tiene lo schermo acceso durante l'allenamento, dove supportato. */
export function useWakeLock(active) {
    useEffect(() => {
        if (!active)
            return;
        let sentinel = null;
        let cancelled = false;
        const request = async () => {
            try {
                const wl = navigator.wakeLock;
                if (!wl)
                    return;
                const s = await wl.request('screen');
                if (cancelled)
                    void s.release();
                else
                    sentinel = s;
            }
            catch {
                /* non supportata o negata: si procede senza */
            }
        };
        void request();
        const onVisible = () => {
            if (document.visibilityState === 'visible')
                void request();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', onVisible);
            void sentinel?.release().catch(() => undefined);
        };
    }, [active]);
}
