import { useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { Card, Etichetta, Stepper, Titolo, useToast } from '../components/ui';
import {
  db,
  exportBackup,
  importBackup,
  resetProgram,
  saveProfile,
  saveSettings,
  type BackupPayload,
} from '../db/dexie';

export default function SettingsPage() {
  const profilo = useLiveQuery(() => db.profile.get(1), []);
  const impostazioni = useLiveQuery(() => db.settings.get(1), []);
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (!profilo || !impostazioni) return <p className="soft p-6">Carico…</p>;

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

  const importa = async (f: File) => {
    try {
      const testo = await f.text();
      await importBackup(JSON.parse(testo) as BackupPayload);
      toast.mostra('Backup importato.');
    } catch (e) {
      toast.mostra(e instanceof Error ? e.message : 'File non valido.');
    }
  };

  return (
    <div className="space-y-4">
      <Titolo sub="Profilo, palestra e dati">Impostazioni</Titolo>

      <Card className="space-y-3">
        <Etichetta>Il tuo profilo</Etichetta>
        <Riga etichetta="Età">
          <Stepper
            value={profilo.age}
            min={14}
            max={99}
            onChange={(v) => void saveProfile({ age: v })}
          />
        </Riga>
        <Riga etichetta="Altezza">
          <Stepper
            value={profilo.heightCm}
            min={120}
            max={220}
            suffix="cm"
            onChange={(v) => void saveProfile({ heightCm: v })}
          />
        </Riga>
        <Riga etichetta="Peso iniziale">
          <Stepper
            value={profilo.startWeightKg}
            step={0.5}
            min={30}
            max={200}
            suffix="kg"
            onChange={(v) => void saveProfile({ startWeightKg: v })}
          />
        </Riga>
        <label className="block">
          <span className="etichetta">Obiettivo</span>
          <input
            className="campo mt-1"
            value={profilo.goal}
            onChange={(e) => void saveProfile({ goal: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="etichetta">Zona prioritaria</span>
          <input
            className="campo mt-1"
            value={profilo.priorityArea}
            onChange={(e) => void saveProfile({ priorityArea: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="etichetta">Note su infortuni ed esclusioni</span>
          <input
            className="campo mt-1"
            value={profilo.excluded}
            onChange={(e) => void saveProfile({ excluded: e.target.value })}
          />
        </label>
      </Card>

      <Card className="space-y-3">
        <Etichetta>La tua palestra</Etichetta>
        <p className="soft text-sm">
          Incrementi minimi disponibili: servono alla logica che suggerisce i carichi.
        </p>
        <Riga etichetta="Manubri">
          <Stepper
            value={impostazioni.dumbbellStepKg}
            step={0.5}
            min={0.5}
            max={10}
            suffix="kg"
            onChange={(v) => void saveSettings({ dumbbellStepKg: v })}
          />
        </Riga>
        <Riga etichetta="Piastra macchine e cavi">
          <Stepper
            value={impostazioni.machinePlateKg}
            step={0.5}
            min={0.5}
            max={20}
            suffix="kg"
            onChange={(v) => void saveSettings({ machinePlateKg: v })}
          />
        </Riga>
        <Riga etichetta="Leg press">
          <Stepper
            value={impostazioni.legPressStepKg}
            step={1}
            min={1}
            max={25}
            suffix="kg"
            onChange={(v) => void saveSettings({ legPressStepKg: v })}
          />
        </Riga>
        <Riga etichetta="Bilanciere">
          <Stepper
            value={impostazioni.barbellStepKg}
            step={0.5}
            min={0.5}
            max={10}
            suffix="kg"
            onChange={(v) => void saveSettings({ barbellStepKg: v })}
          />
        </Riga>
      </Card>

      <Card className="space-y-3">
        <Etichetta>App</Etichetta>
        <Interruttore
          etichetta="Suoni del timer"
          attivo={impostazioni.sound}
          onChange={(v) => void saveSettings({ sound: v })}
        />
        <Interruttore
          etichetta="Vibrazione (dove supportata)"
          attivo={impostazioni.vibration}
          onChange={(v) => void saveSettings({ vibration: v })}
        />
        <div>
          <span className="etichetta">Tema</span>
          <div className="mt-1 flex gap-2">
            {(['auto', 'chiaro', 'scuro'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => void saveSettings({ theme: t })}
                className={`btn flex-1 text-sm ${
                  impostazioni.theme === t
                    ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                    : 'bg-white/70 dark:bg-white/10'
                }`}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <Etichetta>Dati</Etichetta>
        <p className="soft text-sm">
          Tutto resta sul telefono: nessun account, nessun server. Fai un backup ogni tanto.
        </p>
        <button type="button" className="btn-vetro w-full" onClick={() => void esporta()}>
          <Download size={18} /> Esporta backup JSON
        </button>
        <button type="button" className="btn-vetro w-full" onClick={() => file.current?.click()}>
          <Upload size={18} /> Importa backup JSON
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importa(f);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          className="btn-vetro w-full text-red-700 dark:text-red-300"
          onClick={async () => {
            if (!confirm('Vuoi azzerare il programma? Tutte le sessioni verranno cancellate.'))
              return;
            if (!confirm('Conferma definitiva: i dati delle sessioni non si potranno recuperare.'))
              return;
            await resetProgram();
            toast.mostra('Programma azzerato.');
          }}
        >
          <RotateCcw size={18} /> Reset programma
        </button>
      </Card>

      <p className="soft pb-2 text-center text-xs">
        Tonifica 12 · funziona offline · i dati restano su questo dispositivo
      </p>
      {toast.nodo}
    </div>
  );
}

function Riga({ etichetta, children }: { etichetta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{etichetta}</span>
      {children}
    </div>
  );
}

function Interruttore({
  etichetta,
  attivo,
  onChange,
}: {
  etichetta: string;
  attivo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={attivo}
      onClick={() => onChange(!attivo)}
      className="flex min-h-[48px] w-full items-center justify-between gap-3"
    >
      <span className="text-sm font-semibold">{etichetta}</span>
      <span
        className={`relative h-8 w-14 rounded-full transition ${
          attivo ? 'bg-inchiostro dark:bg-giallo' : 'bg-black/15 dark:bg-white/20'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all dark:bg-notte ${
            attivo ? 'left-7' : 'left-1'
          }`}
        />
      </span>
    </button>
  );
}
