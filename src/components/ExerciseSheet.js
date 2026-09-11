import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link2, ListChecks, Replace, TriangleAlert } from 'lucide-react';
import { Foglio } from './ui';
import { getVideoUrl, setVideoUrl } from '../db/dexie';
/** Pannello "Come si esegue": passi, errori comuni, alternative, link video. */
export default function ExerciseSheet({ exercise, onClose, }) {
    const [url, setUrl] = useState('');
    const [salvato, setSalvato] = useState(false);
    useEffect(() => {
        void getVideoUrl(exercise.id).then((v) => setUrl(v ?? ''));
    }, [exercise.id]);
    return (_jsxs(Foglio, { titolo: exercise.name, onClose: onClose, children: [_jsxs("p", { className: "soft text-sm", children: [exercise.muscles.join(' · '), " \u2014 ", exercise.equipment] }), _jsx(Sezione, { icona: _jsx(ListChecks, { size: 16 }), titolo: "Come si esegue", children: _jsx("ol", { className: "space-y-2", children: exercise.steps.map((s, i) => (_jsxs("li", { className: "flex gap-3 text-[15px] leading-relaxed", children: [_jsx("span", { className: "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-inchiostro text-xs font-extrabold text-giallo dark:bg-giallo dark:text-inchiostro", children: i + 1 }), _jsx("span", { children: s })] }, i))) }) }), exercise.commonMistakes.length ? (_jsx(Sezione, { icona: _jsx(TriangleAlert, { size: 16 }), titolo: "Errori comuni", children: _jsx("ul", { className: "list-disc space-y-1 pl-5 text-[15px] leading-relaxed", children: exercise.commonMistakes.map((m, i) => (_jsx("li", { children: m }, i))) }) })) : null, exercise.alternatives.length ? (_jsx(Sezione, { icona: _jsx(Replace, { size: 16 }), titolo: "Se la macchina \u00E8 occupata", children: _jsx("ul", { className: "list-disc space-y-1 pl-5 text-[15px] leading-relaxed", children: exercise.alternatives.map((m, i) => (_jsx("li", { children: m }, i))) }) })) : null, _jsxs(Sezione, { icona: _jsx(Link2, { size: 16 }), titolo: "Link video (facoltativo)", children: [_jsx("p", { className: "soft mb-2 text-sm", children: "L'app non include video. Se vuoi, incolla qui il link a un video di tua scelta." }), _jsx("input", { className: "campo", type: "url", inputMode: "url", placeholder: "https://...", value: url, onChange: (e) => {
                            setUrl(e.target.value);
                            setSalvato(false);
                        } }), _jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("button", { type: "button", className: "btn-vetro flex-1", onClick: async () => {
                                    await setVideoUrl(exercise.id, url.trim());
                                    setSalvato(true);
                                }, children: "Salva link" }), url ? (_jsx("a", { className: "btn-primario flex-1", href: url, target: "_blank", rel: "noreferrer", children: "Apri video" })) : null] }), salvato ? _jsx("p", { className: "soft mt-2 text-sm", children: "Link salvato." }) : null] })] }));
}
function Sezione({ icona, titolo, children, }) {
    return (_jsxs("section", { className: "mt-5", children: [_jsxs("h3", { className: "mb-2 flex items-center gap-2 font-display text-base font-extrabold", children: [icona, " ", titolo] }), children] }));
}
