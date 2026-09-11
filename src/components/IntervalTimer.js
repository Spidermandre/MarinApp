import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Flag, Pause, Play, SkipForward } from 'lucide-react';
import { Card, Chip, Etichetta } from './ui';
import { beepEnd, beepPhase } from '../lib/audio';
import { buildIntervalPhases, formatClock, phaseAt, totalPhaseSeconds } from '../lib/timers';
function leggi(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
function scrivi(key, s) {
    try {
        if (s)
            localStorage.setItem(key, JSON.stringify(s));
        else
            localStorage.removeItem(key);
    }
    catch {
        /* ignorato */
    }
}
/**
 * Timer a fasi per il cardio a intervalli: riscaldamento → lavoro/recupero × N.
 * Il tempo trascorso è calcolato dall'istante di avvio, quindi il timer
 * continua anche passando a un'altra app.
 */
export default function IntervalTimer({ cardio, storageKey, onDone, }) {
    const fasi = buildIntervalPhases(cardio);
    const totale = totalPhaseSeconds(fasi);
    const [stato, setStato] = useState(() => leggi(storageKey));
    const [, tick] = useState(0);
    const faseRef = useRef(-1);
    const finitoRef = useRef(false);
    useEffect(() => {
        if (!stato || stato.pausedAt)
            return;
        const id = window.setInterval(() => tick((n) => n + 1), 200);
        const onVisible = () => tick((n) => n + 1);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.clearInterval(id);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [stato]);
    const trascorso = stato
        ? Math.max(0, ((stato.pausedAt ?? Date.now()) - stato.startedAt) / 1000 + stato.offsetSec)
        : 0;
    const pos = phaseAt(fasi, trascorso);
    const finito = trascorso >= totale;
    // Beep al cambio fase e alla fine.
    useEffect(() => {
        if (!stato || finito)
            return;
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
    const aggiorna = useCallback((s) => {
        scrivi(storageKey, s);
        setStato(s);
    }, [storageKey]);
    const avvia = () => {
        finitoRef.current = false;
        faseRef.current = -1;
        aggiorna({ startedAt: Date.now(), offsetSec: 0 });
    };
    const pausaRiprendi = () => {
        if (!stato)
            return;
        if (stato.pausedAt) {
            aggiorna({
                startedAt: Date.now(),
                offsetSec: (stato.pausedAt - stato.startedAt) / 1000 + stato.offsetSec,
            });
        }
        else {
            aggiorna({ ...stato, pausedAt: Date.now() });
        }
    };
    const saltaFase = () => {
        if (!stato)
            return;
        const nuovoTrascorso = trascorso + pos.remaining;
        aggiorna({ startedAt: Date.now(), offsetSec: nuovoTrascorso, pausedAt: undefined });
    };
    const coloreFase = pos.phase?.kind === 'lavoro'
        ? 'bg-lavoro text-white'
        : pos.phase?.kind === 'recupero'
            ? 'bg-recupero text-white'
            : 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro';
    if (!stato) {
        return (_jsxs(Card, { forte: true, className: "space-y-3", children: [_jsxs(Etichetta, { children: ["Cardio a intervalli \u00B7 ", cardio.totalMin, "\u2032"] }), _jsxs("ul", { className: "soft space-y-1 text-sm", children: [cardio.warmupMin ? _jsxs("li", { children: [cardio.warmupMin, "\u2032 di riscaldamento facile"] }) : null, cardio.intervals ? (_jsxs("li", { children: [cardio.intervals.rounds, " \u00D7 (", cardio.intervals.workSec, "\"", ' ', cardio.intervals.workTarget, " / ", cardio.intervals.restSec, "\"", ' ', cardio.intervals.restTarget, ")"] })) : null] }), _jsxs("button", { type: "button", className: "btn-primario w-full text-lg", onClick: avvia, children: [_jsx(Play, { size: 20 }), " Avvia intervalli"] })] }));
    }
    return (_jsxs(Card, { forte: true, className: "space-y-4", children: [_jsxs("div", { className: `rounded-[1.4rem] p-5 text-center ${coloreFase}`, children: [_jsx("p", { className: "text-sm font-extrabold uppercase tracking-[0.2em]", children: pos.phase.label }), _jsx("p", { className: "cifre font-display text-[64px] font-extrabold leading-none", children: formatClock(pos.remaining) }), _jsx("p", { className: "text-sm font-semibold opacity-90", children: pos.phase.target }), pos.phase.round ? (_jsxs("p", { className: "mt-1 text-xs font-bold opacity-80", children: ["Giro ", pos.phase.round, " di ", pos.phase.rounds] })) : null] }), _jsxs("div", { className: "flex items-center justify-between text-sm font-semibold", children: [_jsxs("span", { children: ["Totale ", formatClock(Math.max(0, totale - trascorso)), " / ", formatClock(totale)] }), _jsx(Chip, { children: stato.pausedAt ? 'In pausa' : 'In corso' })] }), _jsx("div", { className: "h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10", children: _jsx("div", { className: "h-full rounded-full bg-inchiostro dark:bg-giallo", style: { width: `${Math.min(100, (trascorso / totale) * 100)}%` } }) }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("button", { type: "button", className: "btn-vetro px-2 text-sm", onClick: pausaRiprendi, children: [stato.pausedAt ? _jsx(Play, { size: 18 }) : _jsx(Pause, { size: 18 }), stato.pausedAt ? 'Riprendi' : 'Pausa'] }), _jsxs("button", { type: "button", className: "btn-vetro px-2 text-sm", onClick: saltaFase, children: [_jsx(SkipForward, { size: 18 }), " Salta"] }), _jsxs("button", { type: "button", className: "btn-primario px-2 text-sm", onClick: () => {
                            scrivi(storageKey, null);
                            setStato(null);
                            onDone();
                        }, children: [_jsx(Flag, { size: 18 }), " Fine"] })] })] }));
}
