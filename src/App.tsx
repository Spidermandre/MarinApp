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
] as const;

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
    return (
      <div className="flex min-h-full items-center justify-center p-8">
        <p className="font-display text-xl font-extrabold">Tonifica 12</p>
      </div>
    );
  }

  if (!settings.safetyNoticeSeen) {
    return <AvvisoSicurezza onOk={() => void saveSettings({ safetyNoticeSeen: true })} />;
  }

  const inAllenamento = route.name === 'allenamento';

  return (
    <div className="mx-auto min-h-full w-full max-w-lg">
      <main
        className={`px-4 pt-[calc(1rem+env(safe-area-inset-top))] ${
          inAllenamento ? 'pb-8' : 'pb-32'
        }`}
      >
        {route.name === 'home' && <Home />}
        {route.name === 'allenamento' && <Workout sessionNumber={route.sessione} />}
        {route.name === 'esercizi' && <ExerciseLibrary />}
        {route.name === 'esercizio' && <ExerciseDetail id={route.id} />}
        {route.name === 'storico' && <History />}
        {route.name === 'progressi' && <Progress />}
        {route.name === 'consigli' && <Tips />}
        {route.name === 'programma' && <Program />}
        {route.name === 'impostazioni' && <SettingsPage />}
        {route.name === 'completato' && <Completed />}
      </main>

      {!inAllenamento ? <BarraNavigazione attiva={route.name} /> : null}
    </div>
  );
}

function BarraNavigazione({ attiva }: { attiva: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
      <div className="vetro vetro-forte flex items-stretch justify-between gap-1 p-1.5">
        {voci.map((v) => {
          const Icona = v.icona;
          const attivo =
            attiva === v.id ||
            (v.id === 'progressi' && attiva === 'storico') ||
            (v.id === 'esercizi' && attiva === 'esercizio') ||
            (v.id === 'home' && (attiva === 'programma' || attiva === 'completato'));
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => vaiA(v.path)}
              aria-current={attivo ? 'page' : undefined}
              className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.25rem] px-1 transition ${
                attivo ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro' : 'soft'
              }`}
            >
              <Icona size={20} />
              <span className="text-[10px] font-bold tracking-wide">{v.etichetta}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function AvvisoSicurezza({ onOk }: { onOk: () => void }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-5 p-5">
      <div className="vetro vetro-forte animate-glass-in p-6">
        <div className="mb-4 flex items-center gap-3">
          <Logo />
          <div>
            <p className="font-display text-2xl font-extrabold leading-none">Martina</p>
            <p className="soft text-sm">12 settimane, 2 volte a settimana</p>
          </div>
        </div>
        <h1 className="font-display mb-2 text-lg font-extrabold">Prima di iniziare</h1>
        <p className="text-[15px] leading-relaxed">{SAFETY_NOTICE}</p>
        <button type="button" className="btn-primario mt-6 w-full" onClick={onOk}>
          Ho capito, iniziamo
        </button>
      </div>
    </div>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-inchiostro"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span className="font-display text-giallo" style={{ fontSize: size * 0.42, fontWeight: 800 }}>
        MR
      </span>
    </div>
  );
}
