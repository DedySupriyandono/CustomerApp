// Shared notification sound — generated via Web Audio API (no asset needed).
// Pakai 2-tone pleasant ding. Volume di-control via Page Visibility (silent
// kalau tab tidak aktif? Sebenarnya justru sebaliknya — user perlu tau saat
// tidak menatap tab. Tetap play.)
//
// Pemakaian:
//   import { playNotif, playChat } from "../utils/notifSound";
//   playNotif();  // ding-dong utk notifikasi umum
//   playChat();   // soft pop utk chat masuk

let audioCtx = null;
function getCtx() {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (_) {
    return null;
  }
  return audioCtx;
}

// Play sequence of beep tones. Each beep: { freq, durMs, delayMs }
function playTones(tones) {
  const ctx = getCtx();
  if (!ctx) return;
  // Resume context kalau di-suspend (autoplay policy)
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  let startAt = ctx.currentTime;
  tones.forEach(t => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = t.freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    // Envelope: attack 10ms, hold, release 50ms
    const dur = t.durMs / 1000;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.12, startAt + 0.01);
    gain.gain.setValueAtTime(0.12, startAt + dur - 0.05);
    gain.gain.linearRampToValueAtTime(0, startAt + dur);
    osc.start(startAt);
    osc.stop(startAt + dur);
    startAt += dur + (t.delayMs || 0) / 1000;
  });
}

// Ding-dong 2 tones — utk notifikasi penting
export function playNotif() {
  playTones([
    { freq: 880, durMs: 150, delayMs: 50 },
    { freq: 660, durMs: 200 },
  ]);
}

// Single soft pop — utk chat message
export function playChat() {
  playTones([{ freq: 1200, durMs: 90 }]);
}

// Single short beep — utk picking scan success
export function playBeep(ok = true) {
  playTones([{ freq: ok ? 880 : 220, durMs: 120 }]);
}
