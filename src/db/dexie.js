import Dexie from 'dexie';
class TonificaDB extends Dexie {
    constructor() {
        super('tonifica12');
        Object.defineProperty(this, "sessions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "measurements", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "profile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "settings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "active", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "exerciseMeta", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.version(1).stores({
            sessions: '++id, sessionNumber, workoutId, status, startedAt, finishedAt',
            sets: '++id, sessionId, exerciseId, [sessionId+exerciseId]',
            measurements: '++id, date',
            profile: '++id',
            settings: '++id',
            active: '++id, sessionId',
            exerciseMeta: '++id, &exerciseId',
        });
    }
}
export const db = new TonificaDB();
/** Profilo precaricato — sezione 2, modificabile nelle impostazioni. */
export const DEFAULT_PROFILE = {
    id: 1,
    sex: 'F',
    age: 37,
    heightCm: 163,
    startWeightKg: 70,
    goal: 'Dimagrire / tonificare',
    priorityArea: 'Addome',
    experience: 'Principiante assoluta',
    frequencyPerWeek: 2,
    sessionMin: 60,
    place: 'Palestra',
    injuries: 'Nessuno',
    excluded: 'Corsa, calcio',
    work: 'Non sedentario',
};
export const DEFAULT_SETTINGS = {
    id: 1,
    unit: 'kg',
    dumbbellStepKg: 2,
    machinePlateKg: 2.5,
    barbellStepKg: 2.5,
    legPressStepKg: 5,
    sound: true,
    vibration: true,
    theme: 'auto',
    safetyNoticeSeen: false,
};
export async function ensureSeed() {
    const p = await db.profile.get(1);
    if (!p)
        await db.profile.put(DEFAULT_PROFILE);
    const s = await db.settings.get(1);
    if (!s)
        await db.settings.put(DEFAULT_SETTINGS);
}
export async function getSettings() {
    return (await db.settings.get(1)) ?? DEFAULT_SETTINGS;
}
export async function saveSettings(patch) {
    const current = await getSettings();
    await db.settings.put({ ...current, ...patch, id: 1 });
}
export async function getProfile() {
    return (await db.profile.get(1)) ?? DEFAULT_PROFILE;
}
export async function saveProfile(patch) {
    const current = await getProfile();
    await db.profile.put({ ...current, ...patch, id: 1 });
}
export async function getVideoUrl(exerciseId) {
    return (await db.exerciseMeta.where('exerciseId').equals(exerciseId).first())?.videoUrl;
}
export async function setVideoUrl(exerciseId, videoUrl) {
    const existing = await db.exerciseMeta.where('exerciseId').equals(exerciseId).first();
    if (existing?.id)
        await db.exerciseMeta.update(existing.id, { videoUrl });
    else
        await db.exerciseMeta.add({ exerciseId, videoUrl });
}
export async function exportBackup() {
    const [sessions, sets, measurements, profile, settings, exerciseMeta] = await Promise.all([
        db.sessions.toArray(),
        db.sets.toArray(),
        db.measurements.toArray(),
        db.profile.toArray(),
        db.settings.toArray(),
        db.exerciseMeta.toArray(),
    ]);
    return {
        app: 'tonifica12',
        version: 1,
        exportedAt: new Date().toISOString(),
        sessions,
        sets,
        measurements,
        profile,
        settings,
        exerciseMeta,
    };
}
export async function importBackup(payload) {
    if (payload?.app !== 'tonifica12') {
        throw new Error('Il file non sembra un backup di Tonifica 12.');
    }
    await db.transaction('rw', [db.sessions, db.sets, db.measurements, db.profile, db.settings, db.exerciseMeta, db.active], async () => {
        await Promise.all([
            db.sessions.clear(),
            db.sets.clear(),
            db.measurements.clear(),
            db.profile.clear(),
            db.settings.clear(),
            db.exerciseMeta.clear(),
            db.active.clear(),
        ]);
        await db.sessions.bulkAdd(payload.sessions ?? []);
        await db.sets.bulkAdd(payload.sets ?? []);
        await db.measurements.bulkAdd(payload.measurements ?? []);
        await db.profile.bulkAdd(payload.profile ?? [DEFAULT_PROFILE]);
        await db.settings.bulkAdd(payload.settings ?? [DEFAULT_SETTINGS]);
        await db.exerciseMeta.bulkAdd(payload.exerciseMeta ?? []);
    });
}
/** Reset del programma: cancella sessioni, serie e sessione in corso. */
export async function resetProgram() {
    await db.transaction('rw', [db.sessions, db.sets, db.active], async () => {
        await db.sessions.clear();
        await db.sets.clear();
        await db.active.clear();
    });
}
