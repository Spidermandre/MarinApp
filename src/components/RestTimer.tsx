import { Plus, SkipForward } from 'lucide-react';
import { formatClock, type CountdownApi } from '../lib/timers';

/**
 * Timer di recupero: barra fissa in basso, cifre grandi leggibili a un metro.
 * Il conteggio è basato su un istante di fine assoluto, quindi continua a
 * scorrere anche se passi a un'altra app o blocchi lo schermo.
 */
export default function RestTimer({ timer }: { timer: CountdownApi }) {
  if (!timer.running) return null;
  const pct = timer.totalSec > 0 ? (timer.remaining / timer.totalSec) * 100 : 0;
  const finale = timer.remaining <= 3;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg px-3 pb-[calc(0.6rem+env(safe-area-inset-bottom))]">
      <div className="vetro vetro-forte animate-glass-in overflow-hidden p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="etichetta truncate">{timer.label ?? 'Recupero'}</p>
            <p
              className={`cifre font-display text-[44px] font-extrabold leading-none ${
                finale ? 'animate-pulsegiallo' : ''
              }`}
            >
              {formatClock(timer.remaining)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="btn-vetro px-3" onClick={() => timer.add(15)}>
              <Plus size={16} /> 15&quot;
            </button>
            <button type="button" className="btn-primario px-3" onClick={timer.skip}>
              <SkipForward size={16} /> Salta
            </button>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-inchiostro transition-[width] duration-200 dark:bg-giallo"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
