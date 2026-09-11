import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Info, Minus, Plus, X } from 'lucide-react';

export function Card({
  children,
  className = '',
  forte = false,
}: {
  children: ReactNode;
  className?: string;
  forte?: boolean;
}) {
  return (
    <div className={`vetro ${forte ? 'vetro-forte' : ''} p-4 ${className}`}>{children}</div>
  );
}

export function Titolo({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-4">
      <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight">
        {children}
      </h1>
      {sub ? <p className="soft mt-1 text-sm">{sub}</p> : null}
    </div>
  );
}

export function Etichetta({ children }: { children: ReactNode }) {
  return <div className="etichetta">{children}</div>;
}

export function Barra({
  value,
  max,
  className = '',
  showLabel = false,
}: {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={className}>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-inchiostro transition-[width] duration-500 dark:bg-giallo"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <div className="soft mt-1 text-xs font-semibold">
          {Math.round(pct)}% · {value} di {max}
        </div>
      ) : null}
    </div>
  );
}

export function Chip({
  children,
  tono = 'neutro',
}: {
  children: ReactNode;
  tono?: 'neutro' | 'scuro' | 'lavoro' | 'recupero';
}) {
  const stili: Record<string, string> = {
    neutro: 'bg-black/[0.07] dark:bg-white/10',
    scuro: 'bg-inchiostro text-giallo dark:bg-giallo dark:text-inchiostro',
    lavoro: 'bg-lavoro text-white',
    recupero: 'bg-recupero text-white',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${stili[tono]}`}
    >
      {children}
    </span>
  );
}

/** Spiegazione di un termine tecnico (RIR, RPE): icona "i" con pannello. */
export function InfoTermine({ termine, testo }: { termine: string; testo: string }) {
  const [aperto, setAperto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAperto(true)}
        aria-label={`Cosa significa ${termine}`}
        className="btn-piccolo -my-2 h-9 w-9 min-h-0 min-w-0 text-current/70"
      >
        <Info size={16} />
      </button>
      {aperto ? (
        <Foglio titolo={`Cosa significa ${termine}`} onClose={() => setAperto(false)}>
          <p className="text-[15px] leading-relaxed">{testo}</p>
        </Foglio>
      ) : null}
    </>
  );
}

/** Pannello a comparsa dal basso, stile iOS. */
export function Foglio({
  titolo,
  children,
  onClose,
}: {
  titolo: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Chiudi"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />
      <div className="vetro vetro-forte animate-glass-in relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/20 dark:bg-white/25" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-extrabold leading-tight">{titolo}</h2>
          <button type="button" onClick={onClose} className="btn-piccolo bg-black/[0.07] dark:bg-white/10">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Selettore numerico con "+" e "−", area tattile grande. */
export function Stepper({
  value,
  step = 1,
  min = 0,
  max = 500,
  suffix = '',
  onChange,
  disabled = false,
  placeholder = '—',
}: {
  value?: number;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const arrotonda = (n: number) => Math.round(n * 100) / 100;
  const attuale = value ?? min;
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label="Diminuisci"
        disabled={disabled}
        onClick={() => onChange(arrotonda(Math.max(min, attuale - step)))}
        className="btn-piccolo h-11 w-11 bg-black/[0.07] disabled:opacity-40 dark:bg-white/10"
      >
        <Minus size={18} />
      </button>
      <div className="min-w-[74px] rounded-2xl bg-white/70 px-2 py-2 text-center dark:bg-white/10">
        <span className="cifre text-lg font-extrabold">
          {value === undefined ? placeholder : String(arrotonda(value)).replace('.', ',')}
        </span>
        {suffix && value !== undefined ? (
          <span className="soft ml-0.5 text-xs font-bold">{suffix}</span>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Aumenta"
        disabled={disabled}
        onClick={() => onChange(arrotonda(Math.min(max, attuale + step)))}
        className="btn-piccolo h-11 w-11 bg-black/[0.07] disabled:opacity-40 dark:bg-white/10"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

export function StatoVuoto({ titolo, testo, azione }: { titolo: string; testo: string; azione?: ReactNode }) {
  return (
    <Card className="text-center">
      <p className="font-display text-lg font-extrabold">{titolo}</p>
      <p className="soft mx-auto mt-1 max-w-xs text-sm leading-relaxed">{testo}</p>
      {azione ? <div className="mt-4">{azione}</div> : null}
    </Card>
  );
}

/** Messaggio temporaneo in sovrimpressione. */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number>();
  const mostra = (testo: string) => {
    setMsg(testo);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2600);
  };
  const nodo = msg ? (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-4">
      <div className="vetro-scuro animate-glass-in px-4 py-3 text-sm font-semibold">{msg}</div>
    </div>
  ) : null;
  return { mostra, nodo };
}
