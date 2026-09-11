import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChevronRight, Ruler, Scale } from 'lucide-react';
import { Barra, Card, Chip, Etichetta, StatoVuoto, Stepper, Titolo } from '../components/ui';
import { db } from '../db/dexie';
import { exerciseName, exercises } from '../data/exercises';
import { TOTAL_SESSIONS } from '../data/program';
import { buildHistory, movingAverage } from '../lib/history';
import { vaiA } from '../lib/router';
import { formatClock } from '../lib/timers';

const oggi = () => new Date().toISOString().slice(0, 10);

export default function Progress() {
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const sets = useLiveQuery(() => db.sets.toArray(), [], []);
  const misure = useLiveQuery(() => db.measurements.toArray(), [], []);

  const completate = sessions.filter((s) => s.status === 'completata');
  const esercizioIdIniziale =
    exercises.find((e) => !e.bodyweight && e.category === 'forza')?.id ?? 'leg-press';
  const [esercizioId, setEsercizioId] = useState(esercizioIdIniziale);

  const serieForza = useMemo(() => {
    const storico = buildHistory(esercizioId, sessions, sets);
    return storico
      .map((h) => {
        const pesi = h.sets.filter((s) => s.completed && s.weightKg);
        const migliore = pesi.length ? Math.max(...pesi.map((s) => s.weightKg as number)) : 0;
        const reps = pesi.find((s) => s.weightKg === migliore)?.reps ?? 0;
        return { sessione: `S${h.sessionNumber}`, kg: migliore, reps };
      })
      .filter((p) => p.kg > 0);
  }, [esercizioId, sessions, sets]);

  const tenute = useMemo(() => {
    const dati = ['plank', 'side-plank'].map((id) => ({
      id,
      punti: buildHistory(id, sessions, sets)
        .map((h) => ({
          sessione: `S${h.sessionNumber}`,
          sec: Math.max(...h.sets.map((s) => s.durationSec ?? 0)),
        }))
        .filter((p) => p.sec > 0),
    }));
    return dati.filter((d) => d.punti.length > 0);
  }, [sessions, sets]);

  const pesi = useMemo(
    () =>
      movingAverage(
        misure
          .filter((m) => typeof m.weightKg === 'number')
          .map((m) => ({ date: m.date, value: m.weightKg as number })),
      ).map((p) => ({ data: p.date.slice(5), peso: p.value, media: p.media })),
    [misure],
  );

  const vita = useMemo(
    () =>
      misure
        .filter((m) => typeof m.waistCm === 'number')
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((m) => ({ data: m.date.slice(5), cm: m.waistCm as number })),
    [misure],
  );

  const ultimaVita = misure
    .filter((m) => m.waistCm)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const giorniDaVita = ultimaVita
    ? Math.floor((Date.now() - new Date(ultimaVita.date).getTime()) / 86400000)
    : null;

  const volumeTotale = completate.reduce((s, x) => s + (x.totalVolumeKg ?? 0), 0);
  const tempoTotale = completate.reduce((s, x) => s + (x.durationSec ?? 0), 0);

  return (
    <div className="space-y-4">
      <Titolo sub="Come sta andando il programma">Progressi</Titolo>

      <Card forte>
        <Etichetta>Programma</Etichetta>
        <div className="mt-1 grid grid-cols-3 gap-2 text-center">
          <Dato valore={`${completate.length}`} etichetta={`su ${TOTAL_SESSIONS} sessioni`} />
          <Dato valore={`${Math.round(volumeTotale / 1000)}t`} etichetta="volume sollevato" />
          <Dato valore={formatClock(tempoTotale)} etichetta="tempo in palestra" />
        </div>
        <Barra className="mt-3" value={completate.length} max={TOTAL_SESSIONS} showLabel />
      </Card>

      {completate.length === 0 ? (
        <StatoVuoto
          titolo="Nessun dato ancora"
          testo="Completa la prima sessione: da lì in poi qui vedrai i carichi che crescono, le tenute del plank e l'andamento di peso e vita."
          azione={
            <button type="button" className="btn-primario" onClick={() => vaiA('')}>
              Inizia la prima sessione
            </button>
          }
        />
      ) : null}

      {completate.length > 0 ? (
        <Card>
          <Etichetta>Carico nel tempo</Etichetta>
          <select
            className="campo mt-2"
            value={esercizioId}
            onChange={(e) => setEsercizioId(e.target.value)}
          >
            {exercises
              .filter((e) => e.category === 'forza' && !e.bodyweight)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
          </select>
          {serieForza.length === 0 ? (
            <p className="soft mt-3 text-sm">
              Nessun dato per {exerciseName(esercizioId)}: comparirà dopo la prima sessione in cui
              lo esegui.
            </p>
          ) : (
            <Grafico
              dati={serieForza}
              x="sessione"
              linee={[{ key: 'kg', nome: 'Miglior serie (kg)' }]}
            />
          )}
        </Card>
      ) : null}

      {tenute.length > 0 ? (
        <Card>
          <Etichetta>Tenuta plank e side plank</Etichetta>
          <div className="mt-2 space-y-4">
            {tenute.map((t) => (
              <div key={t.id}>
                <p className="mb-1 text-sm font-bold">{exerciseName(t.id)}</p>
                <Grafico dati={t.punti} x="sessione" linee={[{ key: 'sec', nome: 'Secondi' }]} />
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      <MisureCorporee />

      {pesi.length > 1 ? (
        <Card>
          <Etichetta>Peso e media a 7 giorni</Etichetta>
          <Grafico
            dati={pesi}
            x="data"
            linee={[
              { key: 'peso', nome: 'Peso (kg)', tratteggio: true },
              { key: 'media', nome: 'Media 7 giorni' },
            ]}
          />
          <p className="soft mt-2 text-xs leading-relaxed">
            Guarda la media, non il singolo valore: le oscillazioni giornaliere sono normali.
          </p>
        </Card>
      ) : null}

      {vita.length > 1 ? (
        <Card>
          <Etichetta>Circonferenza vita</Etichetta>
          <Grafico dati={vita} x="data" linee={[{ key: 'cm', nome: 'Vita (cm)' }]} />
        </Card>
      ) : null}

      {giorniDaVita !== null && giorniDaVita >= 14 ? (
        <Card>
          <p className="text-[15px] font-semibold">
            Sono passati {giorniDaVita} giorni dall&apos;ultima misura della vita: è il momento di
            misurarla di nuovo, all&apos;altezza dell&apos;ombelico.
          </p>
        </Card>
      ) : null}

      <button
        type="button"
        onClick={() => vaiA('storico')}
        className="vetro flex min-h-[56px] w-full items-center justify-between px-4 text-sm font-bold"
      >
        Storico delle sessioni <ChevronRight size={18} />
      </button>
    </div>
  );
}

function MisureCorporee() {
  const misure = useLiveQuery(() => db.measurements.toArray(), [], []);
  const profilo = useLiveQuery(() => db.profile.get(1), []);
  const [peso, setPeso] = useState<number | undefined>(undefined);
  const [vita, setVita] = useState<number | undefined>(undefined);

  const ultimoPeso = misure
    .filter((m) => m.weightKg)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg;
  const ultimaVita = misure
    .filter((m) => m.waistCm)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.waistCm;

  const salva = async () => {
    if (peso === undefined && vita === undefined) return;
    const data = oggi();
    const esistente = misure.find((m) => m.date === data);
    const record = {
      date: data,
      weightKg: peso ?? esistente?.weightKg,
      waistCm: vita ?? esistente?.waistCm,
    };
    if (esistente?.id) await db.measurements.update(esistente.id, record);
    else await db.measurements.add(record);
    setPeso(undefined);
    setVita(undefined);
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <Etichetta>Misure di oggi</Etichetta>
        <div className="flex gap-1.5">
          {ultimoPeso ? <Chip>{ultimoPeso} kg</Chip> : null}
          {ultimaVita ? <Chip>vita {ultimaVita} cm</Chip> : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Scale size={20} className="opacity-60" />
        <span className="flex-1 text-sm font-semibold">Peso</span>
        <Stepper
          value={peso ?? ultimoPeso ?? profilo?.startWeightKg}
          step={0.1}
          min={30}
          max={200}
          suffix="kg"
          onChange={setPeso}
        />
      </div>
      <div className="flex items-center gap-3">
        <Ruler size={20} className="opacity-60" />
        <span className="flex-1 text-sm font-semibold">Vita (ombelico)</span>
        <Stepper
          value={vita ?? ultimaVita ?? 80}
          step={0.5}
          min={40}
          max={200}
          suffix="cm"
          onChange={setVita}
        />
      </div>
      <button type="button" className="btn-primario w-full" onClick={() => void salva()}>
        Salva misure di oggi
      </button>
      <p className="soft text-xs leading-relaxed">
        Pesati 2–3 volte a settimana al mattino a digiuno. Misura la vita ogni 2 settimane.
      </p>
    </Card>
  );
}

function Grafico({
  dati,
  x,
  linee,
}: {
  dati: Record<string, string | number>[];
  x: string;
  linee: { key: string; nome: string; tratteggio?: boolean }[];
}) {
  return (
    <div className="mt-2 h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dati} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} />
          <XAxis dataKey={x} tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.7} />
          <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.7} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: 'none',
              background: 'rgba(17,17,17,0.92)',
              color: '#FFD400',
              fontWeight: 600,
            }}
          />
          {linee.map((l, i) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.nome}
              stroke={i === 0 ? 'currentColor' : '#E4572E'}
              strokeWidth={i === 0 ? 3 : 2}
              strokeDasharray={l.tratteggio ? '4 4' : undefined}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Dato({ valore, etichetta }: { valore: string; etichetta: string }) {
  return (
    <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/[0.07]">
      <p className="cifre font-display text-xl font-extrabold leading-none">{valore}</p>
      <p className="etichetta mt-1">{etichetta}</p>
    </div>
  );
}
