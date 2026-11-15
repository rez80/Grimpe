// salles.js — les salles, leurs secteurs, leurs voies et leur façon de coter. Fonctions pures sur le document.
//
// Façon de coter (salle.cotation[disc].mode) :
//   standard   la salle cote comme l'app (échelle française / Fontainebleau)
//   liste      la salle a ses propres valeurs (« 5+ », « bleu+ », « niveau 3 ») ; chaque valeur a un équivalent app facultatif
//   couleurs   la couleur de la voie EST le niveau ; chaque couleur a un équivalent app facultatif
//   aucune     pas de cotation : la tentative compte dans les totaux, pas dans les niveaux
// Une tentative garde toujours `cot` (échelle de l'app, "" si inconnue) et `cotSalle` (ce que la salle affiche).

import { nouvelId } from "./programme.js";

export const COULEURS = [["Rouge", "#D93636"], ["Rose", "#F48FB1"], ["Orange", "#F28C28"], ["Jaune", "#F2D34B"], ["Vert clair", "#9CCC65"], ["Vert", "#3FA066"], ["Vert foncé", "#1B5E20"], ["Turquoise", "#26A69A"], ["Bleu clair", "#4FC3F7"], ["Bleu", "#2E6FB7"], ["Bleu foncé", "#0D2B6B"], ["Violet", "#7B5EA7"], ["Mauve", "#C3A6E0"], ["Marron", "#8B5A2B"], ["Beige", "#E8D5B5"], ["Gris", "#9AA5AD"], ["Noir", "#222222"], ["Blanc", "#F5F5F5"]];
export const couleursDe = salle => [...COULEURS.map(([nom, hex]) => ({ nom, hex })), ...((salle && salle.couleurs) || [])];
export const hexDe = (doc, nom, salle) => (couleursDe(salle).find(c => c.nom === nom) || doc.salles.flatMap(s => s.couleurs || []).find(c => c.nom === nom) || {}).hex || "transparent";
export const texteSur = hex => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ""); if (!m) return "#fff"; const [r, g, b] = [1, 2, 3].map(i => parseInt(m[i], 16)); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1d2a2f" : "#fff"; };

export const salleDe = (doc, id) => doc.salles.find(s => s.id === id) || null;
export const sallesPour = (doc, disc) => doc.salles.filter(s => s.type === "Bloc et voie" || s.type === disc);
export const cotationDe = (salle, disc) => (salle && salle.cotation && salle.cotation[disc]) || { mode: "standard", liste: [] };
export const secteurDe = (salle, v) => (salle && salle.secteurs.find(x => x.id === v.secteurId)) || null;

// Équivalent dans l'échelle de l'app d'une valeur affichée par la salle
export function cotApp(salle, disc, cotSalle, couleur) {
  const c = cotationDe(salle, disc);
  if (c.mode === "standard") return cotSalle || "";
  if (c.mode === "liste") return (c.liste.find(x => x.salle === cotSalle) || {}).app || "";
  if (c.mode === "couleurs") return (c.liste.find(x => x.salle === couleur) || {}).app || "";
  return "";
}
export const libelleVoie = v => [v.cotSalle || v.cot || "?", v.couleur ? v.couleur.toLowerCase() : "", v.nom].filter(Boolean).join(" ");

export const voiesEnPlace = (salle, disc) => salle ? salle.voies.filter(v => v.statut !== "demontee" && (!disc || v.disc === disc)).sort((a, b) => (a.secteurId || "") < (b.secteurId || "") ? -1 : (a.secteurId || "") > (b.secteurId || "") ? 1 : (a.ordre ?? 0) - (b.ordre ?? 0)) : [];

export function nouvelleVoie(salle, { disc, couleur = "", cotSalle = "", nom = "", profil = "", secteurId = null }, aujourdhui) {
  const sec = salle.secteurs.find(x => x.id === secteurId);
  return { id: nouvelId("v"), disc, couleur, cotSalle: cotationDe(salle, disc).mode === "couleurs" ? "" : cotSalle, cot: cotApp(salle, disc, cotSalle, couleur), nom, profil: profil || (sec && sec.profil) || "Vertical",
           secteurId: secteurId || null, ordre: Math.max(-1, ...salle.voies.filter(v => (v.secteurId || null) === (secteurId || null)).map(v => v.ordre ?? 0)) + 1, statut: "enPlace", ouverte: aujourdhui, demontee: null };
}
// Une voie déjà connue ? (même discipline, couleur, cotation salle, nom) — évite les doublons à la création
export const voieExistante = (salle, v) => salle.voies.find(x => x.statut !== "demontee" && x.disc === v.disc && x.couleur === v.couleur && (x.cotSalle || "") === (v.cotSalle || "") && (x.nom || "") === (v.nom || ""));

// Ranger : déplace la voie `id` dans le secteur `secteurId`, à la position `avantId` (null = à la fin)
export function ranger(salle, id, secteurId, avantId) {
  const v = salle.voies.find(x => x.id === id); if (!v) return;
  const groupe = salle.voies.filter(x => x.id !== id && (x.secteurId || null) === (secteurId || null) && x.statut !== "demontee").sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const pos = avantId ? groupe.findIndex(x => x.id === avantId) : -1;
  if (pos === -1) groupe.push(v); else groupe.splice(pos, 0, v);
  const sec = salle.secteurs.find(x => x.id === secteurId); if (sec && sec.profil) v.profil = sec.profil;      // le secteur donne son profil habituel
  v.secteurId = secteurId || null; groupe.forEach((x, i) => x.ordre = i);
}
// Renouveler un secteur : toutes ses voies passent démontées (l'historique reste)
export function renouveler(salle, secteurId, aujourdhui) { let n = 0; for (const v of salle.voies) if ((v.secteurId || null) === (secteurId || null) && v.statut !== "demontee") { v.statut = "demontee"; v.demontee = aujourdhui; n++; } return n; }

// Une tentative construite à partir d'une voie de la salle
export const tentativeDe = (v, salle, extra = {}) => ({ t: Date.now(), disc: v.disc, cot: v.cot || "", cotSalle: v.cotSalle || "", profil: v.profil || "", couleur: v.couleur || "", nom: v.nom || "", salle: salle.id, voieId: v.id, ...extra });
