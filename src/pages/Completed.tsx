import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Etichetta, Titolo } from '../components/ui';
import { db } from '../db/dexie';
import { exercises } from '../data/exercises';
import { buildHistory } from '../lib/history';
import { vaiA } from '../lib/router';

/** Schermata mostrata dopo la sessione 24. */
export default function Completed() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const sets = useLiveQuery(() => db.sets.toArray(), [], []);
  const misure = useLiveQuery(() => db.measurements.toArray(), [], []);

  const ordinate = [...misure].sort((a, b) => a.date.localeCompare(b.date));
  const prima = ordinate[0];
  const ultima = ordinate[ordinate.length - 1];

  const confronti = exercises
    .filter((e) => e.category === 'forza' && !e.bodyweight)
    .map((e) => {
      const storico = buildHistory(e.id, sessions, sets);
      const pesi = storico
        .map((h) => Math.max(...h.sets.map((s) => s.weightKg ?? 0)))
        .filter((p) => p > 0);
      if (pesi.length === 0) return null;
      return { nome: e.name, iniziale: pesi[0], finale: pesi[pesi.length - 1] };
    })
    .filter((x): x is { nome: string; iniziale: number; finale: number } => x !== null);

  return (
    <div className="space-y-4">
      <Titolo sub="24 sessioni, 12 settimane. Complimenti!">Programma completato</Titolo>

      {prima && ultima && prima !== ultima ? (
        <Card forte>
          <Etichetta>Misure: prima e dopo</Etichetta>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Confronto
              titolo="Peso"
              da={prima.weightKg}
              a={ultima.weightKg}
              unita="kg"
            />
            <Confronto titolo="Vita" da={prima.waistCm} a={ultima.waistCm} unita="cm" />
          </div>
        </Card>
      ) : null}

      <Card>
        <Etichetta>Carichi: prima e dopo</Etichetta>
        <ul className="mt-2 space-y-2">
          {confronti.map((c) => (
            <li key={c.nome} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-semibold">{c.nome}</span>
              <span className="cifre shrink-0 font-extrabold">
                {String(c.iniziale).replace('.', ',')} → {String(c.finale).replace('.', ',')} kg
              </span>
            </li>
          ))}
          {confronti.length === 0 ? <li className="soft text-sm">Nessun carico registrato.</li> : null}
        </ul>
      </Card>

      <Card>
        <p className="text-[15px] leading-relaxed">
          E adesso? Puoi ripetere la fase 3 aumentando i carichi, oppure azzerare il programma dalle
          impostazioni per ricominciare da capo con basi molto più solide.
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn-vetro flex-1" onClick={() => vaiA('progressi')}>
            Vedi i progressi
          </button>
          <button type="button" className="btn-primario flex-1" onClick={() => vaiA('impostazioni')}>
            Impostazioni
          </button>
        </div>
      </Card>
    </div>
  );
}

function Confronto({
  titolo,
  da,
  a,
  unita,
}: {
  titolo: string;
  da?: number;
  a?: number;
  unita: string;
}) {
  if (da === undefined || a === undefined) {
    return (
      <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/[0.07]">
        <p className="etichetta">{titolo}</p>
        <p className="soft mt-1 text-sm">Dati non sufficienti</p>
      </div>
    );
  }
  const delta = Math.round((a - da) * 10) / 10;
  return (
    <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/[0.07]">
      <p className="etichetta">{titolo}</p>
      <p className="cifre font-display mt-1 text-lg font-extrabold">
        {da} → {a} {unita}
      </p>
      <p className="soft text-sm font-semibold">
        {delta > 0 ? '+' : ''}
        {String(delta).replace('.', ',')} {unita}
      </p>
    </div>
  );
}
