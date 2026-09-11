import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, ChevronLeft, ChevronRight, CircleHelp, Play, X } from 'lucide-react';
import { Barra, Card, Chip, Etichetta, InfoTermine, Stepper } from '../components/ui';
import ExerciseCard, { type SetEntry } from '../components/ExerciseCard';
import ExerciseSheet from '../components/ExerciseSheet';
import IntervalTimer from '../components/IntervalTimer';
import RestTimer from '../components/RestTimer';
import { db } from '../db/dexie';
import { exerciseById, exerciseName } from '../data/exercises';
import { cooldownItems } from '../data/program';
import { GLOSSARY } from '../data/tips';
import { buildHistory, lastTimeLabel, volumeOf } from '../lib/history';
import {
  DEFAULT_INCREMENTS,
  incrementFor,
  parseRepRange,
  suggestCardioAdjust,
  suggestDuration,
  suggestWeight,
} from '../lib/progression';
import { vaiA } from '../lib/router';
import { workoutForSession } from '../lib/session-sequence';
import { formatClock, useCountdown, useWakeLock } from '../lib/timers';
import type { ActiveSessionState, PrescribedItem, SetLog } from '../types';

const BLOCCHI = ['Riscaldamento', 'Forza', 'Core', 'Cardio', 'Defaticamento', 'Fine'] as const;
const CHIAVE_TIMER = 'tonifica12.timer';
const CHIAVE_CARDIO = 'tonifica12.cardio';

interface StatoAllenamento {
  blocco: number;
  riscaldamento: boolean[];
  forza: SetEntry[][];
  coreGiro: number;
  coreIndice: number;
  coreFase: 'attesa' | 'tenuta' | 'recupero';
  coreTenute: (number | undefined)[][];
  cardioFatto: boolean;
  cardioFeel?: 'facile' | 'giusto' | 'difficile';
  defaticamento: boolean[];
  note: string;
  rpe?: number;
}

export default function Workout({ sessionNumber }: { sessionNumber: number }) {
  const workout = useMemo(() => workoutForSession(sessionNumber), [sessionNumber]);
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const setsSalvati = useLiveQuery(() => db.sets.toArray(), [], []);
  const impostazioni = useLiveQuery(() => db.settings.get(1), []);
  const sessione = sessions.find(
    (s) => s.sessionNumber === sessionNumber && s.status === 'in_corso',
  );
  // toArray() distingue "ancora in caricamento" (undefined) da "nessuno stato salvato" ([]).
  const salvati = useLiveQuery(
    () =>
      sessione?.id
        ? db.active.where('sessionId').equals(sessione.id).toArray()
        : Promise.resolve([] as ActiveSessionState[]),
    [sessione?.id],
  );
  const salvato = salvati?.[0];

  const [stato, setStato] = useState<StatoAllenamento | null>(null);
  const [caricato, setCaricato] = useState(false);
  const azioneFine = useRef<(() => void) | null>(null);
  const timer = useCountdown(CHIAVE_TIMER, () => azioneFine.current?.());

  useWakeLock(true);

  const incrementi = impostazioni
    ? {
        dumbbellStepKg: impostazioni.dumbbellStepKg,
        machinePlateKg: impostazioni.machinePlateKg,
        barbellStepKg: impostazioni.barbellStepKg,
        legPressStepKg: impostazioni.legPressStepKg,
      }
    : DEFAULT_INCREMENTS;

  // Suggerimenti di carico calcolati dallo storico (sezione 9 del programma).
  const suggerimenti = useMemo(
    () =>
      workout.strength.map((item) => {
        const ex = exerciseById(item.exerciseId)!;
        const storico = buildHistory(item.exerciseId, sessions, setsSalvati);
        return {
          suggerimento: suggestWeight(ex, item, storico, incrementi),
          ultima: lastTimeLabel(storico),
        };
      }),
    [workout, sessions, setsSalvati, incrementi],
  );

  // Ripresa della sessione interrotta, oppure stato iniziale.
  useEffect(() => {
    if (caricato || !sessione || !salvati) return;
    if (salvato?.data) {
      try {
        setStato(JSON.parse(salvato.data) as StatoAllenamento);
        setCaricato(true);
        return;
      } catch {
        /* stato illeggibile: si riparte da zero */
      }
    }
    setStato({
      blocco: 0,
      riscaldamento: new Array(1 + workout.warmup.mobility.length).fill(false),
      forza: workout.strength.map((item, i) =>
        new Array(item.sets).fill(null).map(() => ({
          weightKg: suggerimenti[i]?.suggerimento.weightKg,
          // precompilato con il minimo del range: l'utente corregge con "+" e "−"
          reps: parseRepRange(item.reps)?.[0],
          durationSec: item.durationSec,
          completed: false,
        })),
      ),
      coreGiro: 0,
      coreIndice: 0,
      coreFase: 'attesa',
      coreTenute: new Array(workout.core.rounds)
        .fill(null)
        .map(() => new Array(workout.core.items.length).fill(undefined)),
      cardioFatto: false,
      defaticamento: new Array(cooldownItems.length).fill(false),
      note: '',
    });
    setCaricato(true);
  }, [caricato, salvati, salvato, sessione, workout, suggerimenti]);

  // Salvataggio continuo: se l'app si chiude, la sessione si può riprendere.
  useEffect(() => {
    if (!stato || !sessione?.id) return;
    const record = {
      sessionId: sessione.id,
      sessionNumber,
      workoutId: workout.id,
      blockIndex: stato.blocco,
      startedAt: sessione.startedAt,
      updatedAt: new Date().toISOString(),
      data: JSON.stringify(stato),
    };
    void db.active
      .where('sessionId')
      .equals(sessione.id)
      .first()
      .then((esistente) =>
        esistente?.id ? db.active.update(esistente.id, record) : db.active.add(record),
      );
  }, [stato, sessione, sessionNumber, workout.id]);

  const aggiorna = useCallback(
    (patch: Partial<StatoAllenamento> | ((s: StatoAllenamento) => StatoAllenamento)) =>
      setStato((s) => {
        if (!s) return s;
        return typeof patch === 'function' ? patch(s) : { ...s, ...patch };
      }),
    [],
  );

  if (!sessione) {
    return (
      <Card className="mt-10 text-center">
        <p className="font-display text-lg font-extrabold">Nessuna sessione aperta</p>
        <button type="button" className="btn-primario mt-4 w-full" onClick={() => vaiA('')}>
          Torna alla home
        </button>
      </Card>
    );
  }
  if (!stato) return <p className="soft p-6 text-center">Carico l&apos;allenamento…</p>;

  const blocco = stato.blocco;

  // ------------------------------------------------------------- forza
  const gruppi = raggruppaSuperserie(workout.strength);

  const completaSerie = (indiceEsercizio: number, indiceSerie: number) => {
    aggiorna((s) => {
      const forza = s.forza.map((righe, i) =>
        i === indiceEsercizio
          ? righe.map((r, j) => (j === indiceSerie ? { ...r, completed: !r.completed } : r))
          : righe,
      );
      return { ...s, forza };
    });

    const stavaCompletata = stato.forza[indiceEsercizio]?.[indiceSerie]?.completed;
    if (stavaCompletata) return; // si sta annullando la spunta: nessun timer

    const gruppo = gruppi.find((g) => g.indici.includes(indiceEsercizio));
    if (!gruppo) return;
    // Nelle superserie il recupero parte solo dopo la serie di entrambi.
    const tutteFatte = gruppo.indici.every((idx) => {
      const riga = stato.forza[idx]?.[indiceSerie];
      return idx === indiceEsercizio ? true : riga?.completed;
    });
    if (!tutteFatte) return;
    const ultimo = workout.strength[gruppo.indici[gruppo.indici.length - 1]];
    if (ultimo.restSec > 0) {
      azioneFine.current = null;
      timer.start(ultimo.restSec, 'Recupero');
    }
  };

  // -------------------------------------------------------------- core
  const core = workout.core;
  const itemCore = core.items[stato.coreIndice];
  const esercizioCore = exerciseById(itemCore.exerciseId)!;
  const coreATempo = !!(itemCore.durationSec || itemCore.durationRange);
  const suggerimentoTenuta = suggestDuration(
    itemCore,
    buildHistory(itemCore.exerciseId, sessions, setsSalvati),
  );

  const avanzaCore = (tenutaSec?: number) => {
    const ultimoEsercizio = stato.coreIndice >= core.items.length - 1;
    const ultimoGiro = stato.coreGiro >= core.rounds - 1;

    aggiorna((s) => {
      const coreTenute = s.coreTenute.map((giro, gi) =>
        gi === s.coreGiro
          ? giro.map((v, ii) => (ii === s.coreIndice ? (tenutaSec ?? v) : v))
          : giro,
      );
      if (ultimoEsercizio && ultimoGiro) {
        return { ...s, coreTenute, coreFase: 'attesa', blocco: 3 };
      }
      return {
        ...s,
        coreTenute,
        coreFase: 'recupero',
        coreGiro: ultimoEsercizio ? s.coreGiro + 1 : s.coreGiro,
        coreIndice: ultimoEsercizio ? 0 : s.coreIndice + 1,
      };
    });

    if (ultimoEsercizio && ultimoGiro) return;
    const recupero = ultimoEsercizio ? core.restBetweenRoundsSec : core.restBetweenExercisesSec;
    azioneFine.current = () => aggiorna({ coreFase: 'attesa' });
    timer.start(recupero, ultimoEsercizio ? 'Recupero tra i giri' : 'Recupero');
  };

  const avviaTenuta = () => {
    const secondi = suggerimentoTenuta.durationSec;
    aggiorna({ coreFase: 'tenuta' });
    azioneFine.current = () => avanzaCore(secondi);
    timer.start(secondi, `${esercizioCore.name}${itemCore.perSide ? ' · per lato' : ''}`);
  };

  // ------------------------------------------------------------- fine
  const salvaSessione = async () => {
    if (!sessione.id) return;
    const righe: SetLog[] = [];
    stato.forza.forEach((serie, i) => {
      const item = workout.strength[i];
      serie.forEach((s, j) => {
        righe.push({
          sessionId: sessione.id as number,
          exerciseId: item.exerciseId,
          setIndex: j,
          weightKg: s.weightKg,
          reps: s.reps,
          durationSec: s.durationSec,
          completed: s.completed,
        });
      });
    });
    stato.coreTenute.forEach((giro, gi) => {
      giro.forEach((sec, ii) => {
        if (sec === undefined) return;
        righe.push({
          sessionId: sessione.id as number,
          exerciseId: core.items[ii].exerciseId,
          setIndex: gi,
          durationSec: sec,
          completed: true,
        });
      });
    });

    const durataSec = Math.round(
      (Date.now() - new Date(sessione.startedAt).getTime()) / 1000,
    );
    await db.sets.bulkAdd(righe);
    await db.sessions.update(sessione.id, {
      finishedAt: new Date().toISOString(),
      status: 'completata',
      sessionRpe: stato.rpe,
      notes: stato.note,
      cardioFeel: stato.cardioFeel,
      durationSec: durataSec,
      totalVolumeKg: volumeOf(righe),
    });
    await db.active.where('sessionId').equals(sessione.id).delete();
    timer.reset();
    localStorage.removeItem(CHIAVE_CARDIO);
    vaiA(sessionNumber >= 24 ? 'completato' : '');
  };

  const serieFatte = stato.forza.flat().filter((s) => s.completed).length;
  const serieTotali = stato.forza.flat().length;
  const avanzamento =
    (blocco +
      (blocco === 1 && serieTotali ? serieFatte / serieTotali : 0) +
      (blocco === 2 ? (stato.coreGiro * core.items.length + stato.coreIndice) / (core.rounds * core.items.length) : 0)) /
    5;

  return (
    <div className={`space-y-4 ${timer.running ? 'pb-44' : 'pb-10'}`}>
      <header className="sticky top-0 z-30 -mx-4 mb-1 bg-transparent px-4 pb-2 pt-[env(safe-area-inset-top)]">
        <div className="vetro vetro-forte flex items-center gap-3 px-3 py-2.5">
          <button
            type="button"
            aria-label="Esci dall'allenamento"
            className="btn-piccolo h-11 w-11 bg-black/[0.07] dark:bg-white/10"
            onClick={() => {
              if (confirm('Uscire? La sessione resta aperta e potrai riprenderla.')) vaiA('');
            }}
          >
            <X size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-extrabold leading-tight">
              {workout.title}
            </p>
            <p className="soft text-xs font-semibold">
              Sessione {sessionNumber} · {BLOCCHI[blocco]}
            </p>
          </div>
          <Chip tono="scuro">
            {blocco + 1}/{BLOCCHI.length}
          </Chip>
        </div>
        <Barra className="mt-2" value={Math.min(1, avanzamento) * 100} max={100} />
      </header>

      {blocco === 0 ? (
        <BloccoRiscaldamento
          workout={workout}
          fatti={stato.riscaldamento}
          onToggle={(i) =>
            aggiorna((s) => ({
              ...s,
              riscaldamento: s.riscaldamento.map((v, j) => (j === i ? !v : v)),
            }))
          }
          onTimer={(sec, label) => {
            azioneFine.current = null;
            timer.start(sec, label);
          }}
        />
      ) : null}

      {blocco === 1 ? (
        <div className="space-y-4">
          {gruppi.map((g) => (
            <div key={g.chiave} className={g.indici.length > 1 ? 'space-y-2' : ''}>
              {g.indici.length > 1 ? (
                <div className="flex items-center gap-2 px-1">
                  <Chip tono="scuro">Superserie</Chip>
                  <p className="soft text-xs font-semibold">
                    Esegui {g.etichette.join(' e poi subito ')}, poi recupera.
                  </p>
                </div>
              ) : null}
              <div
                className={
                  g.indici.length > 1
                    ? 'space-y-2 rounded-[1.9rem] border-2 border-dashed border-black/15 p-2 dark:border-white/20'
                    : ''
                }
              >
                {g.indici.map((idx, k) => {
                  const item = workout.strength[idx];
                  const ex = exerciseById(item.exerciseId)!;
                  return (
                    <ExerciseCard
                      key={idx}
                      item={item}
                      exercise={ex}
                      etichetta={g.etichette[k]}
                      sets={stato.forza[idx] ?? []}
                      suggestion={suggerimenti[idx].suggerimento}
                      lastTime={suggerimenti[idx].ultima}
                      step={incrementFor(ex, incrementi)}
                      onChange={(j, patch) =>
                        aggiorna((s) => ({
                          ...s,
                          forza: s.forza.map((righe, i) =>
                            i === idx
                              ? righe.map((r, jj) => (jj === j ? { ...r, ...patch } : r))
                              : righe,
                          ),
                        }))
                      }
                      onComplete={(j) => completaSerie(idx, j)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {blocco === 2 ? (
        <BloccoCore
          giro={stato.coreGiro}
          giri={core.rounds}
          indice={stato.coreIndice}
          items={core.items}
          fase={stato.coreFase}
          aTempo={coreATempo}
          suggerimento={suggerimentoTenuta}
          onAvvia={avviaTenuta}
          onCompleta={() => avanzaCore()}
        />
      ) : null}

      {blocco === 3 ? (
        <BloccoCardio
          workout={workout}
          fatto={stato.cardioFatto}
          feel={stato.cardioFeel}
          onFatto={() => aggiorna({ cardioFatto: true })}
          onFeel={(f) => aggiorna({ cardioFeel: f })}
          onTimer={(sec, label) => {
            azioneFine.current = () => aggiorna({ cardioFatto: true });
            timer.start(sec, label);
          }}
        />
      ) : null}

      {blocco === 4 ? (
        <Card className="space-y-3">
          <Etichetta>Defaticamento · 3 minuti</Etichetta>
          <p className="text-[15px] leading-relaxed">{workout.cooldown.description}</p>
          <ul className="space-y-2">
            {cooldownItems.map((t, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() =>
                    aggiorna((s) => ({
                      ...s,
                      defaticamento: s.defaticamento.map((v, j) => (j === i ? !v : v)),
                    }))
                  }
                  className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-semibold ${
                    stato.defaticamento[i]
                      ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                      : 'bg-white/60 dark:bg-white/[0.07]'
                  }`}
                >
                  <Check size={18} /> {t}
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="btn-vetro w-full"
            onClick={() => {
              azioneFine.current = null;
              timer.start(30, 'Allungamento');
            }}
          >
            <Play size={18} /> Timer 30&quot;
          </button>
        </Card>
      ) : null}

      {blocco === 5 ? (
        <BloccoFine
          durataSec={Math.round((Date.now() - new Date(sessione.startedAt).getTime()) / 1000)}
          serieFatte={serieFatte}
          serieTotali={serieTotali}
          volume={volumeOf(
            stato.forza.flatMap((serie, i) =>
              serie.map((s, j) => ({
                sessionId: 0,
                exerciseId: workout.strength[i].exerciseId,
                setIndex: j,
                weightKg: s.weightKg,
                reps: s.reps,
                completed: s.completed,
              })),
            ),
          )}
          note={stato.note}
          rpe={stato.rpe}
          onNote={(note) => aggiorna({ note })}
          onRpe={(rpe) => aggiorna({ rpe })}
          onSalva={() => void salvaSessione()}
        />
      ) : null}

      {blocco < 5 ? (
        <div className="flex gap-2 pt-2">
          {blocco > 0 ? (
            <button
              type="button"
              className="btn-vetro flex-1"
              onClick={() => aggiorna({ blocco: blocco - 1 })}
            >
              <ChevronLeft size={18} /> Indietro
            </button>
          ) : null}
          <button
            type="button"
            className="btn-primario flex-[2]"
            onClick={() => aggiorna({ blocco: blocco + 1 })}
          >
            {blocco === 4 ? 'Concludi' : `Vai a ${BLOCCHI[blocco + 1]}`} <ChevronRight size={18} />
          </button>
        </div>
      ) : null}

      <RestTimer timer={timer} />
    </div>
  );
}

// --------------------------------------------------------------- blocchi

function BloccoRiscaldamento({
  workout,
  fatti,
  onToggle,
  onTimer,
}: {
  workout: ReturnType<typeof workoutForSession>;
  fatti: boolean[];
  onToggle: (i: number) => void;
  onTimer: (sec: number, label: string) => void;
}) {
  const [scheda, setScheda] = useState<string | null>(null);
  const voci = [
    {
      titolo: `${exerciseName(workout.warmup.cardio.exerciseId)} — ${workout.warmup.cardio.min}′`,
      dettaglio: workout.warmup.cardio.target,
      id: workout.warmup.cardio.exerciseId,
      sec: workout.warmup.cardio.min * 60,
    },
    ...workout.warmup.mobility.map((m) => ({
      titolo: `${exerciseName(m.exerciseId)} × ${m.reps}${m.perSide ? ' per lato' : ''}`,
      dettaglio: 'Mobilità · 1 giro',
      id: m.exerciseId,
      sec: 0,
    })),
  ];

  return (
    <Card className="space-y-3">
      <Etichetta>Riscaldamento · 8 minuti</Etichetta>
      <ul className="space-y-2">
        {voci.map((v, i) => (
          <li key={i} className="rounded-2xl bg-white/60 p-2.5 dark:bg-white/[0.07]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle(i)}
                aria-pressed={fatti[i]}
                className={`btn-piccolo h-11 w-11 shrink-0 ${
                  fatti[i]
                    ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                    : 'bg-black/[0.07] dark:bg-white/10'
                }`}
              >
                <Check size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold">{v.titolo}</p>
                <p className="soft text-xs">{v.dettaglio}</p>
              </div>
              <button
                type="button"
                aria-label={`Come si esegue ${v.titolo}`}
                className="btn-piccolo h-11 w-11 bg-black/[0.07] dark:bg-white/10"
                onClick={() => setScheda(v.id)}
              >
                <CircleHelp size={18} />
              </button>
            </div>
            {v.sec > 0 ? (
              <button
                type="button"
                className="btn-vetro mt-2 w-full"
                onClick={() => onTimer(v.sec, 'Riscaldamento')}
              >
                <Play size={16} /> Avvia {v.sec / 60}&#8242;
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {scheda ? (
        <ExerciseSheet exercise={exerciseById(scheda)!} onClose={() => setScheda(null)} />
      ) : null}
    </Card>
  );
}

function BloccoCore({
  giro,
  giri,
  indice,
  items,
  fase,
  aTempo,
  suggerimento,
  onAvvia,
  onCompleta,
}: {
  giro: number;
  giri: number;
  indice: number;
  items: PrescribedItem[];
  fase: 'attesa' | 'tenuta' | 'recupero';
  aTempo: boolean;
  suggerimento: { durationSec: number; message: string };
  onAvvia: () => void;
  onCompleta: () => void;
}) {
  const [scheda, setScheda] = useState<string | null>(null);
  const item = items[indice];
  const ex = exerciseById(item.exerciseId)!;

  return (
    <div className="space-y-3">
      <Card forte className="space-y-3">
        <div className="flex items-center justify-between">
          <Etichetta>Circuito core</Etichetta>
          <Chip tono="scuro">
            Giro {giro + 1} di {giri}
          </Chip>
        </div>
        <h2 className="font-display text-2xl font-extrabold leading-tight">{ex.name}</h2>
        <p className="soft text-sm">{ex.muscles.join(' · ')}</p>
        <div className="flex flex-wrap gap-1.5">
          <Chip tono="scuro">
            {aTempo
              ? `${item.durationRange ? `${item.durationRange[0]}–${item.durationRange[1]}` : item.durationSec}"`
              : item.reps}
            {item.perSide ? ' per lato' : ''}
          </Chip>
          <Chip>Rec {item.restSec}&quot;</Chip>
        </div>
        {item.notes ? <p className="soft text-sm">{item.notes}</p> : null}

        <button type="button" className="btn-vetro w-full" onClick={() => setScheda(ex.id)}>
          <CircleHelp size={18} /> Come si esegue
        </button>

        {aTempo ? (
          <>
            <p className="soft text-sm">{suggerimento.message}</p>
            <button
              type="button"
              className="btn-primario w-full text-lg"
              onClick={onAvvia}
              disabled={fase !== 'attesa'}
            >
              <Play size={20} /> Avvia {suggerimento.durationSec}&quot;
              {item.perSide ? ' per lato' : ''}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn-primario w-full text-lg"
            onClick={onCompleta}
            disabled={fase !== 'attesa'}
          >
            <Check size={20} /> Completato
          </button>
        )}
        {fase === 'recupero' ? (
          <p className="soft text-center text-sm font-semibold">Recupero in corso…</p>
        ) : null}
      </Card>

      <Card>
        <Etichetta>Ordine del circuito</Etichetta>
        <ul className="mt-2 space-y-1 text-sm">
          {items.map((it, i) => (
            <li
              key={i}
              className={`flex justify-between gap-3 rounded-xl px-2 py-1.5 ${
                i === indice ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro' : 'soft'
              }`}
            >
              <span className="truncate">{exerciseName(it.exerciseId)}</span>
              <span className="cifre shrink-0 font-semibold">
                {it.reps ??
                  (it.durationRange ? `${it.durationRange[0]}–${it.durationRange[1]}"` : `${it.durationSec}"`)}
                {it.perSide ? ' / lato' : ''}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {scheda ? (
        <ExerciseSheet exercise={exerciseById(scheda)!} onClose={() => setScheda(null)} />
      ) : null}
    </div>
  );
}

function BloccoCardio({
  workout,
  fatto,
  feel,
  onFatto,
  onFeel,
  onTimer,
}: {
  workout: ReturnType<typeof workoutForSession>;
  fatto: boolean;
  feel?: 'facile' | 'giusto' | 'difficile';
  onFatto: () => void;
  onFeel: (f: 'facile' | 'giusto' | 'difficile') => void;
  onTimer: (sec: number, label: string) => void;
}) {
  const c = workout.cardio;
  const ex = exerciseById(c.exerciseId)!;

  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <Etichetta>Cardio · {c.totalMin} minuti</Etichetta>
        <h2 className="font-display text-2xl font-extrabold leading-tight">{ex.name}</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tono="scuro">{c.target}</Chip>
          <span className="inline-flex items-center rounded-full bg-black/[0.07] pl-2.5 text-xs font-bold dark:bg-white/10">
            RPE
            <InfoTermine termine="RPE" testo={GLOSSARY.rpe} />
          </span>
        </div>
        {c.settings ? <p className="soft text-sm">{c.settings}</p> : null}
        {c.type === 'liss' ? <p className="soft text-sm">{suggestCardioAdjust(feel)}</p> : null}
      </Card>

      {c.type === 'intervalli' ? (
        <IntervalTimer cardio={c} storageKey={CHIAVE_CARDIO} onDone={onFatto} />
      ) : (
        <Card forte className="space-y-3">
          <p className="text-[15px] leading-relaxed">
            Ritmo costante in zona 2: devi riuscire a parlare a frasi, non a cantare. FC indicativa
            110–128 bpm.
          </p>
          <button
            type="button"
            className="btn-primario w-full text-lg"
            onClick={() => onTimer(c.totalMin * 60, `${ex.name} · zona 2`)}
          >
            <Play size={20} /> Avvia {c.totalMin}&#8242;
          </button>
        </Card>
      )}

      <Card className="space-y-2">
        <Etichetta>Com&apos;è andato il cardio?</Etichetta>
        <p className="soft text-sm">Serve a regolare pendenza e resistenza la prossima volta.</p>
        <div className="flex gap-2">
          {(['facile', 'giusto', 'difficile'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFeel(f)}
              className={`btn flex-1 text-sm ${
                feel === f
                  ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                  : 'bg-white/70 dark:bg-white/10'
              }`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {fatto ? <p className="soft text-sm font-semibold">Cardio completato ✓</p> : null}
      </Card>
    </div>
  );
}

function BloccoFine({
  durataSec,
  serieFatte,
  serieTotali,
  volume,
  note,
  rpe,
  onNote,
  onRpe,
  onSalva,
}: {
  durataSec: number;
  serieFatte: number;
  serieTotali: number;
  volume: number;
  note: string;
  rpe?: number;
  onNote: (v: string) => void;
  onRpe: (v: number) => void;
  onSalva: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card forte className="space-y-3">
        <Etichetta>Riepilogo della sessione</Etichetta>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Dato valore={formatClock(durataSec)} etichetta="Durata" />
          <Dato valore={`${serieFatte}/${serieTotali}`} etichetta="Serie" />
          <Dato valore={`${volume} kg`} etichetta="Volume" />
        </div>
      </Card>

      <Card className="space-y-3">
        <Etichetta>Quanto è stata faticosa? (1–10)</Etichetta>
        <div className="flex items-center justify-between gap-3">
          <Stepper value={rpe ?? 5} min={1} max={10} onChange={onRpe} />
          <p className="soft flex-1 text-sm">
            1 = molto facile, 10 = non avresti fatto un&apos;altra ripetizione.
          </p>
        </div>
      </Card>

      <Card className="space-y-2">
        <Etichetta>Note</Etichetta>
        <textarea
          className="campo min-h-[110px] resize-none py-3"
          placeholder="Come ti sei sentita, carichi, macchine occupate…"
          value={note}
          onChange={(e) => onNote(e.target.value)}
        />
      </Card>

      <button type="button" className="btn-primario w-full text-lg" onClick={onSalva}>
        <Check size={20} /> Salva sessione
      </button>
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

/** Raggruppa gli esercizi in superserie consecutive (3a, 3b). */
export function raggruppaSuperserie(strength: PrescribedItem[]): {
  chiave: string;
  indici: number[];
  etichette: string[];
}[] {
  const gruppi: { chiave: string; indici: number[]; etichette: string[] }[] = [];
  strength.forEach((item, i) => {
    const ultimo = gruppi[gruppi.length - 1];
    if (item.supersetGroup && ultimo && ultimo.chiave === item.supersetGroup) {
      ultimo.indici.push(i);
    } else {
      gruppi.push({ chiave: item.supersetGroup ?? `x${i}`, indici: [i], etichette: [] });
    }
  });
  const lettere = ['a', 'b', 'c'];
  gruppi.forEach((g, gi) => {
    g.etichette = g.indici.map((_, k) =>
      g.indici.length > 1 ? `${gi + 1}${lettere[k]}` : `${gi + 1}`,
    );
  });
  return gruppi;
}
