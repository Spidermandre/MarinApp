import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { Card, Etichetta, Stepper, Titolo, useToast } from '../components/ui';
import { db, exportBackup, importBackup, resetProgram, saveProfile, saveSettings, } from '../db/dexie';
export default function SettingsPage() {
    const profilo = useLiveQuery(() => db.profile.get(1), []);
    const impostazioni = useLiveQuery(() => db.settings.get(1), []);
    const file = useRef(null);
    const toast = useToast();
    if (!profilo || !impostazioni)
        return _jsx("p", { className: "soft p-6", children: "Carico\u2026" });
    const esporta = async () => {
        const dati = await exportBackup();
        const blob = new Blob([JSON.stringify(dati, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tonifica12-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.mostra('Backup esportato.');
    };
    const importa = async (f) => {
        try {
            const testo = await f.text();
            await importBackup(JSON.parse(testo));
            toast.mostra('Backup importato.');
        }
        catch (e) {
            toast.mostra(e instanceof Error ? e.message : 'File non valido.');
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Titolo, { sub: "Profilo, palestra e dati", children: "Impostazioni" }), _jsxs(Card, { className: "space-y-3", children: [_jsx(Etichetta, { children: "Il tuo profilo" }), _jsx(Riga, { etichetta: "Et\u00E0", children: _jsx(Stepper, { value: profilo.age, min: 14, max: 99, onChange: (v) => void saveProfile({ age: v }) }) }), _jsx(Riga, { etichetta: "Altezza", children: _jsx(Stepper, { value: profilo.heightCm, min: 120, max: 220, suffix: "cm", onChange: (v) => void saveProfile({ heightCm: v }) }) }), _jsx(Riga, { etichetta: "Peso iniziale", children: _jsx(Stepper, { value: profilo.startWeightKg, step: 0.5, min: 30, max: 200, suffix: "kg", onChange: (v) => void saveProfile({ startWeightKg: v }) }) }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "etichetta", children: "Obiettivo" }), _jsx("input", { className: "campo mt-1", value: profilo.goal, onChange: (e) => void saveProfile({ goal: e.target.value }) })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "etichetta", children: "Zona prioritaria" }), _jsx("input", { className: "campo mt-1", value: profilo.priorityArea, onChange: (e) => void saveProfile({ priorityArea: e.target.value }) })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "etichetta", children: "Note su infortuni ed esclusioni" }), _jsx("input", { className: "campo mt-1", value: profilo.excluded, onChange: (e) => void saveProfile({ excluded: e.target.value }) })] })] }), _jsxs(Card, { className: "space-y-3", children: [_jsx(Etichetta, { children: "La tua palestra" }), _jsx("p", { className: "soft text-sm", children: "Incrementi minimi disponibili: servono alla logica che suggerisce i carichi." }), _jsx(Riga, { etichetta: "Manubri", children: _jsx(Stepper, { value: impostazioni.dumbbellStepKg, step: 0.5, min: 0.5, max: 10, suffix: "kg", onChange: (v) => void saveSettings({ dumbbellStepKg: v }) }) }), _jsx(Riga, { etichetta: "Piastra macchine e cavi", children: _jsx(Stepper, { value: impostazioni.machinePlateKg, step: 0.5, min: 0.5, max: 20, suffix: "kg", onChange: (v) => void saveSettings({ machinePlateKg: v }) }) }), _jsx(Riga, { etichetta: "Leg press", children: _jsx(Stepper, { value: impostazioni.legPressStepKg, step: 1, min: 1, max: 25, suffix: "kg", onChange: (v) => void saveSettings({ legPressStepKg: v }) }) }), _jsx(Riga, { etichetta: "Bilanciere", children: _jsx(Stepper, { value: impostazioni.barbellStepKg, step: 0.5, min: 0.5, max: 10, suffix: "kg", onChange: (v) => void saveSettings({ barbellStepKg: v }) }) })] }), _jsxs(Card, { className: "space-y-3", children: [_jsx(Etichetta, { children: "App" }), _jsx(Interruttore, { etichetta: "Suoni del timer", attivo: impostazioni.sound, onChange: (v) => void saveSettings({ sound: v }) }), _jsx(Interruttore, { etichetta: "Vibrazione (dove supportata)", attivo: impostazioni.vibration, onChange: (v) => void saveSettings({ vibration: v }) }), _jsxs("div", { children: [_jsx("span", { className: "etichetta", children: "Tema" }), _jsx("div", { className: "mt-1 flex gap-2", children: ['auto', 'chiaro', 'scuro'].map((t) => (_jsx("button", { type: "button", onClick: () => void saveSettings({ theme: t }), className: `btn flex-1 text-sm ${impostazioni.theme === t
                                        ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                                        : 'bg-white/70 dark:bg-white/10'}`, children: t[0].toUpperCase() + t.slice(1) }, t))) })] })] }), _jsxs(Card, { className: "space-y-3", children: [_jsx(Etichetta, { children: "Dati" }), _jsx("p", { className: "soft text-sm", children: "Tutto resta sul telefono: nessun account, nessun server. Fai un backup ogni tanto." }), _jsxs("button", { type: "button", className: "btn-vetro w-full", onClick: () => void esporta(), children: [_jsx(Download, { size: 18 }), " Esporta backup JSON"] }), _jsxs("button", { type: "button", className: "btn-vetro w-full", onClick: () => file.current?.click(), children: [_jsx(Upload, { size: 18 }), " Importa backup JSON"] }), _jsx("input", { ref: file, type: "file", accept: "application/json", className: "hidden", onChange: (e) => {
                            const f = e.target.files?.[0];
                            if (f)
                                void importa(f);
                            e.target.value = '';
                        } }), _jsxs("button", { type: "button", className: "btn-vetro w-full text-red-700 dark:text-red-300", onClick: async () => {
                            if (!confirm('Vuoi azzerare il programma? Tutte le sessioni verranno cancellate.'))
                                return;
                            if (!confirm('Conferma definitiva: i dati delle sessioni non si potranno recuperare.'))
                                return;
                            await resetProgram();
                            toast.mostra('Programma azzerato.');
                        }, children: [_jsx(RotateCcw, { size: 18 }), " Reset programma"] })] }), _jsx("p", { className: "soft pb-2 text-center text-xs", children: "Tonifica 12 \u00B7 funziona offline \u00B7 i dati restano su questo dispositivo" }), toast.nodo] }));
}
function Riga({ etichetta, children }) {
    return (_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("span", { className: "text-sm font-semibold", children: etichetta }), children] }));
}
function Interruttore({ etichetta, attivo, onChange, }) {
    return (_jsxs("button", { type: "button", role: "switch", "aria-checked": attivo, onClick: () => onChange(!attivo), className: "flex min-h-[48px] w-full items-center justify-between gap-3", children: [_jsx("span", { className: "text-sm font-semibold", children: etichetta }), _jsx("span", { className: `relative h-8 w-14 rounded-full transition ${attivo ? 'bg-inchiostro dark:bg-giallo' : 'bg-black/15 dark:bg-white/20'}`, children: _jsx("span", { className: `absolute top-1 h-6 w-6 rounded-full bg-white transition-all dark:bg-notte ${attivo ? 'left-7' : 'left-1'}` }) })] }));
}
