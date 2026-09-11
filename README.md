# Martina

App web mobile-first (PWA installabile) che guida un programma di allenamento in palestra
di **12 settimane / 24 sessioni**, con registro dei carichi, timer e progressione automatica.

Funziona **completamente offline**: nessun account, nessun server, nessun dato che esce dal
telefono. Tutto è salvato in locale nel browser (IndexedDB).

## Cosa c'è dentro

- **Oggi** — fase corrente, sessione *n* di 24, barra di avanzamento, entrambi gli allenamenti
  della fase (A e B, con uno consigliato) tra cui scegliere liberamente, riepilogo della
  settimana e promemoria delle 48 ore di recupero.
- **Allenamento** — flusso guidato a blocchi: riscaldamento → forza → core → cardio →
  defaticamento → riepilogo.
  - ogni esercizio ha una breve spiegazione ("Come si esegue": passi, errori comuni,
    alternative se la macchina è occupata, campo per un link video a tua scelta);
  - **peso suggerito** dalla logica di progressione, modificabile con **+** e **−**;
  - **timer di recupero** che parte da solo dopo "Completato", con beep negli ultimi
    3 secondi, vibrazione dove supportata, **+15"** e **Salta**;
  - **superserie**: il recupero parte solo dopo aver completato la serie di entrambi
    gli esercizi;
  - **circuito core** a giri con timer per plank e side plank;
  - **cardio** LISS a durata oppure a intervalli, con fase a tutto schermo (colore **e**
    testo "LAVORO"/"RECUPERO") e beep al cambio fase.
- **Progressi** — dashboard con sessioni completate, volume sollevato, grafico del carico
  nel tempo per ogni esercizio, tenute di plank e side plank, peso con media mobile a
  7 giorni e circonferenza vita.
- **Esercizi** — libreria filtrabile e ricercabile con tutte le schede tecniche.
- **Consigli** e **Impostazioni** (profilo, incrementi della tua palestra, suoni, vibrazione,
  tema, backup JSON, reset programma).

### I timer continuano se cambi app

Tutti i timer sono calcolati su un **istante di fine assoluto** e salvati nel dispositivo:
se passi a un'altra applicazione, blocchi lo schermo o ricarichi la pagina, al ritorno il
conteggio è quello corretto. Si azzerano solo se chiudi del tutto l'app.
Durante l'allenamento è attivo il **Wake Lock**, così lo schermo non si spegne da solo.

Se chiudi l'app a metà allenamento, al riavvio l'app propone di **riprendere la sessione**.

## Avviare l'app in locale

Serve [Node.js](https://nodejs.org) 18 o successivo.

```bash
npm install
npm run dev      # apre lo sviluppo su http://localhost:5173
npm run build    # build di produzione nella cartella dist/
npm run preview  # anteprima della build
npm run test     # test della logica (sequenza sessioni e progressione)
npm run icons    # rigenera le icone della PWA
```

## Installarla sul telefono

1. Pubblica l'app (vedi sotto) oppure apri l'indirizzo del computer dal telefono
   sulla stessa rete Wi-Fi (`npm run dev -- --host`).
2. **iPhone (Safari)**: tocca *Condividi* → *Aggiungi a schermata Home*.
3. **Android (Chrome)**: menu ⋮ → *Installa app* / *Aggiungi a schermata Home*.

Dopo la prima apertura l'app resta disponibile anche senza connessione: in palestra
funziona tutto, compresi timer, registro dei carichi e grafici.

## Pubblicarla gratis

La build è statica: basta caricare la cartella `dist/`.

- **Netlify** — trascina la cartella `dist` su [app.netlify.com/drop](https://app.netlify.com/drop),
  oppure collega il repository con *build command* `npm run build` e *publish directory* `dist`.
- **Vercel** — importa il repository: il preset Vite viene riconosciuto da solo
  (build `npm run build`, output `dist`).
- **GitHub Pages** — `npm run build`, poi pubblica `dist/` sul branch `gh-pages`
  (per esempio con `npx gh-pages -d dist`). I percorsi sono relativi, quindi l'app
  funziona anche in una sottocartella tipo `https://utente.github.io/MarinApp/`.

## Come sono strutturati i dati

```
src/
  data/        exercises.ts, program.ts, tips.ts — contenuti del programma
  types/       modello dati TypeScript
  db/          dexie.ts — IndexedDB, backup ed esportazione
  lib/         progression.ts, session-sequence.ts, timers.ts, audio.ts, history.ts
  components/  RestTimer, IntervalTimer, ExerciseCard, ExerciseSheet, ui
  pages/       Home, Workout, ExerciseLibrary, History, Progress, Tips, Settings, …
  tests/       test della logica
```

### Regole di progressione

- **Doppia progressione**: quando tutte le serie arrivano al limite alto del range, la volta
  dopo l'app propone più carico (manubri +incremento impostato, macchine e cavi +1 piastra,
  leg press +5 kg, bilanciere +2,5 kg). Sotto il limite basso si mantiene; se succede due
  sessioni di fila si scende del 10%.
- **Cambio fase** (range più basso): ultimo carico +5%, arrotondato all'incremento disponibile.
- **Esercizi a tempo**: +5" rispetto all'ultima tenuta, fino al massimo del range della fase.
- **Esercizi a corpo libero**: solo l'obiettivo, nessun suggerimento di carico.
- Il suggerimento è **sempre modificabile**: l'ultima parola è tua.

## Design

Stile *liquid glass* (vetro smerigliato, angoli morbidi, profondità leggera) su base gialla
con testo nero, nello spirito del marchio FitExpress. Tema chiaro e scuro ad alto contrasto,
pulsanti con area tattile di almeno 48 px e azioni principali in fondo allo schermo, testo dei
timer leggibile a un metro di distanza. Nessuna immagine o video esterno: le icone sono
generate via codice (`npm run icons`).

## Avvertenza

Prima di iniziare un nuovo programma di allenamento è consigliabile un controllo medico.
Durante gli esercizi è normale sentire fatica muscolare; fermati invece se senti dolore
acuto, articolare o improvviso.
