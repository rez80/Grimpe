// html.js — un gabarit HTML qui échappe tout par défaut.
//   h`<b>${texte}</b>`            texte échappé
//   h`${brut(html)}`               fragment déjà sûr, inséré tel quel
//   h`${liste}`                    un tableau de fragments est concaténé
export const esc = t => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
class Brut { constructor(s) { this.s = s; } toString() { return this.s; } }
export const brut = s => new Brut(String(s));
const rendu = v => v instanceof Brut ? v.s : Array.isArray(v) ? v.map(rendu).join("") : v === null || v === undefined || v === false ? "" : esc(v);
export const h = (parts, ...vals) => new Brut(parts.reduce((out, p, i) => out + p + (i < vals.length ? rendu(vals[i]) : ""), ""));
export const si = (cond, v) => cond ? (typeof v === "function" ? v() : v) : "";   // v peut être une fonction : évaluée seulement si cond
export const classes = (...l) => l.filter(Boolean).join(" ");
export const $ = id => document.getElementById(id);

// Choix exclusif : une rangée de boutons, « data-act » + « data-valeur »
export const choix = (act, valeurs, actuel, extra = {}) => h`<div class="choix ${extra.classe || ""}">${valeurs.map(v => {
  const [val, label] = Array.isArray(v) ? v : [v, v];
  return h`<button data-act="${act}" data-valeur="${val}" ${brut(Object.entries(extra.data || {}).map(([k, x]) => `data-${k}="${esc(x)}"`).join(" "))} class="${String(actuel) === String(val) ? "choisi" : ""}">${label}</button>`; })}</div>`;
// Échelle 0..n
export const echelle = (act, n, actuel, { de = 1, data = {} } = {}) => choix(act, Array.from({ length: n - de + 1 }, (_, i) => String(i + de)), actuel, { classe: "echelle", data });
// Liens « Exercice » → boutons vers la fiche
export const lier = (texte, exercices) => brut(esc(texte).replace(/«\s*(.+?)\s*»/g, (tout, nom) => {
  const k = exercices.findIndex(x => x.nom.toLowerCase() === nom.toLowerCase());
  return k === -1 ? tout : `<button class="exo" data-act="ficheExo" data-k="${k}">${esc(exercices[k].nom)} ⓘ</button>`; }));
