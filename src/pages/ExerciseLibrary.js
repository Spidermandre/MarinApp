import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Card, Chip, Titolo } from '../components/ui';
import { exercises } from '../data/exercises';
import { vaiA } from '../lib/router';
const categorie = [
    { id: 'tutti', nome: 'Tutti' },
    { id: 'mobilita', nome: 'Mobilità' },
    { id: 'forza', nome: 'Forza' },
    { id: 'core', nome: 'Core' },
    { id: 'cardio', nome: 'Cardio' },
];
export default function ExerciseLibrary() {
    const [categoria, setCategoria] = useState('tutti');
    const [cerca, setCerca] = useState('');
    const elenco = useMemo(() => {
        const q = cerca.trim().toLowerCase();
        return exercises.filter((e) => {
            const okCat = categoria === 'tutti' || e.category === categoria;
            const okQ = !q ||
                e.name.toLowerCase().includes(q) ||
                e.muscles.some((m) => m.toLowerCase().includes(q)) ||
                e.equipment.toLowerCase().includes(q);
            return okCat && okQ;
        });
    }, [categoria, cerca]);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Titolo, { sub: `${exercises.length} esercizi con istruzioni passo passo`, children: "Esercizi" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 18, className: "absolute left-4 top-1/2 -translate-y-1/2 opacity-50" }), _jsx("input", { className: "campo pl-11", placeholder: "Cerca per nome, muscolo o attrezzo", value: cerca, onChange: (e) => setCerca(e.target.value) })] }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1", children: categorie.map((c) => (_jsx("button", { type: "button", onClick: () => setCategoria(c.id), className: `btn min-h-[44px] shrink-0 px-4 text-sm ${categoria === c.id
                        ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                        : 'bg-white/65 dark:bg-white/10'}`, children: c.nome }, c.id))) }), elenco.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsx("p", { className: "soft", children: "Nessun esercizio trovato." }) })) : null, _jsx("ul", { className: "space-y-2", children: elenco.map((e) => (_jsx("li", { children: _jsxs("button", { type: "button", onClick: () => vaiA(`esercizi/${e.id}`), className: "vetro flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left", children: [_jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate font-display text-base font-extrabold", children: e.name }), _jsx("p", { className: "soft truncate text-sm", children: e.muscles.join(' · ') })] }), _jsx(Chip, { children: categorie.find((c) => c.id === e.category)?.nome }), _jsx(ChevronRight, { size: 18, className: "shrink-0 opacity-50" })] }) }, e.id))) })] }));
}
