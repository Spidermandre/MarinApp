import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Info, Minus, Plus, X } from 'lucide-react';
export function Card({ children, className = '', forte = false, }) {
    return (_jsx("div", { className: `vetro ${forte ? 'vetro-forte' : ''} p-4 ${className}`, children: children }));
}
export function Titolo({ children, sub }) {
    return (_jsxs("div", { className: "mb-4", children: [_jsx("h1", { className: "font-display text-[28px] font-extrabold leading-tight tracking-tight", children: children }), sub ? _jsx("p", { className: "soft mt-1 text-sm", children: sub }) : null] }));
}
export function Etichetta({ children }) {
    return _jsx("div", { className: "etichetta", children: children });
}
export function Barra({ value, max, className = '', showLabel = false, }) {
    const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    return (_jsxs("div", { className: className, children: [_jsx("div", { className: "h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10", role: "progressbar", "aria-valuenow": Math.round(pct), "aria-valuemin": 0, "aria-valuemax": 100, children: _jsx("div", { className: "h-full rounded-full bg-inchiostro transition-[width] duration-500 dark:bg-giallo", style: { width: `${pct}%` } }) }), showLabel ? (_jsxs("div", { className: "soft mt-1 text-xs font-semibold", children: [Math.round(pct), "% \u00B7 ", value, " di ", max] })) : null] }));
}
export function Chip({ children, tono = 'neutro', }) {
    const stili = {
        neutro: 'bg-black/[0.07] dark:bg-white/10',
        scuro: 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro',
        lavoro: 'bg-lavoro text-white',
        recupero: 'bg-recupero text-white',
    };
    return (_jsx("span", { className: `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${stili[tono]}`, children: children }));
}
/** Spiegazione di un termine tecnico (RIR, RPE): icona "i" con pannello. */
export function InfoTermine({ termine, testo }) {
    const [aperto, setAperto] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => setAperto(true), "aria-label": `Cosa significa ${termine}`, className: "btn-piccolo -my-2 h-9 w-9 min-h-0 min-w-0 text-current/70", children: _jsx(Info, { size: 16 }) }), aperto ? (_jsx(Foglio, { titolo: `Cosa significa ${termine}`, onClose: () => setAperto(false), children: _jsx("p", { className: "text-[15px] leading-relaxed", children: testo }) })) : null] }));
}
/** Pannello a comparsa dal basso, stile iOS. */
export function Foglio({ titolo, children, onClose, }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-end justify-center", children: [_jsx("button", { type: "button", "aria-label": "Chiudi", onClick: onClose, className: "absolute inset-0 bg-black/35 backdrop-blur-[2px]" }), _jsxs("div", { className: "vetro vetro-forte animate-glass-in relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]", children: [_jsx("div", { className: "mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/20 dark:bg-white/25" }), _jsxs("div", { className: "mb-3 flex items-start justify-between gap-3", children: [_jsx("h2", { className: "font-display text-xl font-extrabold leading-tight", children: titolo }), _jsx("button", { type: "button", onClick: onClose, className: "btn-piccolo bg-black/[0.07] dark:bg-white/10", children: _jsx(X, { size: 18 }) })] }), children] })] }));
}
/** Selettore numerico con "+" e "−", area tattile grande. */
export function Stepper({ value, step = 1, min = 0, max = 500, suffix = '', onChange, disabled = false, placeholder = '—', }) {
    const arrotonda = (n) => Math.round(n * 100) / 100;
    const attuale = value ?? min;
    return (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("button", { type: "button", "aria-label": "Diminuisci", disabled: disabled, onClick: () => onChange(arrotonda(Math.max(min, attuale - step))), className: "btn-piccolo h-11 w-11 bg-black/[0.07] disabled:opacity-40 dark:bg-white/10", children: _jsx(Minus, { size: 18 }) }), _jsxs("div", { className: "min-w-[74px] rounded-2xl bg-white/70 px-2 py-2 text-center dark:bg-white/10", children: [_jsx("span", { className: "cifre text-lg font-extrabold", children: value === undefined ? placeholder : String(arrotonda(value)).replace('.', ',') }), suffix && value !== undefined ? (_jsx("span", { className: "soft ml-0.5 text-xs font-bold", children: suffix })) : null] }), _jsx("button", { type: "button", "aria-label": "Aumenta", disabled: disabled, onClick: () => onChange(arrotonda(Math.min(max, attuale + step))), className: "btn-piccolo h-11 w-11 bg-black/[0.07] disabled:opacity-40 dark:bg-white/10", children: _jsx(Plus, { size: 18 }) })] }));
}
export function StatoVuoto({ titolo, testo, azione }) {
    return (_jsxs(Card, { className: "text-center", children: [_jsx("p", { className: "font-display text-lg font-extrabold", children: titolo }), _jsx("p", { className: "soft mx-auto mt-1 max-w-xs text-sm leading-relaxed", children: testo }), azione ? _jsx("div", { className: "mt-4", children: azione }) : null] }));
}
/** Messaggio temporaneo in sovrimpressione. */
export function useToast() {
    const [msg, setMsg] = useState(null);
    const timer = useRef();
    const mostra = (testo) => {
        setMsg(testo);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setMsg(null), 2600);
    };
    const nodo = msg ? (_jsx("div", { className: "pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4", children: _jsx("div", { className: "vetro-scuro animate-glass-in px-4 py-3 text-sm font-semibold", children: msg }) })) : null;
    return { mostra, nodo };
}
