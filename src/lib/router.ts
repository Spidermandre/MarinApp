import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'allenamento'; sessione: number }
  | { name: 'esercizi' }
  | { name: 'esercizio'; id: string }
  | { name: 'storico' }
  | { name: 'progressi' }
  | { name: 'consigli' }
  | { name: 'programma' }
  | { name: 'impostazioni' }
  | { name: 'completato' };

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  const [head, arg] = clean.split('/');
  switch (head) {
    case 'allenamento':
      return { name: 'allenamento', sessione: Number(arg) || 1 };
    case 'esercizi':
      return arg ? { name: 'esercizio', id: arg } : { name: 'esercizi' };
    case 'storico':
      return { name: 'storico' };
    case 'progressi':
      return { name: 'progressi' };
    case 'consigli':
      return { name: 'consigli' };
    case 'programma':
      return { name: 'programma' };
    case 'impostazioni':
      return { name: 'impostazioni' };
    case 'completato':
      return { name: 'completato' };
    default:
      return { name: 'home' };
  }
}

export function vaiA(path: string): void {
  window.location.hash = `#/${path.replace(/^\/+/, '')}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
