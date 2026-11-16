// app.js — démarrage, état d'écran, rendu, routage des actions. Aucune règle métier ici.
import { DATA } from "../data.js";
import { ouvrirStore } from "./store.js";
import { programmeEffectif, clotureAutomatique } from "./programme.js";
import { bilanComplet as calculerBilan } from "./analyse.js";
import { construireExport } from "./export.js";
import { creerSync, lireJeton, configValide } from "./sync.js";
import { aujourdhui as dateDuJour, semaineDe } from "./dates.js";
import { $, h, basculer, forcerOuvert } from "./html.js";
import { PALETTE } from "./salles.js";
import * as minuteur from "./minuteur.js";
import * as seance from "./ecrans/seance.js";
import * as programme from "./ecrans/programme.js";
import * as progres from "./ecrans/progres.js";
import * as plus from "./ecrans/plus.js";
import * as mur from "./ecrans/mur.js";
import * as fenetres from "./ecrans/fenetres.js";

export const APP_VERSION = "8.11";
const ECRANS = { seance, programme, progres, plus, salle: mur };
const ONGLET_DE = { seance: "seance", programme: "programme", progres: "progres", plus: "plus", biblio: "plus", salles: "plus", salle: "plus", historique: "programme", calendrier: "plus", reglages: "plus", aide: "plus", sauvegarde: "plus" };
const SOUS_ECRANS = ["biblio", "salles", "salle", "historique", "calendrier", "reglages", "aide", "sauvegarde"];

const state = { vue: "seance", seanceId: null, semaineVue: null, ouverts: new Set(), modal: null, scroll: {}, pile: [], salleId: null, toast: null, filtre: {}, dernierSecteur: "",
  origine: null,          // « programme » : la séance a été ouverte depuis le programme → la flèche ‹ y ramène
  classer: null, ranger: false, ouvertsAvantAide: null };
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
  toast: (texte, annuler, bouton) => { state.toast = { texte, annuler, bouton, t: Date.now() }; rendreToast(); },    // bouton : { label, action } (ex. « Nouvelle voie »)
  minuteur,
  agir: (act, data = {}) => { const f = ACTIONS[act]; if (f) f(ctx, data); else console.warn("action inconnue", act); },
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
  if (vue !== "salle") { state.classer = null; state.ranger = false; }                                   // modes du mur : seulement sur le mur
  if (vue === "aide") state.ouvertsAvantAide = { vue: state.vue, ouverts: state.ouverts };              // le « ? » rend l'écran tel quel au retour
  if (vue !== "seance" && vue !== "aide") state.origine = null;
  if (SOUS_ECRANS.includes(vue) && vue !== state.vue) state.pile.push(state.vue); else if (!SOUS_ECRANS.includes(vue)) state.pile = [];
  Object.assign(state, params, { vue, modal: null }); state.ouverts = new Set();
  const avant = state.ouvertsAvantAide; if (avant && avant.vue === vue && vue !== "aide") { state.ouverts = avant.ouverts; state.ouvertsAvantAide = null; }
  rendre(true);
}
// Aide à la bonne section selon l'écran affiché
const SECTION_AIDE = { seance: "seance", programme: "programme", progres: "progres", salle: "salles", salles: "salles", historique: "programme", sauvegarde: "donnees", reglages: "seance" };
function retour() { const pile = state.pile, v = pile.pop() || ONGLET_DE[state.vue] || "seance"; state.pile = []; state.parRetour = true; ouvrir(v); state.pile = pile; }

function rendre(enHaut = false) {
  const y = window.scrollY;
  // Le champ en cours de saisie garde le clavier, le curseur et la sélection si l'écran est redessiné (copier-coller, fin d'un repos…)
  const actif = document.activeElement, cleChamp = actif && actif.matches && actif.matches("input, textarea") ? ["champ", "frappe", "cle", "act"].map(k => actif.dataset[k] ? `[data-${k}="${CSS.escape(actif.dataset[k])}"]` : "").join("") : "";
  const selection = cleChamp && actif.selectionStart != null ? [actif.selectionStart, actif.selectionEnd] : null, dansModal = actif && actif.closest && !!actif.closest("#modal");
  const ecran = ECRANS[state.vue] || plus;                       // les sous-écrans de Plus sont rendus par plus.js, le mur par mur.js
  const r = ecran.rendre(ctx);
  $("ecran").innerHTML = String(r.html);
  if (ecran.apresRendu) ecran.apresRendu(ctx);
  $("titre").innerHTML = String(r.titre || "");
  $("infos").textContent = r.infos || "";
  const onglet = ONGLET_DE[state.vue];
  document.querySelectorAll("#onglets button").forEach(b => b.classList.toggle("actif", b.dataset.onglet === onglet));
  const sous = SOUS_ECRANS.includes(state.vue);
  const versProgramme = state.vue === "seance" && state.origine === "programme";
  $("prec").style.visibility = sous || r.fleches ? "visible" : "hidden"; $("prec").dataset.act = sous ? "retour" : versProgramme ? "retourProgramme" : "prec";
  $("prec").innerHTML = versProgramme ? '<span class="retour-txt">‹ Programme</span>' : "‹"; $("prec").classList.toggle("large", versProgramme);
  $("btn-aide").style.visibility = state.vue === "aide" ? "hidden" : "visible";
  document.body.classList.toggle("mode-ranger", state.vue === "salle" && !!state.ranger);
  glisserActif = !!r.glisser && !state.modal;
  $("suiv").style.visibility = r.fleches ? "visible" : "hidden";
  $("btn-menu").style.visibility = state.vue === "aide" ? "hidden" : "visible";                       // ⋯ partout : les actions de l'écran, et Annuler
  document.body.dataset.activite = r.activite || "";
  $("fond-modal").style.display = state.modal ? "flex" : "none";
  $("modal").innerHTML = state.modal ? String(fenetres.rendre(ctx)) : "";
  const pastille = $("pastille-plus"), joursExport = store.doc.dernierExport ? (Date.now() - new Date(store.doc.dernierExport)) / 864e5 : 99;
  pastille.style.display = joursExport > 7 ? "" : "none";
  // Changer de page : en haut, pour ne rien rater ; le retour ‹ ramène où l'on était
  if (enHaut) { window.scrollTo(0, state.parRetour ? state.scroll[state.vue] || 0 : 0); state.parRetour = false; } else window.scrollTo(0, y);
  if (cleChamp) { const el = document.querySelector(`${dansModal ? "#modal" : "#ecran"} ${cleChamp}`); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); if (selection) try { el.setSelectionRange(...selection); } catch { /* type sans sélection */ } } }
  minuteur.maj();
}
function rendreToast() {
  const t = $("toast"); if (!state.toast) { t.style.display = "none"; return; }
  t.innerHTML = String(h`<span>${state.toast.texte}</span>${state.toast.bouton ? h`<button data-act="toastBouton">${state.toast.bouton.label}</button>` : ""}${state.toast.annuler ? h`<button data-act="toastAnnuler">Annuler</button>` : ""}`); t.style.display = "flex"; t.classList.toggle("sur-modal", !!state.modal);   // au-dessus d'une fenêtre ouverte (ex. ✕ dans l'historique d'une voie)
  clearTimeout(rendreToast.timer); rendreToast.timer = setTimeout(() => { state.toast = null; rendreToast(); }, 8000);
}

// --- Actions : chaque écran exporte { rendre, actions } ; un seul écouteur pour tout ---
const ACTIONS = {
  onglet: (c, d) => { if (state.vue === d.onglet) { state.scroll[d.onglet] = 0; state.ouverts = new Set(); } ouvrir(d.onglet); },
  retour: () => retour(),
  retourProgramme: () => { const s = ctx.seance(state.seanceId); if (s) state.semaineVue = s.semaine; state.origine = null; state.parRetour = true; ouvrir("programme"); },
  aideContexte: () => { state.filtre.aide = SECTION_AIDE[state.vue] || "principe"; state.filtre.aideRecherche = ""; forcerOuvert(`aide-${state.filtre.aide}`); ouvrir("aide"); },
  replier: (c, d) => { basculer(d.cle, d.defaut === "1"); rendre(false); },                            // blocs repliables : l'état est retenu
  menuEcran: () => { const ecran = ECRANS[state.vue] || plus;
    if (state.vue === "seance" && ctx.seance(state.seanceId)) return seance.actions.menu(ctx);
    const r = ecran.menuEcran ? ecran.menuEcran(ctx) : null;
    ctx.ouvrirModal({ type: "menuEcran", titre: (r && r.titre) || "Actions", items: (r && r.items) || [] }); },
  plier: (c, d) => { state.ouverts.has(d.k) ? state.ouverts.delete(d.k) : state.ouverts.add(d.k); rendre(false); },
  toastBouton: () => { const b = state.toast && state.toast.bouton; state.toast = null; rendreToast(); if (b) b.action(); rendre(false); },
  toastAnnuler: () => { if (state.toast && state.toast.annuler) state.toast.annuler(); state.toast = null; rendreToast(); rendre(false); },
  annuler: () => { const l = store.annulable; if (store.annuler()) ctx.toast(`Annulé : ${l}`); rendre(false); },
  // La nouvelle version attend (« waiting ») : c'est à ELLE qu'on demande de prendre la main ; le rechargement suit (controllerchange)
  majApp: () => { if (enregistrement && enregistrement.waiting) enregistrement.waiting.postMessage("mettre-a-jour"); else location.reload(); },
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
document.addEventListener("input", e => { const el = e.target; if (el.dataset.champ && state.modal) state.modal[el.dataset.champ] = el.type === "number" ? (el.value === "" ? "" : +el.value) : el.value;
  if (el.dataset.frappe && ACTIONS[el.dataset.frappe]) ACTIONS[el.dataset.frappe](ctx, el.dataset, el); });                       // « data-frappe » : enregistré à chaque frappe, sans redessiner
document.addEventListener("change", e => { const el = e.target; if (el.dataset.act && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](ctx, el.dataset, el); });

// --- Nuancier : appui long sur une couleur de base → ses nuances, qui se comportent comme la pastille (même action, mêmes données) ---
let appui = null, ignorerClic = false;
const fermerNuancier = () => { const n = document.getElementById("nuancier"); if (n) n.remove(); };
document.addEventListener("pointerdown", e => { const p = e.target.closest(".pastille[data-base]"); if (!p) return;
  const base = PALETTE.find(b => b.nom === p.dataset.base); if (!base || base.nuances.length < 2) return;
  appui = setTimeout(() => { appui = null; ignorerClic = true; fermerNuancier(); if (navigator.vibrate) navigator.vibrate(15);
    const r = p.getBoundingClientRect(), n = document.createElement("div"); n.id = "nuancier"; n.setAttribute("role", "dialog");
    n.innerHTML = `<p class="petit">${base.nom} · nuances</p><div class="nuances">${base.nuances.map(([nom, hex]) => `<button class="pastille" style="background:${hex}" title="${nom}" aria-label="${nom}" data-nom="${nom}"></button>`).join("")}</div>`;
    n.querySelectorAll("button").forEach(b => { for (const [k, v] of Object.entries(p.dataset)) if (k !== "base" && k !== "valeur") b.dataset[k] = v; b.dataset.valeur = b.dataset.nom; });
    document.body.appendChild(n); const l = n.getBoundingClientRect();
    n.style.left = Math.max(8, Math.min(window.innerWidth - l.width - 8, r.left + r.width / 2 - l.width / 2)) + "px"; n.style.top = Math.max(8, r.top - l.height - 8) + "px"; }, 450); });
const annulerAppui = () => { if (appui) { clearTimeout(appui); appui = null; } };
document.addEventListener("pointerup", annulerAppui); document.addEventListener("pointercancel", annulerAppui); document.addEventListener("pointermove", e => { if (appui && (Math.abs(e.movementX) > 6 || Math.abs(e.movementY) > 6)) annulerAppui(); });
document.addEventListener("contextmenu", e => { if (e.target.closest(".pastille[data-base]")) e.preventDefault(); });
document.addEventListener("click", e => { if (ignorerClic) { ignorerClic = false; e.stopImmediatePropagation(); e.preventDefault(); return; }
  if (document.getElementById("nuancier") && !e.target.closest("#nuancier")) { fermerNuancier(); e.stopImmediatePropagation(); e.preventDefault(); }
  else if (e.target.closest("#nuancier [data-act]")) setTimeout(fermerNuancier, 0); }, true);

// --- Glisser d'une séance à l'autre (comme en 6.x) ; jamais pendant une séance en cours ---
let glisserActif = false, depart = null;
document.addEventListener("touchstart", e => { if (!glisserActif || e.touches.length !== 1 || e.target.closest("input, textarea, .tuiles, .choix, #minuteur, #fond-modal")) { depart = null; return; }
  depart = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
document.addEventListener("touchend", e => { if (!depart || !glisserActif) return; const t = e.changedTouches[0], dx = t.clientX - depart.x, dy = t.clientY - depart.y, rapide = Date.now() - depart.t < 600; depart = null;
  if (rapide && Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy)) ACTIONS[dx < 0 ? "suiv" : "prec"](ctx, {}); }, { passive: true });

// --- Retour dans l'app (téléphone déverrouillé, autre app quittée) ---
// Le temps passé téléphone verrouillé COMPTE dans la séance : en salle, le téléphone est dans le sac entre deux voies.
// Au retour : on recalcule tout (la date a pu changer), on ferme une séance oubliée depuis plus de 4 h, on cherche une mise à jour.
let enregistrement = null;
function auRetour() {
  cache.doc = null;
  const closes = clotureAutomatique(JSON.parse(JSON.stringify(store.doc)), ctx.programme);
  if (closes.length) store.modifier("clôture automatique", d => clotureAutomatique(d, ctx.programme), { annulable: false });
  majEcranAllume(); if (enregistrement) enregistrement.update().catch(() => {});
  if (!state.modal || !document.activeElement || document.activeElement.tagName !== "INPUT") rendre(false);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && store) auRetour(); });
// Écran allumé pendant une séance en cours (réglage) ; le système relâche le verrou quand l'app passe en arrière-plan : on le redemande au retour
let verrou = null;
async function ecranAllume(on) { try { if (on && !verrou && navigator.wakeLock && !document.hidden) { verrou = await navigator.wakeLock.request("screen"); verrou.addEventListener("release", () => verrou = null); } else if (!on && verrou) { await verrou.release(); verrou = null; } } catch { /* refusé */ } }
const seanceEnCours = d => ctx.programme.some(s => { const sa = d.seances[s.id]; return sa && sa.debut && !sa.fin; });
const majEcranAllume = () => ecranAllume(!!store.doc.reglages.ecranAllume && seanceEnCours(store.doc));

// --- Démarrage ---
(async () => {
  store = await ouvrirStore();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* demande facultative : l'iPhone n'efface alors plus le stockage de lui-même */ }
  if (store.doc.programmeId && store.doc.programmeId !== DATA.programmeId && Object.keys(store.doc.seances).length)
    state.modal = { type: "nouveauProgramme", bloquant: true };
  else if (!store.doc.programmeId) store.modifier("programme", d => { d.programmeId = DATA.programmeId; }, { annulable: false });
  document.documentElement.classList.toggle("grand", !!store.doc.reglages.grand);
  // Une séance restée ouverte depuis plus de 4 h est close ; son bilan sera demandé par la carte « hier »
  { const closes = clotureAutomatique(JSON.parse(JSON.stringify(store.doc)), ctx.programme); if (closes.length) store.modifier("clôture automatique", d => clotureAutomatique(d, ctx.programme), { annulable: false }); }
  store.abonner(() => { cache.doc = null; majEcranAllume(); });
  minuteur.configurer({ son: store.doc.reglages.son, quandFini: fini => { if (fini.type === "repos") ctx.toast("Repos terminé"); rendre(false); } });
  minuteur.restaurer();
  state.semaineVue = Math.max(1, semaineDe(store.doc.reglages.dateDebut || DATA.dateDebut, ctx.aujourdhui()));
  // Ouverture : sur la séance en cours s'il y en a une, sinon sur le programme (sa carte « Aujourd'hui » mène à la séance du jour en un appui)
  { const enCours = ctx.programme.find(s => { const sa = store.doc.seances[s.id]; return sa && sa.debut && !sa.fin; });
    if (enCours) { state.vue = "seance"; state.seanceId = enCours.id; state.origine = "programme"; } else state.vue = "programme"; }
  rendre(true); majEcranAllume();
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    const proposer = () => { if (navigator.serviceWorker.controller) $("bandeau").style.display = "block"; };
    navigator.serviceWorker.register("./sw.js").then(reg => { enregistrement = reg;
      if (reg.waiting) proposer();                                           // une version trouvée lors d'une ouverture précédente attend déjà
      reg.addEventListener("updatefound", () => { const w = reg.installing; w && w.addEventListener("statechange", () => { if (w.state === "installed") proposer(); }); }); });
    let avaitControleur = !!navigator.serviceWorker.controller;          // première installation : pas de rechargement
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (avaitControleur) location.reload(); avaitControleur = true; });
  }
})();
export { ctx };
