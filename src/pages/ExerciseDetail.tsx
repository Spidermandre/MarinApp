import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft } from 'lucide-react';
import { Card, Chip, Etichetta, Titolo } from '../components/ui';
import { exerciseById } from '../data/exercises';
import { db, getVideoUrl, setVideoUrl } from '../db/dexie';
import { buildHistory, lastTimeLabel } from '../lib/history';
import { vaiA } from '../lib/router';

export default function ExerciseDetail({ id }: { id: string }) {
  const ex = exerciseById(id);
  const sessions = useLiveQuery(() => db.sessions.toArray(), [], []);
  const sets = useLiveQuery(() => db.sets.toArray(), [], []);
  const [url, setUrl] = useState('');

  useEffect(() => {
    void getVideoUrl(id).then((v) => setUrl(v ?? ''));
  }, [id]);

  if (!ex) {
    return (
      <Card className="mt-8 text-center">
        <p>Esercizio non trovato.</p>
      </Card>
    );
  }

  const storico = buildHistory(id, sessions, sets);
  const ultima = lastTimeLabel(storico);

  return (
    <div className="space-y-4">
      <button type="button" className="btn-vetro" onClick={() => vaiA('esercizi')}>
        <ChevronLeft size={18} /> Esercizi
      </button>

      <Titolo sub={`${ex.muscles.join(' · ')} — ${ex.equipment}`}>{ex.name}</Titolo>

      {ultima ? (
        <Card>
          <Etichetta>Il tuo ultimo dato</Etichetta>
          <p className="mt-1 font-display text-lg font-extrabold">{ultima}</p>
        </Card>
      ) : null}

      <Card>
        <Etichetta>Come si esegue</Etichetta>
        <ol className="mt-2 space-y-2">
          {ex.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-inchiostro text-xs font-extrabold text-giallo dark:bg-giallo dark:text-inchiostro">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      {ex.commonMistakes.length ? (
        <Card>
          <Etichetta>Errori comuni</Etichetta>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
            {ex.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {ex.alternatives.length ? (
        <Card>
          <Etichetta>Alternative</Etichetta>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {ex.alternatives.map((m, i) => (
              <li key={i}>
                <Chip>{m}</Chip>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <Etichetta>Link video (facoltativo)</Etichetta>
        <p className="soft mb-2 mt-1 text-sm">
          L&apos;app non include video. Puoi incollare il link a un video di tua scelta.
        </p>
        <input
          className="campo"
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="btn-vetro flex-1"
            onClick={() => void setVideoUrl(id, url.trim())}
          >
            Salva link
          </button>
          {url ? (
            <a className="btn-primario flex-1" href={url} target="_blank" rel="noreferrer">
              Apri video
            </a>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
