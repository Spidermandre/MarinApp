import type { CardioBlock, CoreCircuit, Phase, PrescribedItem, Workout } from '../types';

/** Riscaldamento comune a tutte le sessioni (8 minuti) — mobilità, 1 giro. */
export const mobilityWarmup: PrescribedItem[] = [
  { exerciseId: 'cat-cow', sets: 1, reps: '8', restSec: 0 },
  { exerciseId: 'hip-circles', sets: 1, reps: '8', perSide: true, restSec: 0 },
  { exerciseId: 'worlds-greatest-stretch', sets: 1, reps: '4', perSide: true, restSec: 0 },
  { exerciseId: 'glute-bridge', sets: 1, reps: '10', restSec: 0 },
];

/** Defaticamento comune (3 minuti). */
export const cooldown = {
  min: 3,
  description:
    'Allungamento leggero, 30" per posizione: flessori dell’anca in affondo, glutei (gamba incrociata da supina), pettorali al muro.',
};

export const cooldownItems = [
  'Flessori dell’anca in affondo — 30" per lato',
  'Glutei (gamba incrociata da supina) — 30" per lato',
  'Pettorali al muro — 30" per lato',
];

export const phases: Phase[] = [
  {
    id: 1,
    name: 'Fondamenta',
    sessions: [1, 8],
    goal: 'Imparare i movimenti, carichi leggeri, tecnica perfetta.',
    rir: 'RIR 3–4',
  },
  {
    id: 2,
    name: 'Pesi liberi',
    sessions: [9, 16],
    goal: 'Introdurre squat, stacco e panca con i manubri.',
    rir: 'RIR 2–3',
  },
  {
    id: 3,
    name: 'Intensificazione',
    sessions: [17, 24],
    goal: 'Aumentare i carichi e la densità.',
    rir: 'RIR 1–2 sugli esercizi principali',
  },
];

const core = (
  rounds: number,
  restBetweenExercisesSec: number,
  restBetweenRoundsSec: number,
  items: PrescribedItem[],
): CoreCircuit => ({ rounds, restBetweenExercisesSec, restBetweenRoundsSec, items });

const cardio = (b: CardioBlock): CardioBlock => b;

export const workouts: Workout[] = [
  // ------------------------------------------------------- FASE 1 · F1-A
  {
    id: 'F1-A',
    phase: 1,
    title: 'Fase 1 · Allenamento A',
    estimatedMin: 58,
    warmup: {
      cardio: { exerciseId: 'cyclette', min: 5, target: 'Cardio leggero, RPE 4' },
      mobility: mobilityWarmup,
    },
    strength: [
      {
        exerciseId: 'box-squat',
        sets: 2,
        reps: '10',
        restSec: 60,
        rir: '4',
        notes: 'Didattico: impara il movimento dello squat',
      },
      { exerciseId: 'leg-press', sets: 3, reps: '12-15', restSec: 90, rir: '3' },
      {
        exerciseId: 'chest-press-machine',
        sets: 3,
        reps: '12-15',
        restSec: 0,
        rir: '3',
        supersetGroup: 'S1',
      },
      {
        exerciseId: 'seated-cable-row',
        sets: 3,
        reps: '12-15',
        restSec: 75,
        rir: '3',
        supersetGroup: 'S1',
      },
      { exerciseId: 'glute-bridge', sets: 3, reps: '15', restSec: 60, rir: '3', notes: 'Tieni 2" in alto' },
    ],
    core: core(2, 30, 60, [
      { exerciseId: 'dead-bug', sets: 1, reps: '8', perSide: true, restSec: 30 },
      { exerciseId: 'plank', sets: 1, durationRange: [20, 30], restSec: 30, notes: 'Sulle ginocchia se serve' },
      { exerciseId: 'bird-dog', sets: 1, reps: '8', perSide: true, restSec: 30 },
    ]),
    cardio: cardio({
      exerciseId: 'cyclette',
      type: 'liss',
      totalMin: 12,
      target: 'Zona 2 · RPE 5-6',
    }),
    cooldown,
  },

  // ------------------------------------------------------- FASE 1 · F1-B
  {
    id: 'F1-B',
    phase: 1,
    title: 'Fase 1 · Allenamento B',
    estimatedMin: 58,
    warmup: {
      cardio: { exerciseId: 'elliptical', min: 5, target: 'Cardio leggero, RPE 4' },
      mobility: mobilityWarmup,
    },
    strength: [
      {
        exerciseId: 'hip-hinge-dowel',
        sets: 2,
        reps: '10',
        restSec: 60,
        rir: '4',
        notes: 'Didattico: impara il movimento dello stacco',
      },
      { exerciseId: 'leg-curl-seated', sets: 3, reps: '12-15', restSec: 75, rir: '3' },
      { exerciseId: 'lat-pulldown', sets: 3, reps: '12-15', restSec: 0, rir: '3', supersetGroup: 'S1' },
      {
        exerciseId: 'shoulder-press-machine',
        sets: 3,
        reps: '12-15',
        restSec: 75,
        rir: '3',
        supersetGroup: 'S1',
      },
      {
        exerciseId: 'step-up',
        sets: 3,
        reps: '10',
        perSide: true,
        restSec: 60,
        rir: '3',
        notes: 'Corpo libero · gradino 30–40 cm',
      },
    ],
    core: core(2, 30, 60, [
      { exerciseId: 'pallof-press', sets: 1, reps: '10', perSide: true, restSec: 30 },
      {
        exerciseId: 'side-plank',
        sets: 1,
        durationSec: 20,
        perSide: true,
        restSec: 30,
        notes: 'Sulle ginocchia se serve',
      },
      { exerciseId: 'reverse-crunch', sets: 1, reps: '10', restSec: 30 },
    ]),
    cardio: cardio({
      exerciseId: 'incline-walk',
      type: 'liss',
      totalMin: 12,
      target: 'Zona 2 · RPE 5-6',
      settings: '5–5,5 km/h, pendenza 6–10%. Non reggersi ai corrimano, non correre.',
    }),
    cooldown,
  },

  // ------------------------------------------------------- FASE 2 · F2-A
  {
    id: 'F2-A',
    phase: 2,
    title: 'Fase 2 · Allenamento A',
    estimatedMin: 59,
    warmup: {
      cardio: { exerciseId: 'rower', min: 5, target: 'Leggero, RPE 4' },
      mobility: mobilityWarmup,
    },
    strength: [
      {
        exerciseId: 'goblet-squat',
        sets: 3,
        reps: '10-12',
        restSec: 90,
        rir: '2-3',
        notes: 'Carico iniziale indicativo 6–10 kg',
      },
      {
        exerciseId: 'db-bench-press',
        sets: 3,
        reps: '10-12',
        restSec: 0,
        rir: '2-3',
        supersetGroup: 'S1',
      },
      {
        exerciseId: 'seated-cable-row',
        sets: 3,
        reps: '10-12',
        restSec: 75,
        rir: '2-3',
        supersetGroup: 'S1',
      },
      {
        exerciseId: 'hip-thrust',
        sets: 3,
        reps: '12',
        restSec: 75,
        rir: '2-3',
        notes: 'Con manubrio · tieni 1–2" in alto',
      },
      {
        exerciseId: 'split-squat',
        sets: 2,
        reps: '10',
        perSide: true,
        restSec: 60,
        rir: '3',
        notes: 'Puoi tenerti a un supporto',
      },
    ],
    core: core(3, 20, 60, [
      {
        exerciseId: 'dead-bug',
        sets: 1,
        reps: '8',
        perSide: true,
        restSec: 20,
        notes: 'Manubrio leggero 2–4 kg tra le mani se facile',
      },
      { exerciseId: 'plank', sets: 1, durationRange: [30, 40], restSec: 20 },
      { exerciseId: 'cable-crunch', sets: 1, reps: '12', restSec: 20 },
    ]),
    cardio: cardio({
      exerciseId: 'cyclette',
      type: 'intervalli',
      totalMin: 12,
      target: 'Intervalli',
      warmupMin: 3,
      intervals: {
        workSec: 30,
        workTarget: 'RPE 8',
        restSec: 60,
        restTarget: 'RPE 3',
        rounds: 6,
      },
    }),
    cooldown,
  },

  // ------------------------------------------------------- FASE 2 · F2-B
  {
    id: 'F2-B',
    phase: 2,
    title: 'Fase 2 · Allenamento B',
    estimatedMin: 59,
    warmup: {
      cardio: { exerciseId: 'elliptical', min: 5, target: 'Cardio leggero, RPE 4' },
      mobility: mobilityWarmup,
    },
    strength: [
      {
        exerciseId: 'db-rdl',
        sets: 3,
        reps: '10-12',
        restSec: 90,
        rir: '2-3',
        notes: 'Stessa tecnica dell’hip hinge',
      },
      { exerciseId: 'lat-pulldown', sets: 3, reps: '10-12', restSec: 0, rir: '2-3', supersetGroup: 'S1' },
      {
        exerciseId: 'db-shoulder-press',
        sets: 3,
        reps: '10-12',
        restSec: 75,
        rir: '2-3',
        supersetGroup: 'S1',
      },
      { exerciseId: 'one-arm-db-row', sets: 3, reps: '10', perSide: true, restSec: 60, rir: '2-3' },
      {
        exerciseId: 'step-up',
        sets: 2,
        reps: '10',
        perSide: true,
        restSec: 60,
        rir: '3',
        notes: 'Manubri 2–6 kg per mano',
      },
    ],
    core: core(3, 20, 60, [
      { exerciseId: 'pallof-press', sets: 1, reps: '10', perSide: true, restSec: 20 },
      {
        exerciseId: 'side-plank',
        sets: 1,
        durationRange: [20, 30],
        perSide: true,
        restSec: 20,
        notes: 'Versione completa',
      },
      { exerciseId: 'knee-raise', sets: 1, reps: '10', restSec: 20 },
    ]),
    cardio: cardio({
      exerciseId: 'incline-walk',
      type: 'liss',
      totalMin: 14,
      target: 'Zona 2 · RPE 5-6',
      settings: '12–15′ · 5–5,5 km/h, pendenza 8–12%.',
    }),
    cooldown,
  },

  // ------------------------------------------------------- FASE 3 · F3-A
  {
    id: 'F3-A',
    phase: 3,
    title: 'Fase 3 · Allenamento A',
    estimatedMin: 60,
    warmup: {
      cardio: { exerciseId: 'rower', min: 5, target: 'Leggero, RPE 4' },
      mobility: mobilityWarmup,
    },
    strength: [
      {
        exerciseId: 'goblet-squat',
        sets: 4,
        reps: '8-10',
        restSec: 105,
        rir: '1-2',
        notes:
          'Rec 90–120". Se oltre 16–20 kg diventa scomodo da tenere, passa allo squat al multipower',
      },
      {
        exerciseId: 'db-bench-press',
        sets: 3,
        reps: '8-10',
        restSec: 0,
        rir: '1-2',
        supersetGroup: 'S1',
      },
      {
        exerciseId: 'one-arm-db-row',
        sets: 3,
        reps: '10',
        perSide: true,
        restSec: 75,
        rir: '1-2',
        supersetGroup: 'S1',
      },
      {
        exerciseId: 'hip-thrust',
        sets: 3,
        reps: '10',
        restSec: 90,
        rir: '1-2',
        notes: 'Con bilanciere o macchina · usa il pad sul bilanciere',
      },
      { exerciseId: 'reverse-lunge', sets: 2, reps: '8', perSide: true, restSec: 60, rir: '2' },
    ],
    core: core(3, 20, 60, [
      { exerciseId: 'dead-bug', sets: 1, reps: '10', perSide: true, restSec: 20 },
      { exerciseId: 'plank-shoulder-tap', sets: 1, reps: '10', perSide: true, restSec: 20 },
      { exerciseId: 'cable-crunch', sets: 1, reps: '12-15', restSec: 20 },
    ]),
    cardio: cardio({
      exerciseId: 'rower',
      type: 'intervalli',
      totalMin: 10,
      target: 'Intervalli',
      warmupMin: 2,
      intervals: {
        workSec: 20,
        workTarget: 'RPE 8',
        restSec: 40,
        restTarget: 'RPE 3',
        rounds: 8,
      },
    }),
    cooldown,
  },

  // ------------------------------------------------------- FASE 3 · F3-B
  {
    id: 'F3-B',
    phase: 3,
    title: 'Fase 3 · Allenamento B',
    estimatedMin: 60,
    warmup: {
      cardio: { exerciseId: 'elliptical', min: 5, target: 'Cardio leggero, RPE 4' },
      mobility: mobilityWarmup,
    },
    strength: [
      {
        exerciseId: 'db-rdl',
        sets: 4,
        reps: '8-10',
        restSec: 105,
        rir: '1-2',
        notes: 'Con manubri o bilanciere · Rec 90–120"',
      },
      { exerciseId: 'lat-pulldown', sets: 3, reps: '8-10', restSec: 0, rir: '1-2', supersetGroup: 'S1' },
      {
        exerciseId: 'db-shoulder-press',
        sets: 3,
        reps: '8-10',
        restSec: 75,
        rir: '1-2',
        supersetGroup: 'S1',
      },
      { exerciseId: 'leg-press', sets: 3, reps: '10-12', restSec: 75, rir: '2' },
      {
        exerciseId: 'farmer-walk',
        sets: 3,
        durationSec: 40,
        restSec: 60,
        notes: '30 m (o 40") · manubri pesanti, postura perfetta',
      },
    ],
    core: core(3, 20, 60, [
      {
        exerciseId: 'pallof-press',
        sets: 1,
        reps: '10',
        perSide: true,
        restSec: 20,
        notes: 'Tenuta 3" a braccia tese',
      },
      { exerciseId: 'side-plank', sets: 1, durationRange: [30, 40], perSide: true, restSec: 20 },
      { exerciseId: 'knee-raise', sets: 1, reps: '12', restSec: 20 },
    ]),
    cardio: cardio({
      exerciseId: 'stair-climber',
      type: 'intervalli',
      totalMin: 10,
      target: 'Intervalli · in alternativa ellittica',
      warmupMin: 2,
      intervals: {
        workSec: 60,
        workTarget: 'RPE 7-8',
        restSec: 60,
        restTarget: 'RPE 4',
        rounds: 4,
      },
    }),
    cooldown,
  },
];

export const workoutById = (id: string): Workout | undefined => workouts.find((w) => w.id === id);

export const TOTAL_SESSIONS = 24;

/** Principi del programma — sezione 6, mostrati nella pagina "Il tuo programma". */
export const programPrinciples: { title: string; body: string }[] = [
  {
    title: 'Full body 2 volte a settimana',
    body: 'Con 2 sessioni è la scelta più efficace, perché ogni gruppo muscolare viene allenato due volte.',
  },
  {
    title: 'Tre fasi da 4 settimane',
    body: '1) Imparare i movimenti sulle macchine e con esercizi didattici; 2) passare ai pesi liberi (squat con manubrio, stacco rumeno, panca con manubri); 3) aumentare l’intensità.',
  },
  {
    title: 'Struttura di ogni sessione (circa 60 minuti)',
    body: 'Riscaldamento 8′ → forza 25–35′ → core 8–10′ → cardio 10–15′ → defaticamento 3′.',
  },
  {
    title: 'Superserie',
    body: 'Tra esercizi di spinta e trazione per risparmiare tempo e aumentare il dispendio energetico.',
  },
  {
    title: 'Intensità con il RIR',
    body: 'RIR = ripetizioni in riserva: quante ripetizioni avresti ancora potuto fare prima di non riuscire più. RIR 3 = ne avresti fatte altre 3.',
  },
  {
    title: 'Discesa controllata',
    body: 'In tutti gli esercizi di forza la fase di discesa dura circa 2–3 secondi.',
  },
  {
    title: 'Core moderno',
    body: 'Priorità a esercizi di stabilità (anti-estensione, anti-rotazione, anti-flessione laterale) come dead bug, plank, Pallof press e side plank, affiancati da pochi esercizi di flessione (crunch inverso, crunch al cavo, knee raise).',
  },
  {
    title: 'Cardio a basso impatto, nessuna corsa',
    body: 'Cyclette, ellittica, camminata in salita sul tapis roulant, vogatore, stair climber. Alternanza tra zona 2 (ritmo costante) e intervalli.',
  },
];

export const cardioZones: { zone: string; feel: string; rpe: string; hr: string }[] = [
  {
    zone: 'Zona 2 / LISS',
    feel: 'Riesci a parlare a frasi, non a cantare',
    rpe: '5–6 / 10',
    hr: '~110–128 bpm',
  },
  {
    zone: 'Intervallo "lavoro"',
    feel: 'Riesci a dire solo poche parole',
    rpe: '8 / 10',
    hr: '—',
  },
  {
    zone: 'Intervallo "recupero"',
    feel: 'Respiro che torna tranquillo',
    rpe: '3 / 10',
    hr: '—',
  },
];

export const cardioZonesNote =
  'FC massima stimata con la formula di Tanaka (208 − 0,7 × età) ≈ 182 bpm; zona 2 ≈ 60–70%. È una stima: la percezione (RPE) ha la priorità.';
