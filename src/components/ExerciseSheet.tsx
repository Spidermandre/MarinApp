import { useEffect, useState } from 'react';
import { Link2, ListChecks, Replace, TriangleAlert } from 'lucide-react';
import { Foglio } from './ui';
import { getVideoUrl, setVideoUrl } from '../db/dexie';
import type { Exercise } from '../types';

/** Pannello "Come si esegue": passi, errori comuni, alternative, link video. */
export default function ExerciseSheet({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [salvato, setSalvato] = useState(false);

  useEffect(() => {
    void getVideoUrl(exercise.id).then((v) => setUrl(v ?? ''));
  }, [exercise.id]);

  return (
    <Foglio titolo={exercise.name} onClose={onClose}>
      <p className="soft text-sm">
        {exercise.muscles.join(' · ')} — {exercise.equipment}
      </p>

      <Sezione icona={<ListChecks size={16} />} titolo="Come si esegue">
        <ol className="space-y-2">
          {exercise.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-inchiostro text-xs font-extrabold text-giallo dark:bg-giallo dark:text-inchiostro">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Sezione>

      {exercise.commonMistakes.length ? (
        <Sezione icona={<TriangleAlert size={16} />} titolo="Errori comuni">
          <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
            {exercise.commonMistakes.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Sezione>
      ) : null}

      {exercise.alternatives.length ? (
        <Sezione icona={<Replace size={16} />} titolo="Se la macchina è occupata">
          <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed">
            {exercise.alternatives.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Sezione>
      ) : null}

      <Sezione icona={<Link2 size={16} />} titolo="Link video (facoltativo)">
        <p className="soft mb-2 text-sm">
          L&apos;app non include video. Se vuoi, incolla qui il link a un video di tua scelta.
        </p>
        <input
          className="campo"
          type="url"
          inputMode="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSalvato(false);
          }}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="btn-vetro flex-1"
            onClick={async () => {
              await setVideoUrl(exercise.id, url.trim());
              setSalvato(true);
            }}
          >
            Salva link
          </button>
          {url ? (
            <a className="btn-primario flex-1" href={url} target="_blank" rel="noreferrer">
              Apri video
            </a>
          ) : null}
        </div>
        {salvato ? <p className="soft mt-2 text-sm">Link salvato.</p> : null}
      </Sezione>
    </Foglio>
  );
}

function Sezione({
  icona,
  titolo,
  children,
}: {
  icona: React.ReactNode;
  titolo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 flex items-center gap-2 font-display text-base font-extrabold">
        {icona} {titolo}
      </h3>
      {children}
    </section>
  );
}
