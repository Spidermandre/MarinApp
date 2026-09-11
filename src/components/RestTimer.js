import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus, SkipForward } from 'lucide-react';
import { formatClock } from '../lib/timers';
/**
 * Timer di recupero: barra fissa in basso, cifre grandi leggibili a un metro.
 * Il conteggio è basato su un istante di fine assoluto, quindi continua a
 * scorrere anche se passi a un'altra app o blocchi lo schermo.
 */
export default function RestTimer({ timer }) {
    if (!timer.running)
        return null;
    const pct = timer.totalSec > 0 ? (timer.remaining / timer.totalSec) * 100 : 0;
    const finale = timer.remaining <= 3;
    return (_jsx("div", { className: "fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))]", children: _jsxs("div", { className: "vetro vetro-forte animate-glass-in overflow-hidden p-4", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "etichetta truncate", children: timer.label ?? 'Recupero' }), _jsx("p", { className: `cifre font-display text-[44px] font-extrabold leading-none ${finale ? 'animate-pulsegiallo' : ''}`, children: formatClock(timer.remaining) })] }), _jsxs("div", { className: "flex shrink-0 gap-2", children: [_jsxs("button", { type: "button", className: "btn-vetro px-3", onClick: () => timer.add(15), children: [_jsx(Plus, { size: 16 }), " 15\""] }), _jsxs("button", { type: "button", className: "btn-primario px-3", onClick: timer.skip, children: [_jsx(SkipForward, { size: 16 }), " Salta"] })] })] }), _jsx("div", { className: "mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10", children: _jsx("div", { className: "h-full rounded-full bg-inchiostro transition-[width] duration-200 dark:bg-giallo", style: { width: `${pct}%` } }) })] }) }));
}
