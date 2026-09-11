import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarClock, ChevronRight, Clock, Play, SkipForward } from 'lucide-react';
import { Logo } from '../App';
import { Barra, Card, Chip, Etichetta } from '../components/ui';
import { db } from '../db/dexie';
import { phases, TOTAL_SESSIONS } from '../data/program';
import { exerciseName } from '../data/exercises';
import { vaiA } from '../lib/router';
import { hoursUntil48h, isProgramComplete, nextSessionNumber, phaseOfSession, sessionsThisWeek, weekOfSession, workoutForSession, } from '../lib/session-sequence';
export default function Home() {
    const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
    const inCorso = sessions.find((s) => s.status === 'in_corso');
    if (isProgramComplete(sessions)) {
        vaiA('completato');
    }
    const prossima = Math.min(nextSessionNumber(sessions), TOTAL_SESSIONS);
    const workout = workoutForSession(prossima);
    const fase = phases[phaseOfSession(prossima) - 1];
    const completate = sessions.filter((s) => s.status === 'completata').length;
    const oreMancanti = hoursUntil48h(sessions);
    const settimana = sessionsThisWeek(sessions);
    const iniziaSessione = async (numero) => {
        const esistente = sessions.find((s) => s.status === 'in_corso');
        if (esistente?.id) {
            vaiA(`allenamento/${esistente.sessionNumber}`);
            return;
        }
        await db.sessions.add({
            sessionNumber: numero,
            workoutId: workoutForSession(numero).id,
            startedAt: new Date().toISOString(),
            status: 'in_corso',
        });
        vaiA(`allenamento/${numero}`);
    };
    const saltaSessione = async () => {
        if (!confirm(`Contrassegnare la sessione ${prossima} come saltata?`))
            return;
        await db.sessions.add({
            sessionNumber: prossima,
            workoutId: workout.id,
            startedAt: new Date().toISOString(),
            finishedAt: new Date().toISOString(),
            status: 'saltata',
        });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { className: "flex items-center gap-3 pb-1", children: [_jsx(Logo, { size: 44 }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-display text-2xl font-extrabold leading-none", children: "Tonifica 12" }), _jsx("p", { className: "soft text-sm", children: "Ciao! Pronta ad allenarti?" })] })] }), inCorso ? (_jsxs(Card, { forte: true, className: "animate-glass-in", children: [_jsx(Etichetta, { children: "Sessione interrotta" }), _jsxs("p", { className: "mt-1 font-display text-lg font-extrabold", children: ["Hai la sessione ", inCorso.sessionNumber, " ancora aperta"] }), _jsx("p", { className: "soft mt-1 text-sm", children: "Vuoi riprenderla da dove eri rimasta?" }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsxs("button", { type: "button", className: "btn-primario flex-1", onClick: () => vaiA(`allenamento/${inCorso.sessionNumber}`), children: [_jsx(Play, { size: 18 }), " Riprendi"] }), _jsx("button", { type: "button", className: "btn-vetro", onClick: async () => {
                                    if (!inCorso.id)
                                        return;
                                    if (!confirm('Vuoi scartare la sessione in corso?'))
                                        return;
                                    await db.sets.where('sessionId').equals(inCorso.id).delete();
                                    await db.active.where('sessionId').equals(inCorso.id).delete();
                                    await db.sessions.delete(inCorso.id);
                                }, children: "Scarta" })] })] })) : null, _jsxs(Card, { children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs(Etichetta, { children: ["Fase ", fase.id, " \u00B7 ", fase.name] }), _jsxs("p", { className: "font-display mt-1 text-xl font-extrabold", children: ["Sessione ", prossima, " di ", TOTAL_SESSIONS] }), _jsxs("p", { className: "soft text-sm", children: ["Settimana ", weekOfSession(prossima), " di 12 \u00B7 ", fase.rir] })] }), _jsxs(Chip, { tono: "scuro", children: [completate, " fatte"] })] }), _jsx(Barra, { className: "mt-4", value: completate, max: TOTAL_SESSIONS, showLabel: true }), _jsxs("button", { type: "button", onClick: () => vaiA('programma'), className: "soft mt-3 flex w-full items-center justify-between text-sm font-semibold", children: ["Il tuo programma ", _jsx(ChevronRight, { size: 16 })] })] }), _jsxs(Card, { forte: true, children: [_jsx(Etichetta, { children: "Prossimo allenamento" }), _jsx("p", { className: "font-display mt-1 text-2xl font-extrabold leading-tight", children: workout.title }), _jsxs("div", { className: "soft mt-2 flex flex-wrap items-center gap-2 text-sm", children: [_jsxs(Chip, { children: [_jsx(Clock, { size: 13 }), " ~", workout.estimatedMin, " min"] }), _jsxs(Chip, { children: [workout.strength.length, " esercizi di forza"] }), _jsxs(Chip, { children: ["Core ", workout.core.rounds, " giri"] }), _jsxs(Chip, { children: ["Cardio ", workout.cardio.totalMin, "\u2032", ' ', workout.cardio.type === 'liss' ? 'zona 2' : 'a intervalli'] })] }), _jsx("ul", { className: "soft mt-3 space-y-1 text-sm", children: workout.strength.map((s, i) => (_jsxs("li", { className: "flex justify-between gap-3", children: [_jsx("span", { className: "truncate", children: exerciseName(s.exerciseId) }), _jsxs("span", { className: "cifre shrink-0 font-semibold", children: [s.sets, "\u00D7", s.reps ?? `${s.durationSec}"`] })] }, `${s.exerciseId}-${i}`))) }), oreMancanti > 0 ? (_jsxs("div", { className: "mt-4 flex items-start gap-2 rounded-2xl bg-black/[0.06] p-3 text-sm dark:bg-white/10", children: [_jsx(CalendarClock, { size: 18, className: "mt-0.5 shrink-0" }), _jsxs("p", { children: ["Dall'ultimo allenamento non sono ancora passate 48 ore (mancano ", oreMancanti, " h). Puoi allenarti lo stesso, ma il recupero aiuta i risultati."] })] })) : null, _jsxs("button", { type: "button", className: "btn-primario mt-4 w-full text-lg", onClick: () => void iniziaSessione(prossima), children: [_jsx(Play, { size: 20 }), " Inizia allenamento"] }), _jsxs("button", { type: "button", className: "soft mt-2 flex w-full items-center justify-center gap-2 py-2 text-sm font-semibold", onClick: () => void saltaSessione(), children: [_jsx(SkipForward, { size: 15 }), " Segna come saltata"] })] }), _jsxs(Card, { children: [_jsx(Etichetta, { children: "Questa settimana" }), _jsxs("div", { className: "mt-2 flex items-center gap-3", children: [_jsxs("p", { className: "font-display text-3xl font-extrabold", children: [settimana, _jsx("span", { className: "soft text-lg font-bold", children: " / 2" })] }), _jsxs("div", { className: "flex-1", children: [_jsx(Barra, { value: settimana, max: 2 }), _jsx("p", { className: "soft mt-1 text-xs", children: settimana >= 2
                                            ? 'Settimana completata, bravissima!'
                                            : 'Lascia almeno 48 ore tra un allenamento e l’altro (es. lunedì e giovedì).' })] })] })] }), _jsxs("button", { type: "button", onClick: () => vaiA('storico'), className: "vetro flex min-h-[56px] w-full items-center justify-between px-4 text-sm font-bold", children: ["Storico delle sessioni ", _jsx(ChevronRight, { size: 18 })] })] }));
}
