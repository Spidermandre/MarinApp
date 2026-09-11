import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, Dumbbell, House, Lightbulb, TrendingUp } from 'lucide-react';
import { useRoute, vaiA } from './lib/router';
import { db, ensureSeed, saveSettings } from './db/dexie';
import { configureFeedback, unlockAudio } from './lib/audio';
import { SAFETY_NOTICE } from './data/tips';
import Home from './pages/Home';
import Workout from './pages/Workout';
import ExerciseLibrary from './pages/ExerciseLibrary';
import ExerciseDetail from './pages/ExerciseDetail';
import History from './pages/History';
import Progress from './pages/Progress';
import Tips from './pages/Tips';
import Program from './pages/Program';
import SettingsPage from './pages/Settings';
import Completed from './pages/Completed';
const voci = [
    { id: 'home', etichetta: 'Oggi', icona: House, path: '' },
    { id: 'esercizi', etichetta: 'Esercizi', icona: Dumbbell, path: 'esercizi' },
    { id: 'progressi', etichetta: 'Progressi', icona: TrendingUp, path: 'progressi' },
    { id: 'consigli', etichetta: 'Consigli', icona: Lightbulb, path: 'consigli' },
    { id: 'impostazioni', etichetta: 'Profilo', icona: BookOpen, path: 'impostazioni' },
];
export default function App() {
    const route = useRoute();
    const [pronto, setPronto] = useState(false);
    const settings = useLiveQuery(() => db.settings.get(1), []);
    useEffect(() => {
        void ensureSeed().then(() => setPronto(true));
    }, []);
    // Tema chiaro/scuro/auto
    useEffect(() => {
        const tema = settings?.theme ?? 'auto';
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const applica = () => {
            const scuro = tema === 'scuro' || (tema === 'auto' && media.matches);
            document.documentElement.classList.toggle('dark', scuro);
            document
                .querySelector('meta[name="theme-color"]')
                ?.setAttribute('content', scuro ? '#14130B' : '#FFD400');
        };
        applica();
        media.addEventListener('change', applica);
        return () => media.removeEventListener('change', applica);
    }, [settings?.theme]);
    useEffect(() => {
        configureFeedback({ sound: settings?.sound ?? true, vibration: settings?.vibration ?? true });
    }, [settings?.sound, settings?.vibration]);
    // L'audio dei timer va sbloccato dal primo gesto dell'utente.
    useEffect(() => {
        const sblocca = () => unlockAudio();
        document.addEventListener('pointerdown', sblocca, { once: true });
        return () => document.removeEventListener('pointerdown', sblocca);
    }, []);
    if (!pronto || !settings) {
        return (_jsx("div", { className: "flex min-h-full items-center justify-center p-8", children: _jsx("p", { className: "font-display text-xl font-extrabold", children: "Tonifica 12" }) }));
    }
    if (!settings.safetyNoticeSeen) {
        return _jsx(AvvisoSicurezza, { onOk: () => void saveSettings({ safetyNoticeSeen: true }) });
    }
    const inAllenamento = route.name === 'allenamento';
    return (_jsxs("div", { className: "mx-auto min-h-full w-full max-w-lg", children: [_jsxs("main", { className: `px-4 pt-[calc(1rem+env(safe-area-inset-top))] ${inAllenamento ? 'pb-8' : 'pb-32'}`, children: [route.name === 'home' && _jsx(Home, {}), route.name === 'allenamento' && _jsx(Workout, { sessionNumber: route.sessione }), route.name === 'esercizi' && _jsx(ExerciseLibrary, {}), route.name === 'esercizio' && _jsx(ExerciseDetail, { id: route.id }), route.name === 'storico' && _jsx(History, {}), route.name === 'progressi' && _jsx(Progress, {}), route.name === 'consigli' && _jsx(Tips, {}), route.name === 'programma' && _jsx(Program, {}), route.name === 'impostazioni' && _jsx(SettingsPage, {}), route.name === 'completato' && _jsx(Completed, {})] }), !inAllenamento ? _jsx(BarraNavigazione, { attiva: route.name }) : null] }));
}
function BarraNavigazione({ attiva }) {
    return (_jsx("nav", { className: "fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))]", children: _jsx("div", { className: "vetro vetro-forte flex items-stretch justify-between gap-1 p-1.5", children: voci.map((v) => {
                const Icona = v.icona;
                const attivo = attiva === v.id ||
                    (v.id === 'progressi' && attiva === 'storico') ||
                    (v.id === 'esercizi' && attiva === 'esercizio') ||
                    (v.id === 'home' && (attiva === 'programma' || attiva === 'completato'));
                return (_jsxs("button", { type: "button", onClick: () => vaiA(v.path), "aria-current": attivo ? 'page' : undefined, className: `flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] px-1 transition ${attivo ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro' : 'soft'}`, children: [_jsx(Icona, { size: 20 }), _jsx("span", { className: "text-[10px] font-bold tracking-wide", children: v.etichetta })] }, v.id));
            }) }) }));
}
function AvvisoSicurezza({ onOk }) {
    return (_jsx("div", { className: "mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-5 p-5", children: _jsxs("div", { className: "vetro vetro-forte animate-glass-in p-6", children: [_jsxs("div", { className: "mb-4 flex items-center gap-3", children: [_jsx(Logo, {}), _jsxs("div", { children: [_jsx("p", { className: "font-display text-2xl font-extrabold leading-none", children: "Tonifica 12" }), _jsx("p", { className: "soft text-sm", children: "12 settimane, 2 volte a settimana" })] })] }), _jsx("h1", { className: "font-display mb-2 text-lg font-extrabold", children: "Prima di iniziare" }), _jsx("p", { className: "text-[15px] leading-relaxed", children: SAFETY_NOTICE }), _jsx("button", { type: "button", className: "btn-primario mt-6 w-full", onClick: onOk, children: "Ho capito, iniziamo" })] }) }));
}
export function Logo({ size = 48 }) {
    return (_jsx("div", { className: "flex items-center justify-center rounded-2xl bg-inchiostro", style: { width: size, height: size }, "aria-hidden": true, children: _jsx("span", { className: "font-display text-giallo", style: { fontSize: size * 0.42, fontWeight: 800 }, children: "MR" }) }));
}
