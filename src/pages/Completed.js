import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Etichetta, Titolo } from '../components/ui';
import { db } from '../db/dexie';
import { exercises } from '../data/exercises';
import { buildHistory } from '../lib/history';
import { vaiA } from '../lib/router';
/** Schermata mostrata dopo la sessione 24. */
export default function Completed() {
    const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
    const sets = useLiveQuery(() => db.sets.toArray(), [], []);
    const misure = useLiveQuery(() => db.measurements.toArray(), [], []);
    const ordinate = [...misure].sort((a, b) => a.date.localeCompare(b.date));
    const prima = ordinate[0];
    const ultima = ordinate[ordinate.length - 1];
    const confronti = exercises
        .filter((e) => e.category === 'forza' && !e.bodyweight)
        .map((e) => {
        const storico = buildHistory(e.id, sessions, sets);
        const pesi = storico
            .map((h) => Math.max(...h.sets.map((s) => s.weightKg ?? 0)))
            .filter((p) => p > 0);
        if (pesi.length === 0)
            return null;
        return { nome: e.name, iniziale: pesi[0], finale: pesi[pesi.length - 1] };
    })
        .filter((x) => x !== null);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Titolo, { sub: "24 sessioni, 12 settimane. Complimenti!", children: "Programma completato" }), prima && ultima && prima !== ultima ? (_jsxs(Card, { forte: true, children: [_jsx(Etichetta, { children: "Misure: prima e dopo" }), _jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [_jsx(Confronto, { titolo: "Peso", da: prima.weightKg, a: ultima.weightKg, unita: "kg" }), _jsx(Confronto, { titolo: "Vita", da: prima.waistCm, a: ultima.waistCm, unita: "cm" })] })] })) : null, _jsxs(Card, { children: [_jsx(Etichetta, { children: "Carichi: prima e dopo" }), _jsxs("ul", { className: "mt-2 space-y-2", children: [confronti.map((c) => (_jsxs("li", { className: "flex items-center justify-between gap-3 text-sm", children: [_jsx("span", { className: "truncate font-semibold", children: c.nome }), _jsxs("span", { className: "cifre shrink-0 font-extrabold", children: [String(c.iniziale).replace('.', ','), " \u2192 ", String(c.finale).replace('.', ','), " kg"] })] }, c.nome))), confronti.length === 0 ? _jsx("li", { className: "soft text-sm", children: "Nessun carico registrato." }) : null] })] }), _jsxs(Card, { children: [_jsx("p", { className: "text-[15px] leading-relaxed", children: "E adesso? Puoi ripetere la fase 3 aumentando i carichi, oppure azzerare il programma dalle impostazioni per ricominciare da capo con basi molto pi\u00F9 solide." }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx("button", { type: "button", className: "btn-vetro flex-1", onClick: () => vaiA('progressi'), children: "Vedi i progressi" }), _jsx("button", { type: "button", className: "btn-primario flex-1", onClick: () => vaiA('impostazioni'), children: "Impostazioni" })] })] })] }));
}
function Confronto({ titolo, da, a, unita, }) {
    if (da === undefined || a === undefined) {
        return (_jsxs("div", { className: "rounded-2xl bg-white/60 p-3 dark:bg-white/[0.07]", children: [_jsx("p", { className: "etichetta", children: titolo }), _jsx("p", { className: "soft mt-1 text-sm", children: "Dati non sufficienti" })] }));
    }
    const delta = Math.round((a - da) * 10) / 10;
    return (_jsxs("div", { className: "rounded-2xl bg-white/60 p-3 dark:bg-white/[0.07]", children: [_jsx("p", { className: "etichetta", children: titolo }), _jsxs("p", { className: "cifre font-display mt-1 text-lg font-extrabold", children: [da, " \u2192 ", a, " ", unita] }), _jsxs("p", { className: "soft text-sm font-semibold", children: [delta > 0 ? '+' : '', String(delta).replace('.', ','), " ", unita] })] }));
}
