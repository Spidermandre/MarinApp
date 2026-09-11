/**
 * Beep generati via Web Audio API: nessun file audio esterno.
 * La vibrazione usa la Vibration API dove supportata (su iOS non lo è:
 * il fallback è silenzioso).
 */
let ctx = null;
let soundOn = true;
let vibrationOn = true;
export function configureFeedback(opts) {
    if (typeof opts.sound === 'boolean')
        soundOn = opts.sound;
    if (typeof opts.vibration === 'boolean')
        vibrationOn = opts.vibration;
}
function getCtx() {
    if (typeof window === 'undefined')
        return null;
    const Ctor = window.AudioContext ??
        window.webkitAudioContext;
    if (!Ctor)
        return null;
    if (!ctx)
        ctx = new Ctor();
    return ctx;
}
/**
 * Sblocca l'audio al primo tocco dell'utente: iOS e Android non permettono
 * di suonare finché il contesto non è stato attivato da un gesto.
 */
export function unlockAudio() {
    const c = getCtx();
    if (!c)
        return;
    if (c.state === 'suspended')
        void c.resume();
}
function tone(freq, durationMs, delayMs = 0, gain = 0.18) {
    if (!soundOn)
        return;
    const c = getCtx();
    if (!c)
        return;
    if (c.state === 'suspended')
        void c.resume();
    const start = c.currentTime + delayMs / 1000;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(start + durationMs / 1000 + 0.02);
}
export function vibrate(pattern) {
    if (!vibrationOn)
        return;
    try {
        navigator.vibrate?.(pattern);
    }
    catch {
        /* non supportata: fallback silenzioso */
    }
}
/** Beep breve del conto alla rovescia (ultimi 3 secondi). */
export function beepCountdown() {
    tone(880, 120);
    vibrate(40);
}
/** Beep lungo di fine timer. */
export function beepEnd() {
    tone(1320, 220);
    tone(1760, 260, 180);
    vibrate([80, 60, 160]);
}
/** Segnale di cambio fase negli intervalli cardio. */
export function beepPhase(kind) {
    if (kind === 'lavoro') {
        tone(660, 140);
        tone(990, 180, 130);
        vibrate([120, 60, 120]);
    }
    else {
        tone(520, 200);
        vibrate(90);
    }
}
