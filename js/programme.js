// programme.js — le programme effectif : séances fournies (data.js) + opérations faites dans l'app.
// Chaque séance a un identifiant stable (attribué par l'outil Python, ou « l-… » pour une séance créée ici) :
// déplacer, décaler ou réécrire une séance ne change jamais ce qui a été saisi dessus.
//
// Opérations (doc.ops), appliquées dans l'ordre :
//   { op: "set", id, semaine, jour, activite, phase, contenu }   réécrit une séance, ou en ajoute une (id nouveau)
//   { op: "del", id }                                            supprime une séance
//   { op: "pause", depuis, n, ids }                              décale de n semaines les séances listées dans « ids » (celles pas encore commencées
//                                                                au moment de la pause) ; sans « ids » (ancien format) : toutes celles à partir de « depuis »
//   { op: "date", id, date }                                     fixe la date réelle d'une séance (déplacement)

import { dateSeance, JOURS, ecartJours } from "./dates.js";
import { etapesDe, decouper, texteDe, titreAction } from "./parseur.js";

export function programmeEffectif(data, doc) {
  const debut = doc.reglages.dateDebut || data.dateDebut;
  const deja = new Set(data.modifsAppliquees || []);
  let P = data.seances.map(s => ({ ...s, libre: false, modifie: false }));
  for (const o of doc.ops) {
    if (deja.has(o.id)) continue;                                   // déjà intégrée à Programme.xlsx par l'outil
    if (o.op === "pause") P.forEach(s => { if (o.ids ? o.ids.includes(s.id) : s.semaine >= o.depuis) s.semaine += o.n; });
    else if (o.op === "del") P = P.filter(s => s.id !== o.cible);
    else if (o.op === "set") {
      const x = P.find(s => s.id === o.cible);
      if (x) Object.assign(x, { contenu: o.contenu, phase: o.phase ?? x.phase, semaine: o.semaine ?? x.semaine, jour: o.jour ?? x.jour, activite: o.activite ?? x.activite, modifie: true });
      else P.push({ id: o.cible, semaine: o.semaine, jour: o.jour, activite: o.activite, phase: o.phase || "Séance créée", contenu: o.contenu || "", libre: !o.copie, copie: !!o.copie, modifie: true });
    } else if (o.op === "date") { const x = P.find(s => s.id === o.cible); if (x) x.dateFixee = o.date; }
  }
  P.forEach(s => { s.datePrevue = dateSeance(debut, s.semaine, s.jour); s.date = s.dateFixee || s.datePrevue; });
  P.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : JOURS.indexOf(a.jour) - JOURS.indexOf(b.jour) || a.id.localeCompare(b.id));
  return P;
}

export const nouvelId = (prefixe = "l") => `${prefixe}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;

// --- Étapes d'une séance avec leurs clés de saisie ---
export function etapesSeance(s, saisie) {
  const { communes } = decouper(s.contenu);
  const version = saisie.version || 0;
  return etapesDe(s.contenu, version).map((e, i) => ({ ...e, i, k: i < communes.length ? `c${i}` : `v${version}-${i}` }));
}

// --- Durées prévues (secondes) ---
export const reposDefaut = (reglages, activite) => (reglages.repos || {})[activite] ?? 0;
export function dureeEtape(e, s, data, reglages) {
  if (e.type === "info") return 0;
  if (e.type === "routine") {
    const sec = data.routines.filter(r => r.routine === e.nom).reduce((t, r) => t + (r.duree || 0), 0);
    return sec || 120;
  }
  if (e.duree) return e.duree;
  const repos = e.repos ?? reposDefaut(reglages, s.activite), entre = Math.max(0, e.n - 1) * repos;
  if (e.fractions) return e.n * (e.fractions.course + e.fractions.marche);
  if (e.chrono) return e.n * e.chrono * (e.cote ? 2 : 1) + entre;
  if (e.grimpe) { const parPassage = (e.grimpe.disc === "Voie" ? data.params.temps_voie ?? 4 : data.params.temps_bloc ?? 1.5) * 60;
    return e.n * parPassage * Math.max(1, e.serie) + entre; }
  return e.n * 120 + entre;
}
export const dureeSeance = (s, etapes, data, reglages) => etapes.reduce((t, e) => t + dureeEtape(e, s, data, reglages), 0);

// --- État d'une séance ---
// avenir · aujourdhui · encours · faite · abilan (terminée, bilan pas encore donné) · sautee · passee (jamais commencée, sans reproche)
export function etatSeance(s, saisie, aujourdhui) {
  if (saisie.fin) return saisie.effort == null ? "abilan" : "faite";
  if (saisie.statut === "sautee") return "sautee";
  if (saisie.debut) return "encours";
  const ecart = ecartJours(s.date, aujourdhui);
  if (ecart < 0) return "avenir";
  if (ecart === 0) return "aujourdhui";
  return "passee";
}
// La séance à régler « d'hier » : la dernière séance passée (7 jours au plus), si elle est restée ouverte, finie sans bilan, ou jamais touchée.
// On ne remonte jamais plus loin : une séance plus ancienne reste simplement « passée », sans reproche.
export function seanceARegler(programme, doc, aujourdhui) {
  const passees = programme.filter(s => s.date < aujourdhui && ecartJours(s.date, aujourdhui) <= 7 && !s.libre), s = passees[passees.length - 1];
  return s && ["encours", "abilan", "passee"].includes(etatSeance(s, doc.seances[s.id] || {}, aujourdhui)) ? s : null;
}
// Une séance restée ouverte plus de 4 h est close automatiquement : fin = dernière activité, bilan différé
export function clotureAutomatique(doc, programme, maintenant = Date.now()) {
  const closes = [];
  for (const s of programme) { const sa = doc.seances[s.id]; if (!sa || !sa.debut || sa.fin || maintenant - sa.debut < 4 * 3600000) continue;
    const derniere = Math.max(sa.debut + 30 * 60000, ...(sa.tentatives || []).map(t => t.t || 0), ...((sa.douleur || {}).pendant || []).map(x => x.t || 0));
    sa.fin = Math.min(derniere, sa.debut + 4 * 3600000); sa.approx = true; delete sa.pause; closes.push(s.id); }
  return closes;
}
export const discipline = (s, saisie) => {           // une séance « Voie » en version « bloc » se note comme du bloc
  const v = decouper(s.contenu).versions[saisie.version || 0];
  if (s.activite === "Voie" && v && /bloc/i.test(v.nom)) return "Bloc";
  return s.activite === "Escalade extérieur" ? "Voie" : s.activite;
};

// --- Pause : seules les séances pas encore commencées (ni faites, ni sautées) sont décalées ---
export function idsAPauser(programme, doc, depuis) {
  const touchee = s => { const sa = doc.seances[s.id]; return sa && (sa.debut || sa.fin || sa.statut); };
  const l = programme.filter(s => s.semaine >= depuis);
  return { ids: l.filter(s => !touchee(s)).map(s => s.id), gardees: l.filter(touchee).length };
}

// --- Étapes d'une séance, toutes versions, avec leurs clés : [{ k, texte, titre, v }] ---
function clesDe(contenu) {
  const { communes, versions } = decouper(contenu), out = [];
  communes.forEach((e, i) => out.push({ k: `c${i}`, texte: texteDe(e), titre: e.type === "routine" ? e.nom : e.type === "action" ? titreAction(e) : e.texte || "", v: "c" }));
  versions.forEach((ver, v) => ver.lignes.forEach((e, j) => out.push({ k: `v${v}-${communes.length + j}`, texte: texteDe(e), titre: e.type === "routine" ? e.nom : e.type === "action" ? titreAction(e) : e.texte || "", v: String(v) })));
  return out;
}
// Quand le plan d'une séance change, chaque saisie suit sa ligne : même texte d'abord, sinon même titre, dans la même partie (communes / même version).
// Renvoie { ancienneClé: nouvelleClé } (null si la ligne a disparu).
export function correspondanceCles(ancien, nouveau) {
  const A = clesDe(ancien), N = clesDe(nouveau), pris = new Set(), map = {};
  for (const passe of ["texte", "titre"]) for (const a of A) { if (a.k in map) continue;
    const n = N.find(x => !pris.has(x.k) && x.v === a.v && x[passe] && x[passe] === a[passe]); if (n) { map[a.k] = n.k; pris.add(n.k); } }
  for (const a of A) if (!(a.k in map)) map[a.k] = null;
  return map;
}
export function remapperSaisie(sa, map) {
  if (!sa) return;
  const suit = k => k in map ? map[k] : k;
  for (const t of sa.tentatives || []) if (t.k) { const n = suit(t.k); if (n) t.k = n; else delete t.k; }
  if (sa.curseur) { const n = suit(sa.curseur); if (n) sa.curseur = n; else delete sa.curseur; }
  if (sa.faites) { const f = {}; for (const [k, v] of Object.entries(sa.faites)) { const n = suit(k); if (n) f[n] = v; } sa.faites = f; }
}

// --- Copies (séance, semaine) : de nouvelles séances, chacune avec son identifiant ---
export const touchee = (doc, s) => { const sa = doc.seances[s.id]; return !!(sa && (sa.debut || sa.fin || sa.statut || (sa.tentatives || []).length)); };
export function opsCopieSeance(s, semaine, jour) {
  return [{ id: nouvelId("o"), op: "set", cible: nouvelId("c"), semaine, jour, activite: s.activite, phase: s.phase, contenu: s.contenu, copie: true }];
}
// Copier la semaine « w » vers chaque semaine de « dests » ; une semaine qui contient une séance commencée n'est jamais écrasée.
export function opsCopieSemaine(programme, doc, w, dests) {
  const source = programme.filter(s => s.semaine === w), ops = [], refusees = [];
  for (const dest of dests) {
    const cible = programme.filter(s => s.semaine === dest);
    if (cible.some(s => touchee(doc, s))) { refusees.push(dest); continue; }
    cible.forEach(s => ops.push({ id: nouvelId("o"), op: "del", cible: s.id }));
    source.forEach(s => ops.push(...opsCopieSeance(s, dest, s.jour)));
  }
  return { ops, refusees };
}
