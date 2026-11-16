// salles.js — les salles, leurs secteurs, leurs voies et leur façon de coter. Fonctions pures sur le document.
//
// Façon de coter (salle.cotation[disc].mode) :
//   standard   la salle cote comme l'app (échelle française / Fontainebleau)
//   liste      la salle a ses propres valeurs (« 5+ », « bleu+ », « niveau 3 ») ; chaque valeur a un équivalent app facultatif
//   couleurs   la couleur de la voie EST le niveau ; chaque couleur a un équivalent app facultatif
//   aucune     pas de cotation : la tentative compte dans les totaux, pas dans les niveaux
// Une tentative garde toujours `cot` (échelle de l'app, "" si inconnue) et `cotSalle` (ce que la salle affiche).

import { nouvelId } from "./programme.js";

// Palette : 12 couleurs de base, chacune avec ses nuances (appui long sur une pastille). Les noms des versions précédentes sont tous conservés.
export const PALETTE = [
  { nom: "Rouge", hex: "#D93636", nuances: [["Rouge", "#D93636"], ["Corail", "#F26B5B"], ["Framboise", "#C2185B"], ["Bordeaux", "#7B1E2B"]] },
  { nom: "Rose", hex: "#F48FB1", nuances: [["Rose", "#F48FB1"], ["Rose pâle", "#F8C8D8"], ["Fuchsia", "#E040A0"]] },
  { nom: "Orange", hex: "#F28C28", nuances: [["Orange", "#F28C28"], ["Abricot", "#F9B872"], ["Saumon", "#F4A08A"], ["Orange foncé", "#D2601A"]] },
  { nom: "Jaune", hex: "#F2D34B", nuances: [["Jaune", "#F2D34B"], ["Jaune pâle", "#F7E98E"], ["Jaune fluo", "#E6F23B"], ["Moutarde", "#C9A227"]] },
  { nom: "Vert", hex: "#3FA066", nuances: [["Vert", "#3FA066"], ["Vert clair", "#9CCC65"], ["Vert pomme", "#7CD63A"], ["Vert foncé", "#1B5E20"], ["Kaki", "#7A7A3A"]] },
  { nom: "Turquoise", hex: "#26A69A", nuances: [["Turquoise", "#26A69A"], ["Menthe", "#8FD9C4"], ["Pétrole", "#0E5A63"]] },
  { nom: "Bleu", hex: "#2E6FB7", nuances: [["Bleu", "#2E6FB7"], ["Bleu clair", "#4FC3F7"], ["Bleu ciel", "#A9D8F5"], ["Bleu roi", "#1F3FBF"], ["Bleu foncé", "#0D2B6B"]] },
  { nom: "Violet", hex: "#7B5EA7", nuances: [["Violet", "#7B5EA7"], ["Mauve", "#C3A6E0"], ["Lilas", "#B79CD9"], ["Prune", "#5B2A5E"]] },
  { nom: "Marron", hex: "#8B5A2B", nuances: [["Marron", "#8B5A2B"], ["Caramel", "#B8783A"], ["Chocolat", "#4E2E1A"], ["Beige", "#E8D5B5"]] },
  { nom: "Gris", hex: "#9AA5AD", nuances: [["Gris", "#9AA5AD"], ["Gris clair", "#CFD6DA"], ["Anthracite", "#4A5257"]] },
  { nom: "Noir", hex: "#222222", nuances: [["Noir", "#222222"]] },
  { nom: "Blanc", hex: "#F5F5F5", nuances: [["Blanc", "#F5F5F5"], ["Crème", "#F3EAD3"]] },
];
export const COULEURS = PALETTE.flatMap(b => b.nuances);                       // toutes les teintes, à plat : [nom, hex]
export const baseDe = nom => PALETTE.find(b => b.nuances.some(n => n[0] === nom)) || null;
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

// Caractéristiques d'une voie (plusieurs possibles), par famille ; l'inclinaison reste le « profil »
export const CARACTERISTIQUES = [{ groupe: "Mur et forme", options: ["Arête", "Traversée", "Dièdre", "Fissure", "Volumes"] }, { groupe: "Prises", options: ["Réglettes", "Bacs", "Pinces", "Plats"] }, { groupe: "Mouvement", options: ["Dynamique", "Compression"] }];
export function nouvelleVoie(salle, { disc, couleur = "", cotSalle = "", nom = "", profil = "", secteurId = null, carac = [] }, aujourdhui) {
  return { id: nouvelId("v"), disc, couleur, ...(carac && carac.length ? { carac: [...carac] } : {}), cotSalle: cotationDe(salle, disc).mode === "couleurs" ? "" : cotSalle, cot: cotApp(salle, disc, cotSalle, couleur), nom, profil: profil || profilHabituel(salle, secteurId),
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

// Profil proposé pour une nouvelle voie d'un secteur : celui fixé sur le secteur, sinon le plus fréquent parmi ses voies, sinon Vertical
export function profilHabituel(salle, secteurId) {
  const sec = salle && salle.secteurs.find(x => x.id === secteurId); if (sec && sec.profil) return sec.profil;
  const n = {}; (salle ? salle.voies : []).filter(v => (v.secteurId || null) === (secteurId || null) && v.profil).forEach(v => n[v.profil] = (n[v.profil] || 0) + 1);
  return Object.entries(n).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || "Vertical";
}

// =====================================================================
// Modifier et supprimer (fonctions pures sur le document ; l'annulation est assurée par le store)
// =====================================================================
const tousLesPassages = doc => Object.values(doc.seances).flatMap(sa => sa.tentatives || []);
// Nombre de passages notés sur ces voies
export const passagesDe = (doc, ids) => { const s = new Set(ids); return tousLesPassages(doc).filter(t => t.voieId && s.has(t.voieId)).length; };

// Supprime des voies. passages : "garder" (détachés de la voie, avec leur couleur et leur cotation) ou "supprimer"
export function supprimerVoies(doc, salle, ids, passages = "garder") {
  const s = new Set(ids); let n = 0;
  for (const sa of Object.values(doc.seances)) {
    if (!sa.tentatives) continue;
    if (passages === "supprimer") { const avant = sa.tentatives.length; sa.tentatives = sa.tentatives.filter(t => !(t.voieId && s.has(t.voieId))); n += avant - sa.tentatives.length; }
    else sa.tentatives.forEach(t => { if (t.voieId && s.has(t.voieId)) { delete t.voieId; n++; } });
  }
  const avant = salle.voies.length; salle.voies = salle.voies.filter(v => !s.has(v.id));
  return { voies: avant - salle.voies.length, passages: n };
}
// Une voie identique, juste après l'originale
export function dupliquerVoie(salle, id, aujourdhui) {
  const v = salle.voies.find(x => x.id === id); if (!v) return null;
  const copie = { ...v, id: nouvelId("v"), ouverte: aujourdhui, statut: "enPlace", demontee: null }; delete copie.etoile;
  salle.voies.filter(x => (x.secteurId || null) === (v.secteurId || null) && (x.ordre ?? 0) > (v.ordre ?? 0)).forEach(x => x.ordre = (x.ordre ?? 0) + 1);
  copie.ordre = (v.ordre ?? 0) + 1; salle.voies.push(copie); return copie;
}
// Déplace une voie dans une autre salle (erreur de salle) : ses passages la suivent ; sa cotation app est recalculée avec la façon de coter de la nouvelle salle
export function deplacerVoieSalle(doc, deId, versId, voieId) {
  const de = doc.salles.find(x => x.id === deId), vers = doc.salles.find(x => x.id === versId); if (!de || !vers || de === vers) return false;
  const i = de.voies.findIndex(x => x.id === voieId); if (i < 0) return false;
  const [v] = de.voies.splice(i, 1); v.secteurId = null; v.cot = cotApp(vers, v.disc, v.cotSalle, v.couleur);
  v.ordre = Math.max(-1, ...vers.voies.filter(x => !x.secteurId).map(x => x.ordre ?? 0)) + 1; vers.voies.push(v);
  tousLesPassages(doc).forEach(t => { if (t.voieId === voieId) { t.salle = versId; t.cot = v.cot; } });
  return true;
}
// Secteurs : déplacer dans la liste, supprimer (voies : "garder" → sans secteur, "supprimer" → avec leurs passages gardés ou non)
export function deplacerSecteur(salle, id, pas) { const i = salle.secteurs.findIndex(x => x.id === id), j = i + pas; if (i < 0 || j < 0 || j >= salle.secteurs.length) return; [salle.secteurs[i], salle.secteurs[j]] = [salle.secteurs[j], salle.secteurs[i]]; }
export function supprimerSecteur(doc, salle, id, voies = "garder", passages = "garder") {
  const ids = salle.voies.filter(v => v.secteurId === id).map(v => v.id); let res = { voies: 0, passages: 0 };
  if (voies === "supprimer") res = supprimerVoies(doc, salle, ids, passages);
  else { let o = Math.max(-1, ...salle.voies.filter(v => !v.secteurId).map(v => v.ordre ?? 0)); salle.voies.forEach(v => { if (v.secteurId === id) { v.secteurId = null; v.ordre = ++o; } }); }
  salle.secteurs = salle.secteurs.filter(x => x.id !== id); return res;
}
// Supprimer une salle : ses voies partent avec elle ; ses passages sont gardés (détachés) ou supprimés
export function supprimerSalle(doc, id, passages = "garder") {
  const salle = doc.salles.find(x => x.id === id); if (!salle) return { voies: 0, passages: 0 };
  const res = supprimerVoies(doc, salle, salle.voies.map(v => v.id), passages);
  if (passages === "supprimer") for (const sa of Object.values(doc.seances)) { if (sa.tentatives) { const a = sa.tentatives.length; sa.tentatives = sa.tentatives.filter(t => t.salle !== id); res.passages += a - sa.tentatives.length; } if (sa.salle === id) delete sa.salle; }
  else for (const sa of Object.values(doc.seances)) if (sa.salle === id) delete sa.salle;
  for (const k of Object.keys(doc.reglages.salleParDefaut || {})) if (doc.reglages.salleParDefaut[k] === id) doc.reglages.salleParDefaut[k] = "";
  doc.salles = doc.salles.filter(x => x.id !== id); return { ...res, voies: res.voies };
}
// Couleurs propres à une salle : renommer (les voies et passages suivent), supprimer si aucune voie ne l'utilise
export const voiesDeCouleur = (salle, nom) => salle.voies.filter(v => v.couleur === nom).length;
export function renommerCouleur(doc, salle, ancien, nom, hex) {
  const c = (salle.couleurs || []).find(x => x.nom === ancien); if (!c) return;
  c.nom = nom || ancien; if (hex) c.hex = hex;
  if (nom && nom !== ancien) { salle.voies.forEach(v => { if (v.couleur === ancien) v.couleur = nom; }); tousLesPassages(doc).forEach(t => { if (t.salle === salle.id && t.couleur === ancien) t.couleur = nom; });
    Object.values(salle.cotation || {}).forEach(cot => (cot.liste || []).forEach(x => { if (x.salle === ancien) x.salle = nom; })); }
}
export function supprimerCouleur(salle, nom) { if (voiesDeCouleur(salle, nom)) return false; salle.couleurs = (salle.couleurs || []).filter(x => x.nom !== nom); return true; }
