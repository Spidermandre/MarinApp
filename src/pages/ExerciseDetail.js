import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft } from 'lucide-react';
import { Card, Chip, Etichetta, Titolo } from '../components/ui';
import { exerciseById } from '../data/exercises';
import { db, getVideoUrl, setVideoUrl } from '../db/dexie';
import { buildHistory, lastTimeLabel } from '../lib/history';
import { vaiA } from '../lib/router';
export default function ExerciseDetail({ id }) {
    const ex = exerciseById(id);
    const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
    const sets = useLiveQuery(() => db.sets.toArray(), [], []);
    const [url, setUrl] = useState('');
    useEffect(() => {
        void getVideoUrl(id).then((v) => setUrl(v ?? ''));
    }, [id]);
    if (!ex) {
        return (_jsx(Card, { className: "mt-8 text-center", children: _jsx("p", { children: "Esercizio non trovato." }) }));
    }
    const storico = buildHistory(id, sessions, sets);
    const ultima = lastTimeLabel(storico);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("button", { type: "button", className: "btn-vetro", onClick: () => vaiA('esercizi'), children: [_jsx(ChevronLeft, { size: 18 }), " Esercizi"] }), _jsx(Titolo, { sub: `${ex.muscles.join(' · ')} — ${ex.equipment}`, children: ex.name }), ultima ? (_jsxs(Card, { children: [_jsx(Etichetta, { children: "Il tuo ultimo dato" }), _jsx("p", { className: "mt-1 font-display text-lg font-extrabold", children: ultima })] })) : null, _jsxs(Card, { children: [_jsx(Etichetta, { children: "Come si esegue" }), _jsx("ol", { className: "mt-2 space-y-2", children: ex.steps.map((s, i) => (_jsxs("li", { className: "flex gap-3 text-[15px] leading-relaxed", children: [_jsx("span", { className: "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-inchiostro text-xs font-extrabold text-giallo dark:bg-giallo dark:text-inchiostro", children: i + 1 }), _jsx("span", { children: s })] }, i))) })] }), ex.commonMistakes.length ? (_jsxs(Card, { children: [_jsx(Etichetta, { children: "Errori comuni" }), _jsx("ul", { className: "mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed", children: ex.commonMistakes.map((m, i) => (_jsx("li", { children: m }, i))) })] })) : null, ex.alternatives.length ? (_jsxs(Card, { children: [_jsx(Etichetta, { children: "Alternative" }), _jsx("ul", { className: "mt-2 flex flex-wrap gap-1.5", children: ex.alternatives.map((m, i) => (_jsx("li", { children: _jsx(Chip, { children: m }) }, i))) })] })) : null, _jsxs(Card, { children: [_jsx(Etichetta, { children: "Link video (facoltativo)" }), _jsx("p", { className: "soft mb-2 mt-1 text-sm", children: "L'app non include video. Puoi incollare il link a un video di tua scelta." }), _jsx("input", { className: "campo", type: "url", inputMode: "url", placeholder: "https://...", value: url, onChange: (e) => setUrl(e.target.value) }), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("button", { type: "button", className: "btn-vetro flex-1", onClick: () => void setVideoUrl(id, url.trim()), children: "Salva link" }), url ? (_jsx("a", { className: "btn-primario flex-1", href: url, target: "_blank", rel: "noreferrer", children: "Apri video" })) : null] })] })] }));
}
