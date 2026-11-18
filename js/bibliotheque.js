// bibliotheque.js — la bibliothèque telle que l'app l'affiche : celle du programme (data.js), plus tes fiches.
//   doc.exos = [{ id, base, nom, categorie, niveau, discipline, but, comment, securite, erreurs, facile }]
//   base = le nom de la fiche d'origine qu'elle modifie ; vide = une fiche à toi.
// Les liens « Nom » des séances trouvent une fiche par son nom, ou par son nom d'origine si tu l'as renommée.
// grimpe.py rapport reporte ces fiches dans Programme.xlsx (feuille Exercices) ; une fois data.js régénéré, la fiche modifiée redevient identique à l'origine.
export const CHAMPS_EXO = ["nom", "categorie", "niveau", "discipline", "duree", "but", "comment", "securite", "erreurs", "facile"];      // duree : minutes, facultative
const champs = p => Object.fromEntries(CHAMPS_EXO.filter(k => p[k] != null).map(k => [k, p[k]]));
const identique = (e, p) => CHAMPS_EXO.every(k => String(e[k] ?? "") === String(p[k] ?? ""));
export function exercicesEffectifs(base, perso = []) {
  if (!perso || !perso.length) return base;
  // Chaque fiche perso vise une fiche du programme : par son nom d'origine, sinon par son nom (après « grimpe.py rapport » et régénération, data.js la contient déjà)
  const noms = new Set(base.map(e => e.nom)), cible = new Map();
  for (const p of perso) { const n = p.base && noms.has(p.base) ? p.base : noms.has(p.nom) ? p.nom : null; if (n) cible.set(n, p); }
  const out = base.map(e => { const p = cible.get(e.nom); return p && !identique(e, p) ? { ...e, ...champs(p), base: e.nom, perso: p.base ? "modifie" : "mien", persoId: p.id } : e; });
  for (const p of perso) if (![...cible.values()].includes(p) && !p.base) out.push({ categorie: "", niveau: "", discipline: "", but: "", comment: "", securite: "", erreurs: "", facile: "", ...champs(p), perso: "mien", persoId: p.id });
  return out;
}
// Une fiche vide (nouvel exercice) ou la copie modifiable d'une fiche existante
export const ficheDe = (e = {}) => ({ ...Object.fromEntries(CHAMPS_EXO.map(k => [k, e[k] ?? ""])), base: e.perso === "mien" ? "" : e.base || e.nom || "", id: e.persoId || "" });
