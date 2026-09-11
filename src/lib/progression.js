export const DEFAULT_INCREMENTS = {
    dumbbellStepKg: 2,
    machinePlateKg: 2.5,
    barbellStepKg: 2.5,
    legPressStepKg: 5,
};
/** "12-15" → [12, 15] · "10" → [10, 10] · undefined → undefined */
export function parseRepRange(reps) {
    if (!reps)
        return undefined;
    const nums = reps
        .replace(/–|—/g, '-')
        .match(/\d+/g);
    if (!nums || nums.length === 0)
        return undefined;
    const low = Number(nums[0]);
    const high = Number(nums[nums.length - 1]);
    return [low, high];
}
/** Incremento minimo disponibile per quell'esercizio. */
export function incrementFor(exercise, inc) {
    switch (exercise.loadType) {
        case 'manubri':
            return inc.dumbbellStepKg;
        case 'legpress':
            return inc.legPressStepKg;
        case 'bilanciere':
            return inc.barbellStepKg;
        case 'macchina':
        case 'cavo':
            return inc.machinePlateKg;
        default:
            return inc.machinePlateKg;
    }
}
/** Arrotonda al multiplo dell'incremento disponibile. */
export function roundToIncrement(weight, step, mode = 'nearest') {
    if (step <= 0)
        return Math.round(weight * 10) / 10;
    const q = weight / step;
    const n = mode === 'up' ? Math.ceil(q) : mode === 'down' ? Math.floor(q) : Math.round(q);
    return Math.round(n * step * 100) / 100;
}
const completedSets = (e) => e.sets.filter((s) => s.completed);
const lastWeight = (e) => {
    const done = completedSets(e).filter((s) => typeof s.weightKg === 'number');
    if (done.length === 0)
        return undefined;
    return Math.max(...done.map((s) => s.weightKg));
};
/** true se in tutte le serie completate sono state raggiunte le ripetizioni alte. */
export function reachedTop(e) {
    const range = parseRepRange(e.prescribedReps);
    const done = completedSets(e);
    if (!range || done.length === 0)
        return false;
    return done.every((s) => (s.reps ?? 0) >= range[1]);
}
/** true se in almeno una serie non è stato raggiunto il limite basso del range. */
export function belowBottom(e) {
    const range = parseRepRange(e.prescribedReps);
    const done = completedSets(e);
    if (!range || done.length === 0)
        return false;
    return done.some((s) => (s.reps ?? 0) < range[0]);
}
/**
 * Doppia progressione (sezione 9 del programma).
 * `history` è ordinata dalla sessione più vecchia alla più recente.
 * Il suggerimento è sempre modificabile dall'utente.
 */
export function suggestWeight(exercise, item, history, inc = DEFAULT_INCREMENTS) {
    if (exercise.bodyweight || exercise.loadType === 'nessuno') {
        return {
            action: 'corpo-libero',
            message: `Obiettivo: ${item.reps ?? ''} ripetizioni${item.perSide ? ' per lato' : ''}.`,
        };
    }
    const withWeights = history.filter((h) => lastWeight(h) !== undefined);
    if (withWeights.length === 0) {
        return {
            action: 'nuovo',
            message: 'Scegli un peso con cui fai tutte le ripetizioni con il RIR indicato.',
        };
    }
    const last = withWeights[withWeights.length - 1];
    const weight = lastWeight(last);
    const step = incrementFor(exercise, inc);
    // Cambio fase: range di ripetizioni più basso rispetto all'ultima volta.
    const currentRange = parseRepRange(item.reps);
    const lastRange = parseRepRange(last.prescribedReps);
    if (currentRange && lastRange && currentRange[1] < lastRange[1]) {
        const target = roundToIncrement(weight * 1.05, step, 'up');
        return {
            weightKg: target,
            action: 'cambio-fase',
            message: `Nuova fase con meno ripetizioni: prova ${fmt(target)} kg (circa +5%).`,
        };
    }
    // Tutte le serie al limite alto → aumenta.
    if (reachedTop(last)) {
        const target = roundToIncrement(weight + step, step, 'nearest');
        return {
            weightKg: target,
            action: 'aumenta',
            message: `L’ultima volta hai chiuso tutte le serie al massimo: sali a ${fmt(target)} kg.`,
        };
    }
    // Sotto il limite basso per 2 sessioni consecutive → riduci del 10%.
    const prev = withWeights[withWeights.length - 2];
    if (belowBottom(last) && prev && belowBottom(prev)) {
        const target = roundToIncrement(weight * 0.9, step, 'down');
        return {
            weightKg: target > 0 ? target : weight,
            action: 'riduci',
            message: `Due sessioni sotto il minimo del range: scendi a ${fmt(target > 0 ? target : weight)} kg e ricostruisci.`,
        };
    }
    if (belowBottom(last)) {
        return {
            weightKg: weight,
            action: 'mantieni',
            message: `Mantieni ${fmt(weight)} kg e punta ad arrivare al minimo del range.`,
        };
    }
    return {
        weightKg: weight,
        action: 'mantieni',
        message: `Mantieni ${fmt(weight)} kg: l’obiettivo è aggiungere ripetizioni.`,
    };
}
/**
 * Esercizi a tempo (plank, side plank): +5" rispetto all'ultima tenuta
 * completata, fino al massimo del range della fase.
 */
export function suggestDuration(item, history) {
    const range = item.durationRange;
    const base = item.durationSec ?? range?.[0] ?? 30;
    const max = range?.[1] ?? item.durationSec ?? base;
    const holds = history
        .flatMap((h) => h.sets.filter((s) => s.completed && typeof s.durationSec === 'number'))
        .map((s) => s.durationSec);
    if (holds.length === 0) {
        return { durationSec: base, message: `Obiettivo: ${base}"${max > base ? `–${max}"` : ''}.` };
    }
    const lastHold = holds[holds.length - 1];
    const target = Math.min(lastHold + 5, max);
    return {
        durationSec: target,
        message: target > lastHold
            ? `Ultima tenuta ${lastHold}": prova ${target}".`
            : `Sei al massimo del range (${max}"): mantieni ${target}".`,
    };
}
/** Cardio LISS: se l'ultima volta è stata "facile", alza di un gradino. */
export function suggestCardioAdjust(lastFeel) {
    if (lastFeel === 'facile') {
        return 'L’ultima volta è stata facile: aggiungi +1% di pendenza o +1 livello di resistenza.';
    }
    if (lastFeel === 'difficile') {
        return 'L’ultima volta è stata dura: resta sulle stesse impostazioni.';
    }
    return 'Resta in zona 2: devi riuscire a parlare a frasi, non a cantare.';
}
function fmt(n) {
    return String(Math.round(n * 100) / 100).replace('.', ',');
}
