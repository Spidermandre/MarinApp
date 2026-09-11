import { useState } from 'react';
import { Check, CircleHelp, History as HistoryIcon } from 'lucide-react';
import { Card, Chip, Etichetta, InfoTermine, Stepper } from './ui';
import ExerciseSheet from './ExerciseSheet';
import { GLOSSARY } from '../data/tips';
import type { Exercise, PrescribedItem } from '../types';
import type { WeightSuggestion } from '../lib/progression';

export interface SetEntry {
  weightKg?: number;
  reps?: number;
  durationSec?: number;
  completed: boolean;
}

export default function ExerciseCard({
  item,
  exercise,
  etichetta,
  sets,
  suggestion,
  lastTime,
  step,
  onChange,
  onComplete,
}: {
  item: PrescribedItem;
  exercise: Exercise;
  /** "1", "3a", "3b"… */
  etichetta: string;
  sets: SetEntry[];
  suggestion: WeightSuggestion;
  lastTime: string | null;
  step: number;
  onChange: (setIndex: number, patch: Partial<SetEntry>) => void;
  onComplete: (setIndex: number) => void;
}) {
  const [spiegazione, setSpiegazione] = useState(false);
  const aTempo = typeof item.durationSec === 'number' && !item.reps;
  const senzaCarico = suggestion.action === 'corpo-libero';

  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-xl bg-inchiostro px-2 text-sm font-extrabold text-giallo dark:bg-giallo dark:text-inchiostro">
          {etichetta}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-extrabold leading-tight">{exercise.name}</h3>
          <p className="soft text-sm">{exercise.muscles.join(' · ')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tono="scuro">
          {sets.length} × {item.reps ?? `${item.durationSec}"`}
          {item.perSide ? ' per lato' : ''}
        </Chip>
        {item.restSec > 0 ? <Chip>Rec {item.restSec}&quot;</Chip> : <Chip>Superserie</Chip>}
        {item.rir ? (
          <span className="inline-flex items-center rounded-full bg-black/[0.07] pl-2.5 text-xs font-bold dark:bg-white/10">
            RIR {item.rir}
            <InfoTermine termine="RIR" testo={GLOSSARY.rir} />
          </span>
        ) : null}
      </div>

      {item.notes ? <p className="soft text-sm">{item.notes}</p> : null}
      {item.perSide ? (
        <p className="text-sm font-bold">
          Attenzione: le ripetizioni sono {item.reps} per lato / per gamba.
        </p>
      ) : null}

      <button type="button" className="btn-vetro w-full" onClick={() => setSpiegazione(true)}>
        <CircleHelp size={18} /> Come si esegue
      </button>

      <div className="rounded-2xl bg-black/[0.05] p-3 text-sm dark:bg-white/[0.07]">
        <Etichetta>Peso suggerito</Etichetta>
        <p className="mt-0.5 leading-snug">{suggestion.message}</p>
        {lastTime ? (
          <p className="soft mt-1 flex items-center gap-1.5 text-[13px]">
            <HistoryIcon size={13} /> {lastTime}
          </p>
        ) : null}
      </div>

      <ul className="space-y-2">
        {sets.map((s, i) => (
          <li
            key={i}
            className={`rounded-2xl p-2.5 transition ${
              s.completed ? 'bg-inchiostro/[0.08] dark:bg-giallo/15' : 'bg-white/55 dark:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-extrabold">Serie {i + 1}</span>
              <button
                type="button"
                onClick={() => onComplete(i)}
                aria-pressed={s.completed}
                className={`btn min-h-[44px] px-4 text-sm ${
                  s.completed
                    ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                    : 'bg-white/80 dark:bg-white/10'
                }`}
              >
                <Check size={16} /> {s.completed ? 'Fatta' : 'Completato'}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              {!senzaCarico ? (
                <label className="block">
                  <span className="etichetta">Peso</span>
                  <div className="mt-1">
                    <Stepper
                      value={s.weightKg}
                      step={step}
                      max={300}
                      suffix="kg"
                      onChange={(v) => onChange(i, { weightKg: v })}
                    />
                  </div>
                </label>
              ) : null}
              <label className="block">
                <span className="etichetta">{aTempo ? 'Secondi' : 'Ripetizioni'}</span>
                <div className="mt-1">
                  <Stepper
                    value={aTempo ? s.durationSec : s.reps}
                    step={aTempo ? 5 : 1}
                    max={aTempo ? 600 : 60}
                    onChange={(v) => onChange(i, aTempo ? { durationSec: v } : { reps: v })}
                  />
                </div>
              </label>
            </div>
          </li>
        ))}
      </ul>

      {spiegazione ? (
        <ExerciseSheet exercise={exercise} onClose={() => setSpiegazione(false)} />
      ) : null}
    </Card>
  );
}
