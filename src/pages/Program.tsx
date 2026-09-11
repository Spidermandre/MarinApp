import { ChevronLeft } from 'lucide-react';
import { Card, Chip, Etichetta, Titolo } from '../components/ui';
import { cardioZones, cardioZonesNote, phases, programPrinciples, workouts } from '../data/program';
import { exerciseName } from '../data/exercises';
import { vaiA } from '../lib/router';

export default function Program() {
  return (
    <div className="space-y-4">
      <button type="button" className="btn-vetro" onClick={() => vaiA('')}>
        <ChevronLeft size={18} /> Oggi
      </button>
      <Titolo sub="24 sessioni, 3 fasi da 4 settimane">Il tuo programma</Titolo>

      {phases.map((f) => (
        <Card key={f.id}>
          <div className="flex items-center justify-between">
            <Etichetta>Fase {f.id} · {f.name}</Etichetta>
            <Chip tono="scuro">{f.rir}</Chip>
          </div>
          <p className="mt-1 text-[15px]">{f.goal}</p>
          <p className="soft mt-1 text-sm">
            Sessioni {f.sessions[0]}–{f.sessions[1]}
          </p>
          <div className="mt-3 space-y-2">
            {workouts
              .filter((w) => w.phase === f.id)
              .map((w) => (
                <div key={w.id} className="rounded-2xl bg-white/55 p-3 dark:bg-white/[0.07]">
                  <p className="font-display text-base font-extrabold">{w.title}</p>
                  <ul className="soft mt-1 space-y-0.5 text-sm">
                    {w.strength.map((s, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className="truncate">{exerciseName(s.exerciseId)}</span>
                        <span className="cifre shrink-0 font-semibold">
                          {s.sets}×{s.reps ?? `${s.durationSec}"`}
                          {s.perSide ? '/lato' : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="soft mt-1 text-xs">
                    Core: {w.core.rounds} giri · Cardio:{' '}
                    {exerciseName(w.cardio.exerciseId)} {w.cardio.totalMin}&#8242;{' '}
                    {w.cardio.type === 'liss' ? 'zona 2' : 'a intervalli'}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      ))}

      <Card>
        <Etichetta>Come funziona</Etichetta>
        <div className="mt-2 space-y-3">
          {programPrinciples.map((p) => (
            <div key={p.title}>
              <p className="font-display text-base font-extrabold">{p.title}</p>
              <p className="mt-0.5 text-[15px] leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Etichetta>Zone di intensità cardio</Etichetta>
        <div className="mt-2 space-y-2">
          {cardioZones.map((z) => (
            <div key={z.zone} className="rounded-2xl bg-white/55 p-3 dark:bg-white/[0.07]">
              <p className="font-display text-base font-extrabold">{z.zone}</p>
              <p className="text-[15px]">{z.feel}</p>
              <p className="soft text-sm">
                RPE {z.rpe} · FC {z.hr}
              </p>
            </div>
          ))}
        </div>
        <p className="soft mt-2 text-xs leading-relaxed">{cardioZonesNote}</p>
      </Card>
    </div>
  );
}
