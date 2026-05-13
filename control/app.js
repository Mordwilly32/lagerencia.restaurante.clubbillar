/* ═══════════════════════════════════════════════════════════════
   PEGAR ESTAS LÍNEAS AL INICIO DE control/app.js
   (antes de cualquier otra función)
═══════════════════════════════════════════════════════════════ */

/* Alias conveniente: el resto del código usa CFG en lugar de APP_CONFIG */
const CFG = window.APP_CONFIG || {};

/* ── Helpers globales ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LS_SESSION = "lg_session";
const LS_MOVES   = "lg_moves";

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

async function sha256(message) {
  const data   = new TextEncoder().encode(message);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Captcha matemático ──────────────────────────────────────
   Genera operaciones con números pequeños para que sean
   fáciles de resolver pero suficientes como anti-bot.
─────────────────────────────────────────────────────────────── */
function makeChallenge() {
  const ops = [
    { sym: "+",  fn: (a, b) => a + b },
    { sym: "−",  fn: (a, b) => a - b },
    { sym: "×",  fn: (a, b) => a * b },
  ];
  const pick = ops[Math.floor(Math.random() * ops.length)];

  let a, b;
  if (pick.sym === "×") {
    a = Math.floor(Math.random() * 9) + 2;   // 2–10
    b = Math.floor(Math.random() * 6) + 2;   // 2–7
  } else if (pick.sym === "−") {
    b = Math.floor(Math.random() * 10) + 1;  // 1–10
    a = b + Math.floor(Math.random() * 12);  // a > b  → resultado positivo
  } else {
    a = Math.floor(Math.random() * 15) + 1;  // 1–15
    b = Math.floor(Math.random() * 15) + 1;  // 1–15
  }

  return { a, b, op: pick.sym, answer: pick.fn(a, b) };
}
