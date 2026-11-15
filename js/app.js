// app.js — démarrage, état d'écran, rendu, routage des actions. Aucune règle métier ici.
import { DATA } from "../data.js";
import { ouvrirStore } from "./store.js";
import { programmeEffectif, clotureAutomatique } from "./programme.js";
import { bilanComplet as calculerBilan } from "./analyse.js";
import { construireExport } from "./export.js";
import { creerSync, lireJeton, configValide } from "./sync.js";
import { aujourdhui as dateDuJour, semaineDe } from "./dates.js";
import { $, h } from "./html.js";
import * as minuteur from "./minuteur.js";
import * as seance from "./ecrans/seance.js";
import * as programme from "./ecrans/programme.js";
import * as progres from "./ecrans/progres.js";
import * as plus from "./ecrans/plus.js";
import * as mur from "./ecrans/mur.js";
import * as fenetres from "./ecrans/fenetres.js";

export const APP_VERSION = "8.0";
const ECRANS = { seance, programme, progres, plus, salle: mur };
const ONGLET_DE = { seance: "seance", programme: "programme", progres: "progres", plus: "plus", biblio: "plus", salles: "plus", salle: "plus", historique: "plus", calendrier: "plus", reglages: "plus", aide: "plus", sauvegarde: "plus" };
const SOUS_ECRANS = ["biblio", "salles", "salle", "historique", "calendrier", "reglages", "aide", "sauvegarde"];

const state = { vue: "seance", seanceId: null, semaineVue: null, ouverts: new Set(), modal: null, scroll: {}, pile: [], salleId: null, toast: null, filtre: {}, hierIgnoree: null, dernierSecteur: "" };
let store, cache = { doc: null, programme: null, bilan: null };

const ctx = {
  data: DATA, state, APP_VERSION,
  get store() { return store; },
  get doc() { return store.doc; },
  aujourdhui: () => state.dateSimulee || dateDuJour(),
  get programme() { if (cache.doc !== store.doc) cache = { doc: store.doc, programme: programmeEffectif(DATA, store.doc), bilan: null }; return cache.programme; },
  get bilan() { ctx.programme; if (!cache.bilan) cache.bilan = calculerBilan({ data: DATA, doc: store.doc, programme: cache.programme, aujourdhui: ctx.aujourdhui() }); return cache.bilan; },
  seance: id => ctx.programme.find(s => s.id === id),
  saisie: id => store.doc.seances[id] || {},
  // Modifier la saisie d'une séance (crée l'entrée au besoin)
  modifierSeance: (id, libelle, fn, opt) => store.modifier(libelle, d => { d.seances[id] = d.seances[id] || {}; fn(d.seances[id], d); }, opt),
  modifier: (libelle, fn, opt) => store.modifier(libelle, fn, opt),
  rendre, ouvrir, ouvrirModal: m => { state.modal = m; rendre(false); }, fermerModal: () => { state.modal = null; rendre(false); },
  toast: (texte, annuler) => { state.toast = { texte, annuler, t: Date.now() }; rendreToast(); },
  minuteur,
  // Sauvegarde GitHub : silencieuse en automatique, bavarde à la demande
  async synchroniser(motif, bavard = false) {
    const cfg = store.doc.reglages.sync || {}, jeton = lireJeton();
    if (!configValide(cfg) || !jeton || (!bavard && cfg.auto === false)) { if (bavard) ctx.toast("Synchronisation non configurée"); return false; }
    const noter = (ok, erreur) => store.modifier("sync", d => { d.derniereSync = { quand: new Date().toISOString(), ok, erreur: erreur || "" }; }, { annulable: false });
    try { const s = creerSync({ config: cfg, jeton }); await s.pousser(construireExport({ data: DATA, doc: store.doc, programme: ctx.programme, bilan: ctx.bilan }), `Grimpe : ${motif} (${ctx.aujourdhui()})`); noter(true); if (bavard) ctx.toast("Sauvegardé sur GitHub ✓"); return true; }
    catch (e) { noter(false, e.message); ctx.toast(`GitHub : ${e.message}`); return false; }
  },
};

function ouvrir(vue, params = {}) {
  state.scroll[state.vue] = window.scrollY;
  if (SOUS_ECRANS.includes(vue) && vue !== state.vue) state.pile.push(state.vue); else if (!SOUS_ECRANS.includes(vue)) state.pile = [];
  Object.assign(state, params, { vue, modal: null }); state.ouverts = new Set();
  rendre(true);
}
function retour() { const pile = state.pile, v = pile.pop() || ONGLET_DE[state.vue] || "seance"; state.pile = []; ouvrir(v); state.pile = pile; }

function rendre(enHaut = false) {
  const y = window.scrollY;
  const ecran = ECRANS[state.vue] || plus;                       // les sous-écrans de Plus sont rendus par plus.js, le mur par mur.js
  const r = ecran.rendre(ctx);
  $("ecran").innerHTML = String(r.html);
  if (ecran.apresRendu) ecran.apresRendu(ctx);
  $("titre").innerHTML = String(r.titre || "");
  $("infos").textContent = r.infos || "";
  const onglet = ONGLET_DE[state.vue];
  document.querySelectorAll("#onglets button").forEach(b => b.classList.toggle("actif", b.dataset.onglet === onglet));
  const sous = SOUS_ECRANS.includes(state.vue);
  $("prec").style.visibility = sous || r.fleches ? "visible" : "hidden"; $("prec").dataset.act = sous ? "retour" : "prec";
  $("suiv").style.visibility = r.fleches ? "visible" : "hidden";
  $("btn-menu").style.visibility = r.menu ? "visible" : "hidden";
  document.body.dataset.activite = r.activite || "";
  $("fond-modal").style.display = state.modal ? "flex" : "none";
  if (state.modal) $("modal").innerHTML = String(fenetres.rendre(ctx));
  const pastille = $("pastille-plus"), joursExport = store.doc.dernierExport ? (Date.now() - new Date(store.doc.dernierExport)) / 864e5 : 99;
  pastille.style.display = joursExport > 7 ? "" : "none";
  if (enHaut) window.scrollTo(0, state.scroll[state.vue] || 0); else window.scrollTo(0, y);
  minuteur.maj();
}
function rendreToast() {
  const t = $("toast"); if (!state.toast) { t.style.display = "none"; return; }
  t.innerHTML = String(h`<span>${state.toast.texte}</span>${state.toast.annuler ? h`<button data-act="toastAnnuler">Annuler</button>` : ""}`); t.style.display = "flex";
  clearTimeout(rendreToast.timer); rendreToast.timer = setTimeout(() => { state.toast = null; rendreToast(); }, 6000);
}

// --- Actions : chaque écran exporte { rendre, actions } ; un seul écouteur pour tout ---
const ACTIONS = {
  onglet: (c, d) => { if (state.vue === d.onglet) { state.scroll[d.onglet] = 0; state.ouverts = new Set(); } ouvrir(d.onglet); },
  retour: () => retour(),
  plier: (c, d) => { state.ouverts.has(d.k) ? state.ouverts.delete(d.k) : state.ouverts.add(d.k); rendre(false); },
  toastAnnuler: () => { if (state.toast && state.toast.annuler) state.toast.annuler(); state.toast = null; rendreToast(); rendre(false); },
  annuler: () => { const l = store.annulable; if (store.annuler()) ctx.toast(`Annulé : ${l}`); rendre(false); },
  majApp: () => { if (navigator.serviceWorker && navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage("mettre-a-jour"); },
  ...minuteur.actions, ...seance.actions, ...programme.actions, ...progres.actions, ...plus.actions, ...mur.actions, ...fenetres.actions,
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-act]"); if (!b) { if (e.target.id === "fond-modal" && state.modal && !state.modal.bloquant) ctx.fermerModal(); return; }
  if (b.tagName === "INPUT" || b.tagName === "SELECT" || b.tagName === "TEXTAREA") return;
  const f = ACTIONS[b.dataset.act]; if (!f) { console.warn("action inconnue", b.dataset.act); return; }
  minuteur.debloquerSon();
  e.preventDefault(); f(ctx, b.dataset, b);
});
// Champs de saisie : « data-champ » met à jour l'état de la fenêtre (ou appelle une action « data-act » au changement)
document.addEventListener("input", e => { const el = e.target; if (el.dataset.champ && state.modal) state.modal[el.dataset.champ] = el.type === "number" ? (el.value === "" ? "" : +el.value) : el.value; });
document.addEventListener("change", e => { const el = e.target; if (el.dataset.act && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](ctx, el.dataset, el); });

// --- Fermeture / réouverture de l'app : la séance en cours mémorise la pause ---
document.addEventListener("visibilitychange", () => {
  const enCours = ctx.programme.find(s => { const sa = ctx.saisie(s.id); return sa.debut && !sa.fin; }); if (!enCours) return;
  const technique = { annulable: false };
  if (document.hidden) ctx.modifierSeance(enCours.id, "pause", sa => { sa.pause = Date.now(); }, technique);
  else { const sa = ctx.saisie(enCours.id); if (sa.pause) { const dt = Date.now() - sa.pause;
    ctx.modifierSeance(enCours.id, "reprise", x => { delete x.pause; if (dt > 15 * 60000) x.pauseTotale = (x.pauseTotale || 0) + dt; }, technique);
    if (dt > 15 * 60000) ctx.toast(`Séance interrompue ${Math.round(dt / 60000)} min : temps non compté`); } rendre(false); }
});
// Écran allumé pendant une séance
let verrou = null;
async function ecranAllume(on) { try { if (on && !verrou && navigator.wakeLock) { verrou = await navigator.wakeLock.request("screen"); verrou.addEventListener("release", () => verrou = null); } else if (!on && verrou) { await verrou.release(); verrou = null; } } catch { /* refusé */ } }

// --- Démarrage ---
(async () => {
  store = await ouvrirStore();
  if (store.doc.programmeId && store.doc.programmeId !== DATA.programmeId && Object.keys(store.doc.seances).length)
    state.modal = { type: "nouveauProgramme", bloquant: true };
  else if (!store.doc.programmeId) store.modifier("programme", d => { d.programmeId = DATA.programmeId; }, { annulable: false });
  document.documentElement.classList.toggle("grand", !!store.doc.reglages.grand);
  // Une séance restée ouverte depuis plus de 4 h est close ; son bilan sera demandé par la carte « hier »
  { const closes = clotureAutomatique(JSON.parse(JSON.stringify(store.doc)), ctx.programme); if (closes.length) store.modifier("clôture automatique", d => clotureAutomatique(d, ctx.programme), { annulable: false }); }
  store.abonner((d) => { cache.doc = null; const enCours = ctx.programme.some(s => { const sa = d.seances[s.id]; return sa && sa.debut && !sa.fin; }); ecranAllume(enCours && d.reglages.ecranAllume); });
  minuteur.configurer({ son: store.doc.reglages.son, quandFini: fini => { if (fini.type === "repos") ctx.toast("Repos terminé"); rendre(false); } });
  minuteur.restaurer();
  state.semaineVue = Math.max(1, semaineDe(store.doc.reglages.dateDebut || DATA.dateDebut, ctx.aujourdhui()));
  rendre(true);
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").then(reg => { reg.addEventListener("updatefound", () => { const w = reg.installing; w && w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) $("bandeau").style.display = "block"; }); }); });
    let avaitControleur = !!navigator.serviceWorker.controller;          // première installation : pas de rechargement
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (avaitControleur) location.reload(); avaitControleur = true; });
  }
})();
export { ctx };
