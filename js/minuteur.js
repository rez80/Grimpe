// minuteur.js — repos, chrono d'exercice, fractions de course. Un seul minuteur à la fois.
// État transitoire (pas dans le document) : conservé dans localStorage pour survivre à un rechargement.

import { $, h, brut } from "./html.js";
import { mmss } from "./dates.js";

const CLE = "grimpe-minuteur";
let T = null, tick = null, audio = null, surFin = null, reglages = { son: true };

export const minuteurActif = () => T;
export function configurer({ son = true, quandFini } = {}) { reglages.son = son; surFin = quandFini; }

// phases : [{ label, duree }] ; après la dernière, fini (ou boucle si « boucles » > 1)
export function lancer({ type, label, phases, seanceId, k, boucles = 1 }) {
  T = { type, label, phases, boucles, seanceId, k, phase: 0, boucle: 1, fin: Date.now() + phases[0].duree * 1000, restePause: null, total: phases[0].duree, alertes: {} };
  sauver(); demarrerTick(); ouvrirPlein(true); maj();                     // plein écran ; un appui sur le cadran le réduit en pastille
}
export function arreter() { T = null; sauver(); clearInterval(tick); tick = null; $("minuteur").className = ""; maj(); }
export function pauseReprise() {
  if (!T) return;
  if (T.restePause != null) { T.fin = Date.now() + T.restePause * 1000; T.restePause = null; }
  else T.restePause = Math.max(0, (T.fin - Date.now()) / 1000);
  sauver(); maj();
}
export function ajuster(sec) { if (!T) return; if (T.restePause != null) T.restePause = Math.max(0, T.restePause + sec); else T.fin += sec * 1000; T.total = Math.max(T.total + sec, 1); sauver(); maj(); }
export function passer() { if (!T) return; T.fin = Date.now(); T.restePause = null; maj(); }
export const ouvrirPlein = plein => { $("minuteur").classList.toggle("plein", !!plein); $("minuteur").classList.toggle("pastille", !plein); };

function reste() { return T.restePause != null ? T.restePause : Math.max(0, (T.fin - Date.now()) / 1000); }
function phaseSuivante() {
  bip("fin");
  if (T.phase + 1 < T.phases.length) T.phase++;
  else if (T.boucle < T.boucles) { T.boucle++; T.phase = 0; }
  else { const fini = T; arreter(); if (surFin) surFin(fini); return; }
  T.total = T.phases[T.phase].duree; T.fin = Date.now() + T.total * 1000; T.alertes = {}; sauver();
}
function demarrerTick() { clearInterval(tick); tick = setInterval(() => { if (!T) return; const r = reste();
  if (r <= 0 && T.restePause == null) return phaseSuivante();
  if (r <= 10.5 && !T.alertes.dix && T.total > 20) { T.alertes.dix = 1; bip("dix"); }
  if (r <= 3.5 && !T.alertes.trois) { T.alertes.trois = 1; bip("trois"); }
  maj(); }, 250); }

export function maj() {
  const m = $("minuteur"); if (!m) return;
  if (!T) { m.classList.remove("plein", "pastille", "repos"); m.innerHTML = ""; return; }
  if (!m.classList.contains("plein") && !m.classList.contains("pastille")) m.classList.add("pastille");
  const r = reste(), p = T.phases[T.phase], frac = T.total ? 1 - r / T.total : 0, circ = 2 * Math.PI * 27;
  m.classList.toggle("repos", T.type === "repos");
  const suivant = T.phase + 1 < T.phases.length ? T.phases[T.phase + 1].label : T.boucle < T.boucles ? `${T.phases[0].label} (${T.boucle + 1}/${T.boucles})` : "";
  m.innerHTML = h`
    <button class="mn-x" data-act="mnArreter" aria-label="Arrêter">✕</button>
    <div class="mn-corps" data-act="mnPlein">
      <svg viewBox="0 0 64 64" class="mn-anneau"><circle cx="32" cy="32" r="27" class="fond"/><circle cx="32" cy="32" r="27" class="arc" style="stroke-dasharray:${circ};stroke-dashoffset:${circ * (1 - frac)}"/></svg>
      <div class="mn-textes"><div class="mn-temps">${mmss(Math.ceil(r))}</div><div class="mn-label">${p.label}${T.boucles > 1 ? ` · ${T.boucle}/${T.boucles}` : ""}</div>${suivant ? h`<div class="mn-suivant">puis ${suivant}</div>` : ""}</div>
    </div>
    <div class="mn-ctrl"><button data-act="mnAjuster" data-sec="-30">−30</button><button data-act="mnPause">${T.restePause != null ? "▶" : "❚❚"}</button><button data-act="mnAjuster" data-sec="30">+30</button><button data-act="mnPasser">Passer</button></div>
    ${T.type === "repos" ? h`<button class="mn-stop" data-act="mnArreter">■ Fin du repos</button>` : ""}`.toString();
}

// --- Son : bips courts, générés (aucun fichier) ---
function bip(quoi) {
  if (!reglages.son) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const motif = quoi === "fin" ? [[880, 0, .15], [880, .2, .15], [1175, .4, .4]] : quoi === "trois" ? [[660, 0, .1]] : [[523, 0, .1], [523, .15, .1]];
    for (const [f, t, d] of motif) { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(.25, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + t + d); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + d); }
  } catch { /* pas de son */ }
}
export function debloquerSon() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === "suspended") audio.resume(); } catch { /* ignore */ } }

function sauver() { try { if (T) localStorage.setItem(CLE, JSON.stringify(T)); else localStorage.removeItem(CLE); } catch { /* ignore */ } }
export function restaurer() {
  try { const t = JSON.parse(localStorage.getItem(CLE) || "null"); if (t && (t.restePause != null || t.fin > Date.now())) { T = t; demarrerTick(); ouvrirPlein(false); maj(); } else localStorage.removeItem(CLE); } catch { /* ignore */ }
}
export const actions = {
  mnArreter: () => arreter(), mnPause: () => pauseReprise(), mnAjuster: (c, d) => ajuster(+d.sec), mnPasser: () => passer(),
  mnPlein: () => { const m = $("minuteur"); ouvrirPlein(!m.classList.contains("plein")); },
};
