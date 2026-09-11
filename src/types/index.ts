export type Category = 'mobilita' | 'forza' | 'core' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  category: Category;
  muscles: string[];
  equipment: string;
  steps: string[];
  commonMistakes: string[];
  alternatives: string[];
  videoUrl?: string;
  /** true per gli esercizi a corpo libero: nessun suggerimento di carico */
  bodyweight?: boolean;
  /** tipo di attrezzo, usato dalla logica di progressione */
  loadType?: 'manubri' | 'macchina' | 'cavo' | 'legpress' | 'bilanciere' | 'nessuno';
}

export interface PrescribedItem {
  exerciseId: string;
  sets: number;
  reps?: string;
  durationSec?: number;
  durationRange?: [number, number];
  perSide?: boolean;
  restSec: number;
  rir?: string;
  supersetGroup?: string;
  notes?: string;
}

export interface CoreCircuit {
  rounds: number;
  restBetweenExercisesSec: number;
  restBetweenRoundsSec: number;
  items: PrescribedItem[];
}

export interface CardioBlock {
  exerciseId: string;
  type: 'liss' | 'intervalli';
  totalMin: number;
  target: string;
  warmupMin?: number;
  cooldownMin?: number;
  intervals?: {
    workSec: number;
    workTarget: string;
    restSec: number;
    restTarget: string;
    rounds: number;
  };
  settings?: string;
}

export interface Workout {
  id: string;
  phase: 1 | 2 | 3;
  title: string;
  estimatedMin: number;
  warmup: {
    cardio: { exerciseId: string; min: number; target: string };
    mobility: PrescribedItem[];
  };
  strength: PrescribedItem[];
  core: CoreCircuit;
  cardio: CardioBlock;
  cooldown: { min: number; description: string };
}

export interface Phase {
  id: 1 | 2 | 3;
  name: string;
  sessions: [number, number];
  goal: string;
  rir: string;
}

export interface SetLog {
  id?: number;
  sessionId: number;
  exerciseId: string;
  setIndex: number;
  weightKg?: number;
  reps?: number;
  durationSec?: number;
  completed: boolean;
}

export interface SessionLog {
  id?: number;
  sessionNumber: number;
  workoutId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'in_corso' | 'completata' | 'saltata';
  sessionRpe?: number;
  notes?: string;
  /** percezione del cardio LISS: usata dalla progressione cardio */
  cardioFeel?: 'facile' | 'giusto' | 'difficile';
  durationSec?: number;
  totalVolumeKg?: number;
}

export interface BodyMeasurement {
  id?: number;
  date: string;
  weightKg?: number;
  waistCm?: number;
}

export interface UserProfile {
  id?: number;
  sex: 'F' | 'M';
  age: number;
  heightCm: number;
  startWeightKg: number;
  goal: string;
  priorityArea: string;
  experience: string;
  frequencyPerWeek: number;
  sessionMin: number;
  place: string;
  injuries: string;
  excluded: string;
  work: string;
}

export interface Settings {
  id?: number;
  unit: 'kg';
  dumbbellStepKg: number;
  machinePlateKg: number;
  barbellStepKg: number;
  legPressStepKg: number;
  sound: boolean;
  vibration: boolean;
  theme: 'chiaro' | 'scuro' | 'auto';
  safetyNoticeSeen: boolean;
}

/** Stato di una sessione in corso, salvato per poter riprendere dopo la chiusura dell'app */
export interface ActiveSessionState {
  id?: number;
  sessionId: number;
  sessionNumber: number;
  workoutId: string;
  blockIndex: number;
  startedAt: string;
  updatedAt: string;
  data: string; // JSON serializzato dello stato della schermata Allenamento
}
