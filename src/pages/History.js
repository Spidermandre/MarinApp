import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { Chip, Etichetta, Foglio, StatoVuoto, Titolo } from '../components/ui';
import { db } from '../db/dexie';
import { exerciseName } from '../data/exercises';
import { formatClock } from '../lib/timers';
import { vaiA } from '../lib/router';
export default function History() {
    const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
    const sets = useLiveQuery(() => db.sets.toArray(), [], []);
    const [dettaglio, setDettaglio] = useState(null);
    const chiuse = sessions
        .filter((s) => s.status !== 'in_corso')
        .sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1));
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("button", { type: "button", className: "btn-vetro", onClick: () => vaiA('progressi'), children: [_jsx(ChevronLeft, { size: 18 }), " Progressi"] }), _jsx(Titolo, { sub: `${chiuse.filter((s) => s.status === 'completata').length} sessioni completate`, children: "Storico" }), chiuse.length === 0 ? (_jsx(StatoVuoto, { titolo: "Ancora nessuna sessione", testo: "Quando completi il primo allenamento lo ritrovi qui, con carichi e note.", azione: _jsx("button", { type: "button", className: "btn-primario", onClick: () => vaiA(''), children: "Vai all'allenamento" }) })) : null, _jsx("ul", { className: "space-y-2", children: chiuse.map((s) => (_jsx("li", { children: _jsx("button", { type: "button", onClick: () => setDettaglio(s), className: "vetro w-full px-4 py-3 text-left", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("p", { className: "font-display text-base font-extrabold", children: ["Sessione ", s.sessionNumber, " \u00B7 ", s.workoutId] }), _jsx("p", { className: "soft text-sm", children: new Date(s.startedAt).toLocaleDateString('it-IT', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            }) })] }), s.status === 'saltata' ? (_jsx(Chip, { children: "Saltata" })) : (_jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "cifre font-display text-lg font-extrabold", children: [s.totalVolumeKg ?? 0, " kg"] }), _jsx("p", { className: "soft text-xs", children: formatClock(s.durationSec ?? 0) })] }))] }) }) }, s.id))) }), dettaglio ? (_jsxs(Foglio, { titolo: `Sessione ${dettaglio.sessionNumber} · ${dettaglio.workoutId}`, onClose: () => setDettaglio(null), children: [_jsxs("p", { className: "soft text-sm", children: [new Date(dettaglio.startedAt).toLocaleString('it-IT'), " \u00B7", ' ', formatClock(dettaglio.durationSec ?? 0)] }), dettaglio.sessionRpe ? (_jsxs("p", { className: "mt-2 text-sm font-semibold", children: ["Fatica percepita: ", dettaglio.sessionRpe, "/10"] })) : null, dettaglio.notes ? (_jsxs("div", { className: "mt-3", children: [_jsx(Etichetta, { children: "Note" }), _jsx("p", { className: "mt-1 text-[15px] leading-relaxed", children: dettaglio.notes })] })) : null, _jsx("div", { className: "mt-4 space-y-2", children: raggruppaPerEsercizio(sets.filter((x) => x.sessionId === dettaglio.id)).map((g) => (_jsxs("div", { className: "rounded-2xl bg-white/55 p-3 dark:bg-white/[0.07]", children: [_jsx("p", { className: "font-display text-base font-extrabold", children: exerciseName(g.exerciseId) }), _jsx("p", { className: "soft cifre text-sm", children: g.riga })] }, g.exerciseId))) }), _jsxs("button", { type: "button", className: "btn-vetro mt-5 w-full text-red-700 dark:text-red-300", onClick: async () => {
                            if (!dettaglio.id)
                                return;
                            if (!confirm('Eliminare questa sessione dallo storico?'))
                                return;
                            await db.sets.where('sessionId').equals(dettaglio.id).delete();
                            await db.sessions.delete(dettaglio.id);
                            setDettaglio(null);
                        }, children: [_jsx(Trash2, { size: 18 }), " Elimina sessione"] })] })) : null] }));
}
function raggruppaPerEsercizio(righe) {
    const mappa = new Map();
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
