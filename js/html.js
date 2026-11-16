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

// Icônes dessinées (SVG) : sur iPhone, ▶ ⏱ ⚠ s'affichent en émojis colorés ; ces icônes prennent la couleur du texte
const ICONES = {
  play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
  pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/>',
  repos: '<circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 9v4.5l2.8 1.8M9.5 3h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  alerte: '<path d="M12 3.5 22 20.5H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.3" fill="currentColor"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/>',
  seance: '<path d="M4 20 10.5 7l3.5 6 2-3L21 20z" fill="currentColor"/><circle cx="17" cy="5" r="2" fill="currentColor"/>',
  programme: '<rect x="3.5" y="4.5" width="17" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 9.5h17M8 3v3M16 3v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M7 13h3v3H7z" fill="currentColor"/>',
  progres: '<path d="M3.5 19.5h17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 16l4.5-5 3.5 3 6-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 7h4v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  plus: '<circle cx="5.5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="18.5" cy="12" r="2" fill="currentColor"/>',
  aide: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1.9-1.1 1.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/>',
};
export const ico = nom => brut(`<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nom] || ""}</svg>`);
// Inclinaison d'un profil (pour les tuiles et les choix)
const PROFIL_TRAIT = { "Dalle": "M8 18 L13 2", "Vertical": "M11 18 L11 2", "Léger dévers": "M13 18 L9 2", "Dévers": "M15 18 L6 2", "Surplomb": "M15 18 Q15 6 4 3", "Fort dévers": "M16 18 L3 5", "Toit": "M16 18 L16 8 L2 8" };
export const pictoProfil = (p, classe = "picto") => PROFIL_TRAIT[p] ? brut(`<svg viewBox="0 0 18 20" class="${classe}" aria-label="${esc(p)}"><path d="M1 19 H17" class="sol"/><path d="${PROFIL_TRAIT[p]}"/></svg>`) : "";

// =====================================================================
// Repliables mémorisés : une seule façon de replier/déplier, partout ; l'état est gardé d'une ouverture à l'autre
// =====================================================================
const CLE_REPLIS = "grimpe-replis";
let replis = null;
const lireReplis = () => { if (!replis) { try { replis = JSON.parse(localStorage.getItem(CLE_REPLIS) || "{}"); } catch { replis = {}; } } return replis; };
export const ouvert = (cle, defaut = false) => { const r = lireReplis(); return cle in r ? r[cle] : defaut; };
export function basculer(cle, defaut = false) { const r = lireReplis(); r[cle] = !ouvert(cle, defaut); try { localStorage.setItem(CLE_REPLIS, JSON.stringify(r)); } catch { /* ignore */ } }
export function forcerOuvert(cle) { const r = lireReplis(); r[cle] = true; try { localStorage.setItem(CLE_REPLIS, JSON.stringify(r)); } catch { /* ignore */ } }
// pli(clé, ouvert par défaut ?, titre, contenu (fonction), { resume, classe, toujours })  — « toujours » : ouvert de force (mode Ranger, recherche…)
export function pli(cle, defaut, titre, contenu, { resume = "", classe = "", toujours = false } = {}) {
  const o = toujours || ouvert(cle, defaut);
  return h`<section class="pli-bloc ${classe} ${o ? "ouvert" : ""}"><button class="pli-tete" data-act="replier" data-cle="${cle}" data-defaut="${defaut ? "1" : ""}" aria-expanded="${o ? "true" : "false"}"><span class="pli-fleche">${o ? "▾" : "▸"}</span><span class="pli-titre">${titre}</span>${resume ? h`<span class="pli-resume">${resume}</span>` : ""}</button>${o ? h`<div class="pli-corps">${contenu()}</div>` : ""}</section>`;
}

// =====================================================================
// Ligne de choix (dans une fenêtre) : « Libellé : valeur › » ; un toucher ouvre les options, choisir referme
//   M.section porte la ligne ouverte ; les actions de choix (mChamp, mProfil, mSecteur, mCot…) referment
// =====================================================================
export const ligneChoix = (M, cle, label, valeur, contenu) => h`<button class="fiche-ligne" data-act="mSection" data-k="${cle}"><span>${label}</span><span class="val">${valeur || "—"} ${M.section === cle ? "▾" : "›"}</span></button>${M.section === cle ? h`<div class="fiche-contenu">${contenu()}</div>` : ""}`;

// Listes déroulantes : au-delà de 4 options (règle de l'app), un <select> — le sélecteur natif de l'iPhone.
// options : [valeur, libellé] ou valeur, ou { groupe, options } pour des sous-titres. data-champ met à jour la fenêtre ; data-act (au changement) redessine ou agit.
const optionsDe = (options, est) => options.map(o => o && o.groupe ? h`<optgroup label="${o.groupe}">${optionsDe(o.options, est)}</optgroup>`
  : (([v, l]) => h`<option value="${v}" ${est(v) ? "selected" : ""}>${l}</option>`)(Array.isArray(o) ? o : [o, o]));
export const liste = (champ, options, valeur, { act = "mListe", vide = "—", label = "", data = {} } = {}) =>
  h`${label ? h`<label class="champ">${label}</label>` : ""}<select class="liste" data-act="${act}" data-champ="${champ}" ${brut(Object.entries(data).map(([k, x]) => `data-${k}="${esc(x)}"`).join(" "))}>${vide !== null ? h`<option value="">${vide}</option>` : ""}${optionsDe(options, v => String(v) === String(valeur ?? ""))}</select>`;
// Choix multiples (caractéristiques) : <select multiple>, la sélection est lue au changement (action « mListeMulti »)
export const listeMulti = (champ, options, valeurs = [], { label = "" } = {}) =>
  h`${label ? h`<label class="champ">${label}</label>` : ""}<select class="liste" multiple data-act="mListeMulti" data-champ-multi="${champ}">${optionsDe(options, v => (valeurs || []).includes(v))}</select>`;

// ⓘ : un lien discret qui ouvre l'explication (textes dans infos.js, fenêtre « info »)
export const info = (cle, texte = "Comment ça marche") => h`<button class="lien lien-info" data-act="infoOuvrir" data-k="${cle}">ⓘ ${texte}</button>`;
