import { TOTAL_SESSIONS, workoutById } from '../data/program';
export { TOTAL_SESSIONS };
/** Fase (1, 2 o 3) a cui appartiene il numero di sessione. */
export function phaseOfSession(sessionNumber) {
    if (sessionNumber <= 8)
        return 1;
    if (sessionNumber <= 16)
        return 2;
    return 3;
}
/** Lettera dell'allenamento: alternanza A → B → A → B. */
export function letterOfSession(sessionNumber) {
    return sessionNumber % 2 === 1 ? 'A' : 'B';
}
/** Id dell'allenamento previsto per una sessione (es. "F2-B"). */
export function workoutIdForSession(sessionNumber) {
    return `F${phaseOfSession(sessionNumber)}-${letterOfSession(sessionNumber)}`;
}
/** Settimana del programma (1–12): 2 sessioni a settimana. */
export function weekOfSession(sessionNumber) {
    return Math.ceil(sessionNumber / 2);
}
/**
 * Settimana 1 (sessioni 1 e 2): 2 serie per tutti gli esercizi di forza,
 * anche dove il programma ne indica 3.
 */
export function setsForSession(item, sessionNumber) {
    if (weekOfSession(sessionNumber) === 1)
        return Math.min(item.sets, 2);
    return item.sets;
}
/** Allenamento della sessione, con le serie già adattate alla settimana 1. */
export function workoutForSession(sessionNumber) {
    const base = workoutById(workoutIdForSession(sessionNumber));
    if (!base)
        throw new Error(`Allenamento non trovato per la sessione ${sessionNumber}`);
    return {
        ...base,
        strength: base.strength.map((item) => ({
            ...item,
            sets: setsForSession(item, sessionNumber),
        })),
    };
}
/**
 * Prossima sessione da fare: il programma è basato sulla sequenza, non sul
 * calendario. Se si salta una settimana non si salta avanti: si riprende dalla
 * sessione successiva all'ultima completata (o saltata esplicitamente).
 */
export function nextSessionNumber(logs) {
    const done = logs.filter((l) => l.status === 'completata' || l.status === 'saltata');
    if (done.length === 0)
        return 1;
    const max = Math.max(...done.map((l) => l.sessionNumber));
    return Math.min(max + 1, TOTAL_SESSIONS + 1);
}
/** Il programma è finito quando tutte e 24 le sessioni sono state chiuse. */
export function isProgramComplete(logs) {
    return nextSessionNumber(logs) > TOTAL_SESSIONS;
}
export const HOURS_48_MS = 48 * 60 * 60 * 1000;
/**
 * Tra due sessioni devono passare almeno 48 ore: avviso non bloccante.
 * Restituisce le ore mancanti, oppure 0 se sono già passate.
 */
export function hoursUntil48h(logs, now = new Date()) {
    const completed = logs
        .filter((l) => l.status === 'completata' && l.finishedAt)
        .map((l) => new Date(l.finishedAt).getTime())
        .sort((a, b) => b - a);
    if (completed.length === 0)
        return 0;
    const elapsed = now.getTime() - completed[0];
    if (elapsed >= HOURS_48_MS)
        return 0;
    return Math.max(0, Math.ceil((HOURS_48_MS - elapsed) / (60 * 60 * 1000)));
}
/** Sessioni completate nella settimana di calendario corrente (lunedì → domenica). */
export function sessionsThisWeek(logs, now = new Date()) {
    const start = new Date(now);
    const day = (start.getDay() + 6) % 7; // lunedì = 0
    start.setDate(start.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return logs.filter((l) => l.status === 'completata' && l.finishedAt && new Date(l.finishedAt) >= start).length;
}
