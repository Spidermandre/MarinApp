import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { ChevronRight, Ruler, Scale } from 'lucide-react';
import { Barra, Card, Chip, Etichetta, StatoVuoto, Stepper, Titolo } from '../components/ui';
import { db } from '../db/dexie';
import { exerciseName, exercises } from '../data/exercises';
import { TOTAL_SESSIONS } from '../data/program';
import { buildHistory, movingAverage } from '../lib/history';
import { vaiA } from '../lib/router';
import { formatClock } from '../lib/timers';
const oggi = () => new Date().toISOString().slice(0, 10);
export default function Progress() {
    const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
    const sets = useLiveQuery(() => db.sets.toArray(), [], []);
    const misure = useLiveQuery(() => db.measurements.toArray(), [], []);
    const completate = sessions.filter((s) => s.status === 'completata');
    const esercizioIdIniziale = exercises.find((e) => !e.bodyweight && e.category === 'forza')?.id ?? 'leg-press';
    const [esercizioId, setEsercizioId] = useState(esercizioIdIniziale);
    const serieForza = useMemo(() => {
        const storico = buildHistory(esercizioId, sessions, sets);
        return storico
            .map((h) => {
            const pesi = h.sets.filter((s) => s.completed && s.weightKg);
            const migliore = pesi.length ? Math.max(...pesi.map((s) => s.weightKg)) : 0;
            const reps = pesi.find((s) => s.weightKg === migliore)?.reps ?? 0;
            return { sessione: `S${h.sessionNumber}`, kg: migliore, reps };
        })
            .filter((p) => p.kg > 0);
    }, [esercizioId, sessions, sets]);
    const tenute = useMemo(() => {
        const dati = ['plank', 'side-plank'].map((id) => ({
            id,
            punti: buildHistory(id, sessions, sets)
                .map((h) => ({
                sessione: `S${h.sessionNumber}`,
                sec: Math.max(...h.sets.map((s) => s.durationSec ?? 0)),
            }))
                .filter((p) => p.sec > 0),
        }));
        return dati.filter((d) => d.punti.length > 0);
    }, [sessions, sets]);
    const pesi = useMemo(() => movingAverage(misure
        .filter((m) => typeof m.weightKg === 'number')
        .map((m) => ({ date: m.date, value: m.weightKg }))).map((p) => ({ data: p.date.slice(5), peso: p.value, media: p.media })), [misure]);
    const vita = useMemo(() => misure
        .filter((m) => typeof m.waistCm === 'number')
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((m) => ({ data: m.date.slice(5), cm: m.waistCm })), [misure]);
    const ultimaVita = misure
        .filter((m) => m.waistCm)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
    const giorniDaVita = ultimaVita
        ? Math.floor((Date.now() - new Date(ultimaVita.date).getTime()) / 86400000)
        : null;
    const volumeTotale = completate.reduce((s, x) => s + (x.totalVolumeKg ?? 0), 0);
    const tempoTotale = completate.reduce((s, x) => s + (x.durationSec ?? 0), 0);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Titolo, { sub: "Come sta andando il programma", children: "Progressi" }), _jsxs(Card, { forte: true, children: [_jsx(Etichetta, { children: "Programma" }), _jsxs("div", { className: "mt-1 grid grid-cols-3 gap-2 text-center", children: [_jsx(Dato, { valore: `${completate.length}`, etichetta: `su ${TOTAL_SESSIONS} sessioni` }), _jsx(Dato, { valore: `${Math.round(volumeTotale / 1000)}t`, etichetta: "volume sollevato" }), _jsx(Dato, { valore: formatClock(tempoTotale), etichetta: "tempo in palestra" })] }), _jsx(Barra, { className: "mt-3", value: completate.length, max: TOTAL_SESSIONS, showLabel: true })] }), completate.length === 0 ? (_jsx(StatoVuoto, { titolo: "Nessun dato ancora", testo: "Completa la prima sessione: da l\u00EC in poi qui vedrai i carichi che crescono, le tenute del plank e l'andamento di peso e vita.", azione: _jsx("button", { type: "button", className: "btn-primario", onClick: () => vaiA(''), children: "Inizia la prima sessione" }) })) : null, completate.length > 0 ? (_jsxs(Card, { children: [_jsx(Etichetta, { children: "Carico nel tempo" }), _jsx("select", { className: "campo mt-2", value: esercizioId, onChange: (e) => setEsercizioId(e.target.value), children: exercises
                            .filter((e) => e.category === 'forza' && !e.bodyweight)
                            .map((e) => (_jsx("option", { value: e.id, children: e.name }, e.id))) }), serieForza.length === 0 ? (_jsxs("p", { className: "soft mt-3 text-sm", children: ["Nessun dato per ", exerciseName(esercizioId), ": comparir\u00E0 dopo la prima sessione in cui lo esegui."] })) : (_jsx(Grafico, { dati: serieForza, x: "sessione", linee: [{ key: 'kg', nome: 'Miglior serie (kg)' }] }))] })) : null, tenute.length > 0 ? (_jsxs(Card, { children: [_jsx(Etichetta, { children: "Tenuta plank e side plank" }), _jsx("div", { className: "mt-2 space-y-4", children: tenute.map((t) => (_jsxs("div", { children: [_jsx("p", { className: "mb-1 text-sm font-bold", children: exerciseName(t.id) }), _jsx(Grafico, { dati: t.punti, x: "sessione", linee: [{ key: 'sec', nome: 'Secondi' }] })] }, t.id))) })] })) : null, _jsx(MisureCorporee, {}), pesi.length > 1 ? (_jsxs(Card, { children: [_jsx(Etichetta, { children: "Peso e media a 7 giorni" }), _jsx(Grafico, { dati: pesi, x: "data", linee: [
                            { key: 'peso', nome: 'Peso (kg)', tratteggio: true },
                            { key: 'media', nome: 'Media 7 giorni' },
                        ] }), _jsx("p", { className: "soft mt-2 text-xs leading-relaxed", children: "Guarda la media, non il singolo valore: le oscillazioni giornaliere sono normali." })] })) : null, vita.length > 1 ? (_jsxs(Card, { children: [_jsx(Etichetta, { children: "Circonferenza vita" }), _jsx(Grafico, { dati: vita, x: "data", linee: [{ key: 'cm', nome: 'Vita (cm)' }] })] })) : null, giorniDaVita !== null && giorniDaVita >= 14 ? (_jsx(Card, { children: _jsxs("p", { className: "text-[15px] font-semibold", children: ["Sono passati ", giorniDaVita, " giorni dall'ultima misura della vita: \u00E8 il momento di misurarla di nuovo, all'altezza dell'ombelico."] }) })) : null, _jsxs("button", { type: "button", onClick: () => vaiA('storico'), className: "vetro flex min-h-[56px] w-full items-center justify-between px-4 text-sm font-bold", children: ["Storico delle sessioni ", _jsx(ChevronRight, { size: 18 })] })] }));
}
function MisureCorporee() {
    const misure = useLiveQuery(() => db.measurements.toArray(), [], []);
    const profilo = useLiveQuery(() => db.profile.get(1), []);
    const [peso, setPeso] = useState(undefined);
    const [vita, setVita] = useState(undefined);
    const ultimoPeso = misure
        .filter((m) => m.weightKg)
        .sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg;
    const ultimaVita = misure
        .filter((m) => m.waistCm)
        .sort((a, b) => b.date.localeCompare(a.date))[0]?.waistCm;
    const salva = async () => {
        if (peso === undefined && vita === undefined)
            return;
        const data = oggi();
        const esistente = misure.find((m) => m.date === data);
        const record = {
            date: data,
            weightKg: peso ?? esistente?.weightKg,
            waistCm: vita ?? esistente?.waistCm,
        };
        if (esistente?.id)
            await db.measurements.update(esistente.id, record);
        else
            await db.measurements.add(record);
        setPeso(undefined);
        setVita(undefined);
    };
    return (_jsxs(Card, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Etichetta, { children: "Misure di oggi" }), _jsxs("div", { className: "flex gap-1.5", children: [ultimoPeso ? _jsxs(Chip, { children: [ultimoPeso, " kg"] }) : null, ultimaVita ? _jsxs(Chip, { children: ["vita ", ultimaVita, " cm"] }) : null] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Scale, { size: 20, className: "opacity-60" }), _jsx("span", { className: "flex-1 text-sm font-semibold", children: "Peso" }), _jsx(Stepper, { value: peso ?? ultimoPeso ?? profilo?.startWeightKg, step: 0.1, min: 30, max: 200, suffix: "kg", onChange: setPeso })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Ruler, { size: 20, className: "opacity-60" }), _jsx("span", { className: "flex-1 text-sm font-semibold", children: "Vita (ombelico)" }), _jsx(Stepper, { value: vita ?? ultimaVita ?? 80, step: 0.5, min: 40, max: 200, suffix: "cm", onChange: setVita })] }), _jsx("button", { type: "button", className: "btn-primario w-full", onClick: () => void salva(), children: "Salva misure di oggi" }), _jsx("p", { className: "soft text-xs leading-relaxed", children: "Pesati 2\u20133 volte a settimana al mattino a digiuno. Misura la vita ogni 2 settimane." })] }));
}
function Grafico({ dati, x, linee, }) {
    return (_jsx("div", { className: "mt-2 h-52 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: dati, margin: { top: 8, right: 8, bottom: 0, left: -18 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "currentColor", opacity: 0.15 }), _jsx(XAxis, { dataKey: x, tick: { fontSize: 11 }, stroke: "currentColor", opacity: 0.7 }), _jsx(YAxis, { tick: { fontSize: 11 }, stroke: "currentColor", opacity: 0.7, domain: ['auto', 'auto'] }), _jsx(Tooltip, { contentStyle: {
                            borderRadius: 16,
                            border: 'none',
                            background: 'rgba(17,17,17,0.92)',
                            color: '#FFD400',
                            fontWeight: 600,
                        } }), linee.map((l, i) => (_jsx(Line, { type: "monotone", dataKey: l.key, name: l.nome, stroke: i === 0 ? 'currentColor' : '#E4572E', strokeWidth: i === 0 ? 3 : 2, strokeDasharray: l.tratteggio ? '4 4' : undefined, dot: { r: 3 }, isAnimationActive: false }, l.key)))] }) }) }));
}
function Dato({ valore, etichetta }) {
    return (_jsxs("div", { className: "rounded-2xl bg-white/60 p-3 dark:bg-white/[0.07]", children: [_jsx("p", { className: "cifre font-display text-xl font-extrabold leading-none", children: valore }), _jsx("p", { className: "etichetta mt-1", children: etichetta })] }));
}
