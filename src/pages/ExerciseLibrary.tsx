import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Card, Chip, Titolo } from '../components/ui';
import { exercises } from '../data/exercises';
import { vaiA } from '../lib/router';
import type { Category } from '../types';

const categorie: { id: Category | 'tutti'; nome: string }[] = [
  { id: 'tutti', nome: 'Tutti' },
  { id: 'mobilita', nome: 'Mobilità' },
  { id: 'forza', nome: 'Forza' },
  { id: 'core', nome: 'Core' },
  { id: 'cardio', nome: 'Cardio' },
];

export default function ExerciseLibrary() {
  const [categoria, setCategoria] = useState<Category | 'tutti'>('tutti');
  const [cerca, setCerca] = useState('');

  const elenco = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return exercises.filter((e) => {
      const okCat = categoria === 'tutti' || e.category === categoria;
      const okQ =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.muscles.some((m) => m.toLowerCase().includes(q)) ||
        e.equipment.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [categoria, cerca]);

  return (
    <div className="space-y-4">
      <Titolo sub={`${exercises.length} esercizi con istruzioni passo passo`}>Esercizi</Titolo>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          className="campo pl-11"
          placeholder="Cerca per nome, muscolo o attrezzo"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categorie.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoria(c.id)}
            className={`btn min-h-[44px] shrink-0 px-4 text-sm ${
              categoria === c.id
                ? 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro'
                : 'bg-white/65 dark:bg-white/10'
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {elenco.length === 0 ? (
        <Card className="text-center">
          <p className="soft">Nessun esercizio trovato.</p>
        </Card>
      ) : null}

      <ul className="space-y-2">
        {elenco.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => vaiA(`esercizi/${e.id}`)}
              className="vetro flex min-h-[68px] w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-extrabold">{e.name}</p>
                <p className="soft truncate text-sm">{e.muscles.join(' · ')}</p>
              </div>
              <Chip>{categorie.find((c) => c.id === e.category)?.nome}</Chip>
              <ChevronRight size={18} className="shrink-0 opacity-50" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
