// plan.js — le générateur de blocs d'entraînement (chargé seulement avec l'assistant « Construire un bloc »).
//
// Un « plan » = les réponses de l'assistant. genererBloc(plan, echelles) en fait un bloc prêt à enregistrer (doc.blocs) :
// des séances écrites dans la grammaire habituelle (voir parseur.js) et des feux verts mesurables.
// Toutes les alertes (alertes*) sont des conseils : elles ne bloquent jamais rien, c'est le grimpeur qui décide.

import { JOURS } from "./dates.js";

// --- Les phases ---
export const PHASES = {
  base: { label: "Base", pourquoi: "On installe la routine et la technique, sans forcer." },
  construction: { label: "Construction", pourquoi: "La charge monte d'un cran par semaine (essais, volume)." },
  respiration: { label: "Respiration", pourquoi: "Une semaine plus légère au milieu : le corps assimile, les doigts récupèrent." },
  realisation: { label: "Réalisation", pourquoi: "On cherche à réussir, avec des repos complets. Moins de volume, plus de qualité." },
  decharge: { label: "Décharge", pourquoi: "Semaine facile à la fin : on finit en forme, prêt pour le bloc suivant." },
};
export const ORDRE_PHASES = ["base", "construction", "respiration", "realisation", "decharge"];

// --- Les rôles d'un jour ---
export const ROLES = {
  repos: { label: "Repos", activite: null },
  dure: { label: "Séance dure", activite: null, salle: true, dure: true },             // la discipline de l'objectif
  volume: { label: "Volume / plaisir (bloc)", activite: "Bloc", salle: true },
  voie: { label: "Voie (partenaire)", activite: "Voie", salle: true },
  course: { label: "Course (bonus)", activite: "Course", bonus: true },
  prevention: { label: "Prévention maison (bonus)", activite: "Maison", bonus: true },
};

// --- Profils : ils ne changent que les valeurs proposées (tout reste modifiable) ---
export const PROFILS = {
  debutant: { label: "Débutant", pourquoi: "Technique et volume d'abord. Une seule séance dure par semaine, pas de poutre.", facteur: 1, suspensions: false },
  intermediaire: { label: "Intermédiaire", pourquoi: "Plus d'essais, et des suspensions courtes sur grosse prise en Construction. Deux séances dures possibles, à 48 h d'écart.", facteur: 1.3, suspensions: true },
  avance: { label: "Avancé", pourquoi: "Volume d'essais plus élevé, progression plus lente. Les suspensions restent courtes et contrôlées.", facteur: 1.5, suspensions: true },
};

// Le découpage habituel sur 8 semaines, et les valeurs de départ (profil Débutant)
const TYPES_8 = ["base", "base", "construction", "construction", "respiration", "construction", "realisation", "decharge"];
const CHARGES_8 = [60, 70, 80, 90, 65, 100, 75, 50];
const ESSAIS_8 = [4, 6, 12, 14, 6, 15, 10, 0];
const VOLUME_8 = [15, 15, 18, 18, 12, 20, 15, 10];
const DEVERS_8 = [3, 3, 3, 4, 0, 4, 3, 0];
const VOIES_8 = [2, 2, 3, 3, 0, 3, 2, 0];
const COURSE_8 = [25, 30, 30, 35, 25, 35, 30, 20];

// Le découpage proposé selon la durée du bloc (4 à 12 semaines) ; 8 = le découpage habituel
export const DUREES = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const DECOUPAGES = { 4: "b c R d", 5: "b c c R d", 6: "b b c c R d", 7: "b c c r c R d", 8: "b b c c r c R d", 9: "b b c c r c c R d", 10: "b b c c c r c c R d", 11: "b b c c r c c r c R d", 12: "b b c c r c c c r c R d" };
const LETTRES = { b: "base", c: "construction", r: "respiration", R: "realisation", d: "decharge" };
export function semainesParDefaut(profil = "debutant", n = 8) {
  const f = (PROFILS[profil] || PROFILS.debutant).facteur, ajuste = (x, i) => ({ ...x, essais: Math.round(x.essais * f), volume: Math.round(x.volume * Math.min(f, 1.2)) });
  if (n === 8) return TYPES_8.map((type, i) => ajuste({ type, charge: CHARGES_8[i], essais: ESSAIS_8[i], volume: VOLUME_8[i], devers: DEVERS_8[i], voies: VOIES_8[i], course: COURSE_8[i] }));
  const types = (DECOUPAGES[n] || DECOUPAGES[8]).split(" ").map(l => LETTRES[l]); let max = 0, nb = 0, nc = 0, apresR = false;
  return types.map(type => { let x;
    if (type === "base") { x = { charge: nb ? 70 : 60, essais: nb ? 6 : 4, volume: 15, devers: 3, voies: 2, course: nb ? 30 : 25 }; nb++; }
    else if (type === "construction") { x = { charge: Math.min(100, Math.max(max, 60) + 10), essais: Math.min(16, 12 + 2 * nc), volume: apresR ? 20 : 18, devers: nc ? 4 : 3, voies: 3, course: nc ? 35 : 30 }; nc++; }
    else if (type === "respiration") { x = { charge: 65, essais: 6, volume: 12, devers: 0, voies: 0, course: 25 }; apresR = true; }
    else if (type === "realisation") x = { charge: 75, essais: 10, volume: 15, devers: 3, voies: 2, course: 30 };
    else x = { charge: 50, essais: 0, volume: 10, devers: 0, voies: 0, course: 20 };
    if (type !== "respiration" && type !== "decharge" && type !== "realisation") max = Math.max(max, x.charge);
    return ajuste({ type, ...x }); });
}

// --- Cotations : calcul sur l'échelle de l'app ---
// Un « cran » = une cotation sans « + » (bloc 4 → 5, voie 5a → 5b) ; l'objectif peut être n'importe quelle cotation (5+, 6A+…)
export const crans = (echelles, disc) => (echelles[disc] || []).filter(c => !/\+$/.test(c));
export function monter(echelles, disc, cot, n = 1) { const l = crans(echelles, disc), i = l.indexOf(String(cot).replace(/\+$/, "")); return i < 0 ? cot : l[Math.max(0, Math.min(l.length - 1, i + n))]; }
export const ecartCrans = (echelles, disc, a, b) => { const l = crans(echelles, disc); return l.indexOf(String(b).replace(/\+$/, "")) - l.indexOf(String(a).replace(/\+$/, "")); };
const rangDe = (E, d, c) => (E[d] || []).indexOf(String(c)), aRang = (E, d, i) => (E[d] || [])[Math.max(0, Math.min((E[d] || []).length - 1, i))];
// Écart en demi-crans (4 → 4+ = 1, 4 → 5 = 2)
export const ecartPas = (E, d, a, b) => rangDe(E, d, b) - rangDe(E, d, a);
// La cotation entre deux (pour la pyramide) : bloc 4 → 5 donne 4+, voie 5a → 5b donne 5a+
export function entre(echelles, disc, a, b) { const l = echelles[disc] || [], i = l.indexOf(String(a)), j = l.indexOf(String(b)); return i < 0 || j < 0 || j - i < 2 ? a : l[Math.floor((i + j) / 2)]; }
// Pyramide de la séance dure : deux paliers sous l'objectif (4 → 5 : 4 puis 4+ ; 5 → 5+ : 4+ puis 5)
export function pyramide(E, d, L, O) { const i = rangDe(E, d, L), j = rangDe(E, d, O); if (i < 0 || j < 0) return [L, L]; return j - i >= 2 ? [L, aRang(E, d, Math.floor((i + j) / 2))] : [aRang(E, d, i - 1), L]; }
// Volume : toujours sous l'objectif (bloc 4 / objectif 5 : 4 et 4+ ; bloc 5 / objectif 5+ : 4+ et 5)
export function niveauxVolume(E, d, L, O) { const i = rangDe(E, d, L), j = O ? rangDe(E, d, O) : -1; if (i < 0) return [L, L];
  const haut = j >= 0 ? Math.max(Math.min(i + 1, j - 1), 0) : i + 1; return [aRang(E, d, haut - 1), aRang(E, d, haut)]; }

// --- Objectifs secondaires (2 au plus) : chacun ajoute du contenu dans les séances et son feu vert ---
//   plan.secondaires = [{ type, niveau }] ; niveau : une cotation (bloc ou voie), ou des secondes (gainage)
export const SECONDAIRES = {
  devers: { label: "Dévers", disc: "Bloc", ou: "au volume (dimanche)", titre: n => `Dévers en ${n}`, feu: n => [{ type: "differents", disc: "Bloc", cot: n, profil: "devers", min: 5 }] },
  dalle: { label: "Dalle / adhérence", disc: "Bloc", ou: "au volume (dimanche)", titre: n => `Dalle en ${n}`, feu: n => [{ type: "differents", disc: "Bloc", cot: n, profil: "dalle", min: 5 }] },
  endurance: { label: "Endurance en voie", disc: "Voie", ou: "à la séance voie", titre: n => `Endurance en ${n}`, feu: n => [{ type: "memeJour", disc: "Voie", cot: n, min: 4 }] },
  avue: { label: "À vue", disc: "Voie", ou: "à la séance voie", titre: n => `À vue en ${n}`, feu: n => [{ type: "avue", disc: "Voie", cot: n, min: 3 }] },
  voie: { label: "Niveau en voie", disc: "Voie", ou: "à la séance voie", titre: n => `Voie ${n} consolidée`, feu: n => [{ type: "essais", disc: "Voie", cot: n, min: 8 }, { type: "taux", disc: "Voie", cot: n, min: 70 }, { type: "differents", disc: "Voie", cot: n, min: 3 }] },
  gainage: { label: "Gainage", disc: null, ou: "à la prévention (jeudi)", titre: n => `Planche ${n} s`, feu: n => [{ type: "mesure", cle: "planche", min: +n || 90 }] },
};
export function niveauSecondaire(plan, type, E) {
  const d = plan.depart || {};
  if (type === "devers" || type === "dalle") return d.Bloc || "4";
  if (type === "voie") return monter(E, "Voie", d.Voie || "5a");
  if (type === "gainage") return 90;
  return d.Voie || "5a";
}
const sec = (plan, type) => (plan.secondaires || []).find(x => x.type === type) || null;

// --- Fils rouges : une appréhension ou un savoir-faire, travaillé un peu à chaque séance concernée ---
export const FILS = {
  "": { label: "Aucun" },
  hauteur: { label: "Hauteur (appréhension en haut)", pourquoi: "En voie : désescalade, s'asseoir dans le baudrier, puis petits lâchers en moulinette.",
    feu: { titre: "Hauteur en voie", criteres: [{ type: "coche", label: "3 lâchers en moulinette sans appréhension" }] } },
  chute: { label: "Chute en bloc (réceptions)", pourquoi: "Au volume : désescalade quand c'est possible, sinon sauts contrôlés de plus en plus hauts.",
    feu: { titre: "Réceptions en bloc", criteres: [{ type: "coche", label: "Réceptions sereines depuis le haut d'un bloc" }] } },
  dynamique: { label: "Mouvements dynamiques", pourquoi: "À la séance dure : point mort puis déplacements dynamiques contrôlés.",
    feu: { titre: "Dynamique", criteres: [{ type: "coche", label: "3 blocs réussis avec un mouvement dynamique" }] } },
  tete: { label: "Découvrir la tête", pourquoi: "Avec un moniteur : la chute en tête s'apprend en cours, jamais seul. En attendant, tête simulée en moulinette.",
    feu: { titre: "Découvrir la tête", criteres: [{ type: "coche", label: "Cours de grimpe en tête suivi (moniteur)" }, { type: "coche", label: "5 voies en tête simulée sans erreur de mousquetonnage" }] } },
};

// --- Le plan vide, et le modèle préparé avec Red (« Le 5 en bloc ») ---
export function planVide({ nom = "B2", debut = 1, profil = "debutant", depart = { Voie: "5a", Bloc: "4" } } = {}) {
  return { version: 2, modele: "", profil, nom, titre: "", depart: { ...depart }, objectif: { disc: "Bloc", cot: "" }, secondaires: [], fil: "",
    jours: { Lundi: "repos", Mardi: "course", Mercredi: "voie", Jeudi: "prevention", Vendredi: "dure", Samedi: "repos", Dimanche: "volume" },
    duree: 120, planB: "bloc", semaines: semainesParDefaut(profil), premiere: 1, debut, remplace: false, feux: null };
}
// Un plan enregistré par la 8.17 (un seul secondaire « devers ») : mis au format actuel
export function normaliser(plan) {
  const p = JSON.parse(JSON.stringify(plan));
  if (!p.secondaires) p.secondaires = p.secondaire === "devers" ? [{ type: "devers", niveau: (p.depart || {}).Bloc || "4" }] : [];
  delete p.secondaire; p.version = 2; return p;
}
export const MODELES = [
  { id: "cinq-bloc", titre: "Le 5 en bloc (débutant)", resume: "Objectif bloc 5 consolidé · dévers facile · hauteur en voie · 3 séances (mer voie, ven dur, dim volume)",
    plan: () => ({ ...planVide({ nom: "B1", debut: 2 }), modele: "cinq-bloc", titre: "Le 5 en bloc", objectif: { disc: "Bloc", cot: "5" }, secondaires: [{ type: "devers", niveau: "4" }], fil: "hauteur", premiere: 2, debut: 2, remplace: true }) },
];
export const modele = id => MODELES.find(m => m.id === id) || null;

// --- Feux verts proposés ---
export function feuxParDefaut(plan) {
  const o = plan.objectif || {}, l = [];
  if (o.cot) l.push({ id: "objectif", role: "objectif", titre: `${o.disc} ${o.cot} consolidé`, criteres: [
    { type: "essais", disc: o.disc, cot: o.cot, min: 10 }, { type: "taux", disc: o.disc, cot: o.cot, min: 70 }, { type: "differents", disc: o.disc, cot: o.cot, min: 5 }] });
  for (const x of plan.secondaires || []) { const S = SECONDAIRES[x.type]; if (S) l.push({ id: x.type, role: "secondaire", titre: S.titre(x.niveau), criteres: S.feu(x.niveau) }); }
  const F = FILS[plan.fil]; if (F && F.feu) l.push({ id: plan.fil, role: "fil", titre: F.feu.titre, criteres: F.feu.criteres.map(c => ({ ...c })) });
  l.push({ id: "garde", role: "garde", titre: "Garde-fou doigts", criteres: [{ type: "douleur", max: 2, semaines: 4 }] });
  return l;
}

// --- Les consignes de la semaine : technique (volume, voie, plan B) et dévers (au volume) ---
const CONSIGNES = ["Pieds silencieux", "Bras tendus", "Grimpe au ralenti", "Trois points d'appui", "Regarder le pied jusqu'à la pose", "Silence total", "Pieds silencieux", "Bras tendus"];
const DEVERS_CONSIGNES = ["Hanches collées", "Hanches collées", "Pieds qui tirent", "Profil alterné", "Hanches collées", "Drop knee", "Profil alterné", "Hanches collées"];
export const consigneDefaut = k => CONSIGNES[k % CONSIGNES.length];
export const consigne = (plan, k) => (plan.consignes || [])[k] || consigneDefaut(k);
export const consigneDeversDefaut = k => DEVERS_CONSIGNES[k % DEVERS_CONSIGNES.length];
export const consigneDevers = (plan, k) => (plan.consignesDevers || [])[k] || consigneDeversDefaut(k);
// Consignes dévers nouvelles : les exercices de la catégorie Dévers pas encore utilisés (semaines légères : « Hanches collées »)
export function themesDevers(plan, exercices, dejaUtilises = []) {
  const deja = new Set(dejaUtilises), l = exercices.filter(e => e.categorie === "Dévers" && !deja.has(e.nom) && e.nom !== "Hanches collées").sort((a, b) => (ORDRE_NIV[a.niveau] ?? 1) - (ORDRE_NIV[b.niveau] ?? 1));
  let n = 0; return plan.semaines.map(s => s.type === "respiration" || s.type === "decharge" || !l.length ? "Hanches collées" : l[n++ % l.length].nom);
}
// Un même exercice deux fois dans une séance (par exemple ajouté à la main et déjà prévu par le fil rouge) : un conseil, pas une erreur
export function doublons(bloc) {
  const X = (bloc.plan && bloc.plan.exos) || {}, aSurveiller = new Set([...Object.values(X.ajouts || {}).flat().map(a => a.nom), ...Object.values(X.remplaces || {}).flatMap(m => Object.values(m))]);
  if (!aSurveiller.size) return [];
  const vus = new Set(), out = [];
  for (const s of bloc.seances) for (const version of s.contenu.split(/^## .*$/m)) {
    const c = {}; for (const l of version.split("\n")) { if (!/^\d+×/.test(l.trim())) continue; for (const m of l.matchAll(/«\s*(.+?)\s*»/g)) if (aSurveiller.has(m[1])) c[m[1]] = (c[m[1]] || 0) + 1; }
    for (const [nom, n] of Object.entries(c)) if (n > 1) { const k = `${s.jour}|${nom}`; if (!vus.has(k)) { vus.add(k); out.push(`${s.jour} : « ${nom} » apparaît ${n} fois dans la même séance (dès la semaine ${s.semaine}) : tu l'as ajouté, et il est déjà prévu. Retire l'un des deux si ce n'est pas voulu.`); } }
  }
  return out;
}
// « Proposer des thèmes nouveaux » : des exercices de technique pas encore utilisés (ni dans ce plan, ni dans les blocs d'avant) ;
// les semaines légères (respiration, décharge) gardent une consigne facile et connue
const CATS_THEMES = ["Pieds", "Prises et positions", "Corps et équilibre", "Apprendre"], ORDRE_NIV = { "Débutant": 0, "Intermédiaire": 1, "Avancé": 2 };
export function themesNouveaux(plan, exercices, dejaUtilises = []) {
  const deja = new Set(dejaUtilises), legeres = ["Grimpe au ralenti", "Pieds silencieux", "Bras tendus"];
  // une catégorie après l'autre (pieds, prises, corps, lecture…), les plus accessibles d'abord dans chacune
  const parCat = CATS_THEMES.map(c => exercices.filter(e => e.categorie === c && !deja.has(e.nom) && !legeres.includes(e.nom)).sort((a, b) => (ORDRE_NIV[a.niveau] ?? 1) - (ORDRE_NIV[b.niveau] ?? 1)));
  const l = []; for (let i = 0; parCat.some(x => x.length > i); i++) for (const x of parCat) if (x[i]) l.push(x[i]);
  let n = 0, f = 0; return plan.semaines.map(s => s.type === "respiration" || s.type === "decharge" ? legeres[f++ % legeres.length] : (l[n++] || {}).nom || legeres[0]);
}

// --- Exercices : retirer, remplacer, ajouter (par type de séance ; « planB » = la version sans partenaire) ---
//   plan.exos = { retires: { role: [nom] }, remplaces: { role: { ancien: nouveau } }, ajouts: { role: [{ nom, n, detail, phase, effort }] } }
export const TYPES_SEANCE = { dure: "Séance dure", volume: "Volume", voie: "Voie", planB: "Plan B (sans partenaire)" };
const echapper = t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const ligneAjout = a => `${Math.max(1, +a.n || 1)}× « ${a.nom} »${a.detail ? ` · ${a.detail}` : ""} {repos 2min} {${a.effort ? "effort" : "facile"}}`;
function retoucher(lignes, role, type, exos, ajouter = true) {
  const R = (exos.retires || {})[role] || [], M = (exos.remplaces || {})[role] || {}, A = ((exos.ajouts || {})[role] || []).filter(a => a.nom && (!a.phase || a.phase === type));
  let out = [];
  for (let l of lignes) {
    for (const [ancien, nouveau] of Object.entries(M)) if (nouveau) l = l.replace(new RegExp(`«\\s*${echapper(ancien)}\\s*»`, "g"), `« ${nouveau} »`);
    let sup = false;
    for (const nom of R) { const re = new RegExp(`«\\s*${echapper(nom)}\\s*»`);
      if (!re.test(l)) continue;
      if (/^(\d+\s*×\s*)?«/.test(l.trim())) { sup = true; break; }                 // la ligne EST l'exercice : elle part
      l = l.replace(new RegExp(`\\s*·\\s*«\\s*${echapper(nom)}\\s*»`, "g"), "").replace(new RegExp(`«\\s*${echapper(nom)}\\s*»\\s*·?\\s*`, "g"), ""); }
    if (!sup) out.push(l);
  }
  if (A.length && ajouter) { const i = out.findIndex(l => /^> (Retour au calme|Coudes après)/.test(l) || /^1× (Voie facile|« Traversée basse »)/.test(l)); out.splice(i < 0 ? out.length : i, 0, ...A.map(ligneAjout)); }
  return out;
}
export function appliquerExos(contenu, role, type, exos) {
  if (!exos) return contenu;
  const segs = [], lignes = contenu.split("\n"); let cur = { nom: "", l: [] }; segs.push(cur);
  for (const l of lignes) { if (l.startsWith("## ")) { cur = { nom: l, l: [] }; segs.push(cur); } else cur.l.push(l); }
  // La partie commune (avant le premier « ## ») d'une séance à versions ne reçoit pas les ajouts : ils vont dans chaque version
  const aVersions = segs.length > 1;
  return segs.map(sg => { const r = /^## Remplacement/.test(sg.nom) ? "planB" : role; return [...(sg.nom ? [sg.nom] : []), ...retoucher(sg.l, r, type, exos, !(aVersions && !sg.nom))]; }).flat().join("\n");
}
// Les exercices proposés par le générateur, par type de séance (sans les consignes de la semaine, réglées à part)
export function exercicesProposes(plan, echelles) {
  const b = genererBloc({ ...plan, exos: null }, echelles), out = {};
  for (const s of b.seances) { const role = s.role; if (!TYPES_SEANCE[role]) continue; let r = role; const k = s.semaine - plan.debut + (plan.premiere || 1) - 1, consignes = new Set([consigne(plan, k), consigneDevers(plan, k)]);
    for (const l of s.contenu.split("\n")) { if (l.startsWith("## ")) { r = /^## Remplacement/.test(l) ? "planB" : role; continue; }
      for (const m of l.matchAll(/«\s*(.+?)\s*»/g)) if (!consignes.has(m[1]) && !l.startsWith("!")) (out[r] = out[r] || new Set()).add(m[1]); } }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
}

// Les étiquettes de phase : « B1 · S3-4 Construction » (numéros de semaine du bloc)
export function libellesPhases(plan) {
  const out = {}, sem = plan.semaines; let i = (plan.premiere || 1) - 1;
  while (i < sem.length) { let j = i; while (j + 1 < sem.length && sem[j + 1].type === sem[i].type) j++;
    const lab = `${plan.nom} · S${i + 1}${j > i ? "-" + (j + 1) : ""} ${(PHASES[sem[i].type] || PHASES.base).label}`;
    for (let k = i; k <= j; k++) out[k] = lab; i = j + 1; }
  return out;
}

// --- Les séances ---
const apresRespiration = (plan, k) => plan.semaines.slice(0, k).some(s => s.type === "respiration");
function hauteur(plan, k) {
  if (plan.fil !== "hauteur") return "";
  const t = plan.semaines[k].type;
  if (t === "base") return "Hauteur : monte jusqu'en haut de chaque voie, puis redescends 2 ou 3 prises en « Désescalade en voie » avant de te faire descendre.";
  if (t === "construction" && !apresRespiration(plan, k)) return "Hauteur : à mi-hauteur, assieds-toi 10 s dans le baudrier (corde tendue), puis refais-le en haut de la voie.";
  if (t === "construction") return "Hauteur : petits lâchers en moulinette. Corde tendue, lâche les mains et laisse-toi descendre de 20 cm. 3 fois, puis coche le feu « Hauteur » quand c'est serein.";
  if (t === "respiration") return "Hauteur : voies faciles pour le plaisir, rien à prouver.";
  if (t === "realisation") return "Hauteur : grimpe pour le plaisir, et tente une voie un cran au-dessus.";
  return "";
}
const dureeTxt = m => m % 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m / 60} h`;
function seanceDure(plan, k, E) {
  const s = plan.semaines[k], o = plan.objectif, d = o.disc, L = plan.depart[d], [P1, P2] = pyramide(E, d, L, o.cot), mot = d === "Voie" ? "Voie" : "Bloc", tag = x => `{${d.toLowerCase()} ${x}}`;
  const l = d === "Voie" ? ["## Voie (avec partenaire)", "> Échauffement voie", "> Vérifications croisées", "> Contrôle des doigts"] : ["> Échauffement bloc", "> Contrôle des doigts"];
  if (s.type === "decharge") {
    l.push(`! Semaine de décharge : aucun ${mot.toLowerCase()} ${o.cot}. On grimpe pour le plaisir.`, `6× ${mot} plaisir niveau ${P1} · rien de maximal {repos 2min} ${tag(P1)}`);
  } else {
    l.push(`! Pyramide : 2 × ${P1}, 2 × ${P2}, puis les essais en ${o.cot}.`, `2× ${mot} niveau ${P1} · « Regarder le pied jusqu'à la pose » {repos 2min} ${tag(P1)}`, `2× ${mot} niveau ${P2} · « Lecture avant de grimper » {repos 3min} ${tag(P2)}`);
    if (s.type === "respiration") l.push("! Semaine de respiration : moins d'essais, mêmes repos.");
    if (s.type === "realisation") l.push(`! Objectif du jour : réussir 3 ${mot.toLowerCase()}s ${o.cot} différents. Repos complet entre les essais.`);
    if (plan.fil === "dynamique" && s.type === "base") l.push("3× « Point mort (deadpoint) » · sur de bonnes prises, pieds fixes {repos 2min} {facile}");
    if (plan.fil === "dynamique" && s.type === "construction") l.push("3× « Déplacement dynamique contrôlé » · sur un bloc facile {repos 2min} {effort}");
    const dev = s.type === "construction" && apresRespiration(plan, k) && d === "Bloc" ? " (1 ou 2 en dévers léger)" : "";
    if (s.essais > 0) l.push(`${s.essais}× Essai sur « Projet » : ${mot.toLowerCase()} ${o.cot}${dev} · « Repos entre essais » {repos 4min} ${tag(o.cot)} {effort}`);
    l.push("! Règles d'arrêt : gêne aux doigts, mouvement qui devient aléatoire, ou 3 échecs de suite au même endroit.", `! Plan B si ça ne passe pas : ${mot.toLowerCase()}s ${P2} en « Travail au point ».`);
    if (plan.duree) l.push(`! Séance prévue : ${dureeTxt(plan.duree)}. Du temps en plus ? Du volume facile, jamais plus d'essais sur l'objectif.`);
    if ((PROFILS[plan.profil] || {}).suspensions && s.type === "construction") l.push("3× « Suspension active » · 10 s sur une grosse prise, épaules engagées {repos 2min} {effort}");
  }
  l.push(d === "Voie" ? `1× Voie facile · « Grimpe fluide » · retour au calme {voie ${plan.depart.Voie}} {facile}` : "1× « Traversée basse » · retour au calme {facile} {chrono 5min}", "> Retour au calme salle", "> Coudes après la séance");
  if (d === "Voie" && plan.planB === "bloc") l.push(...planBBloc(plan, k, E));
  return l.join("\n");
}
const oBloc = plan => plan.objectif.disc === "Bloc" ? plan.objectif.cot : null;
function seanceVolume(plan, k, E) {
  const s = plan.semaines[k], [V1, V2] = niveauxVolume(E, "Bloc", plan.depart.Bloc, oBloc(plan)), c = consigne(plan, k);
  const v2 = s.type === "decharge" ? 0 : Math.round(s.volume / 3), v1 = s.volume - v2;
  const l = ["> Échauffement salle B (traversée)", s.type === "decharge" ? "! Semaine de décharge : séance courte et facile." : "! Séance volume : rien de maximal. Elle protège les doigts.", `! Consigne de la semaine : « ${c} ».`, `${v1}× Bloc niveau ${V1} · « ${c} » {repos 2min} {bloc ${V1}}`];
  if (v2) l.push(`${v2}× Bloc niveau ${V2} · « ${c} » {repos 2min} {bloc ${V2}}`);
  const dv = sec(plan, "devers"), dl = sec(plan, "dalle");
  if (s.devers > 0 && dv) l.push(`${s.devers}× Bloc dévers niveau ${dv.niveau} · « ${consigneDevers(plan, k)} » {repos 3min} {bloc ${dv.niveau}} {effort}`);
  if (s.devers > 0 && dl) l.push(`${s.devers}× Bloc en dalle niveau ${dl.niveau} · « Adhérence (pied à plat) » · « Grimpe en dalle » {repos 3min} {bloc ${dl.niveau}} {effort}`);
  if (plan.fil === "chute" && (s.type === "base" || s.type === "construction")) l.push("! Fil rouge, réceptions : redescends en « Désescalade » quand c'est possible ; sinon saut contrôlé, pieds écartés, genoux souples, puis roulade en arrière.",
    `3× Saut contrôlé depuis ${s.type === "base" ? "mi-hauteur" : "le haut d'un bloc facile"} · réception pieds, fesses, dos {repos 1min} {facile}`);
  if (s.type !== "decharge") l.push("1× « Jeu des mouvements ajoutés » · seul ou à deux {facile} {chrono 10min}");
  l.push("> Retour au calme salle", "> Coudes après la séance");
  return l.join("\n");
}
function planBBloc(plan, k, E) {
  const s = plan.semaines[k], [V1, V2] = niveauxVolume(E, "Bloc", plan.depart.Bloc, oBloc(plan)), c = consigne(plan, k);
  return ["## Remplacement bloc (pas de partenaire)", "> Échauffement bloc", `! Pas de partenaire : séance bloc modérée, sans maximum${plan.objectif.disc === "Bloc" ? " (la séance dure reste celle prévue)" : ""}.`,
    `${s.type === "decharge" ? 5 : 8}× Bloc niveau ${V1} · « ${c} » {repos 2min} {bloc ${V1}}`, ...(s.type === "decharge" ? [] : [`2× Bloc niveau ${V2} · sans forcer {repos 3min} {bloc ${V2}}`]),
    "1× « Traversée basse » · retour au calme {facile} {chrono 5min}", "> Coudes après la séance"];
}
function seanceVoie(plan, k, E) {
  const s = plan.semaines[k], V = plan.depart.Voie, nv = sec(plan, "voie"), V1 = nv ? nv.niveau : monter(E, "Voie", V), V2 = monter(E, "Voie", V1), ht = hauteur(plan, k), c = consigne(plan, k);
  const en = sec(plan, "endurance"), av = sec(plan, "avue"), legere = s.type === "respiration" || s.type === "decharge";
  const l = ["## Voie (avec partenaire)", "> Échauffement voie", "> Vérifications croisées"];
  if (s.type === "decharge") l.push("! Séance facultative : 3 ou 4 voies faciles pour le plaisir.", `3× Voie en ${V} · « Grimpe fluide » {repos 3min} {voie ${V}}`);
  else {
    if (ht) l.push(`! ${ht}`);
    if (plan.fil === "tete") l.push(s.type === "base" ? "! Fil rouge tête : inscris-toi à un cours de grimpe en tête avec un moniteur. La chute en tête s'apprend en cours, jamais seul." : s.type === "realisation" ? "! Fil rouge tête : si le cours est fait, 1 ou 2 voies faciles en tête, avec un assureur formé." : "! Fil rouge tête : tête simulée. Tu grimpes en moulinette (elle t'assure) et tu mousquetonnes une 2e corde à chaque dégaine.");
    l.push(`3× Voie en ${V} · « ${c} » · « Grimpe fluide » {repos 3min} {voie ${V}}`);
    if (plan.fil === "tete" && (s.type === "construction" || s.type === "respiration")) l.push(`2× Voie en ${V} en tête simulée · « Mousquetonnage efficace (tête) » {repos 3min} {voie ${V}}`);
    if (s.voies > 0 && s.type !== "respiration") l.push(`${s.voies}× Voie en ${V1}${s.type === "realisation" ? " · pour le plaisir" : ""} · « Repos bras tendu » · « Face puis profil » {repos 5min} {voie ${V1}} {effort}`);
    if (s.type === "realisation") l.push(`1× Essai sur une voie en ${V2} · sans pression {repos 5min} {voie ${V2}} {effort}`);
    if (en && !legere) l.push(s.type === "base" ? "1× « ARC » · 10 min en voie très facile, sans t'arrêter {facile} {chrono 10min}" : `2× Enchaîner 2 voies en ${en.niveau} (1 min de pause entre les deux) · « Repos bras tendu » {repos 5min} {voie ${en.niveau}} {effort}`);
    if (av && !legere) l.push(`1× Voie à vue en ${av.niveau} · jamais essayée · « À vue (lecture complète) » {repos 4min} {voie ${av.niveau}}`);
    l.push(`1× Voie facile · « Grimpe fluide » · retour au calme {voie ${V}} {facile}`);
  }
  l.push("> Coudes après la séance");
  if (plan.planB === "bloc") l.push(...planBBloc(plan, k, E));
  return l.join("\n");
}
const seanceCourse = (plan, k) => ["> Course · avant", `1× ${plan.semaines[k].course} min de course · « Allure conversation » {chrono ${plan.semaines[k].course}min}`, "! Séance bonus : à faire si l'envie et la forme sont là.", "> Course · après"].join("\n");
function seancePrevention(plan, k) {
  const s = plan.semaines[k], g = sec(plan, "gainage"), l = ["> Routine du jeudi"];
  if (g && s.type !== "decharge") l.push("> Gainage express");
  if (g && (k === (plan.premiere || 1) - 1 || s.type === "realisation")) l.push(`1× « Planche » · ton maximum, une seule fois (objectif ${g.niveau} s) {mesure planche}`);
  l.push("! Séance bonus : 15 à 20 min, de préférence les jours sans grimpe.");
  return l.join("\n");
}

// --- Le bloc complet ---
export function genererBloc(plan, echelles) {
  plan = plan.secondaires ? plan : normaliser(plan);
  const phases = libellesPhases(plan), seances = [], premiere = (plan.premiere || 1) - 1;
  for (let k = premiere; k < plan.semaines.length; k++) {
    const semaine = plan.debut + k - premiere;
    for (const jour of JOURS) {
      const role = plan.jours[jour]; if (!role || role === "repos") continue;
      const R = ROLES[role], s = plan.semaines[k];
      const contenu = role === "dure" ? seanceDure(plan, k, echelles) : role === "volume" ? seanceVolume(plan, k, echelles) : role === "voie" ? seanceVoie(plan, k, echelles) : role === "course" ? seanceCourse(plan, k) : seancePrevention(plan, k);
      seances.push({ semaine, jour, activite: role === "dure" ? plan.objectif.disc : R.activite, phase: phases[k], contenu: appliquerExos(contenu, role, s.type, plan.exos), bonus: !!R.bonus, role });
    }
  }
  return { id: plan.id || `${plan.nom}-${Date.now().toString(36)}`, nom: plan.nom, titre: plan.titre || `${plan.objectif.disc} ${plan.objectif.cot}`, debut: plan.debut, nb: plan.semaines.length - premiere,
    remplace: !!plan.remplace, seances, feux: (plan.feux || feuxParDefaut(plan)).map(f => ({ ...f, criteres: f.criteres.map(c => ({ ...c })) })), coches: {}, plan: JSON.parse(JSON.stringify(plan)) };
}

// --- Alertes : des conseils, jamais un blocage ---
export function alertesObjectif(plan, echelles) {
  const o = plan.objectif, a = [];
  if (!o.cot) return ["Choisis une cotation : un objectif doit se mesurer."];
  const e = ecartPas(echelles, o.disc, plan.depart[o.disc], o.cot);
  if (e > 2) a.push(`Objectif ambitieux : plus d'un cran au-dessus de ton niveau consolidé (${plan.depart[o.disc]}). Un cran par bloc est la règle habituelle.`);
  if (e <= 0) a.push("L'objectif n'est pas au-dessus de ton niveau consolidé : ce sera un bloc d'entretien.");
  if ((plan.secondaires || []).length > 2) a.push("Plus de deux objectifs secondaires : ils dispersent l'effort.");
  if (plan.fil === "tete") a.push("Découvrir la tête : la chute en tête s'apprend avec un moniteur. Le bloc prévoit de la tête simulée en moulinette en attendant.");
  return a;
}
export function alertesJours(plan) {
  const a = [], idx = JOURS.map(j => plan.jours[j] || "repos"), salle = r => ROLES[r] && ROLES[r].salle;
  const dures = idx.map((r, i) => r === "dure" ? i : -1).filter(i => i >= 0);
  if (!dures.length) a.push("Aucune séance dure : l'objectif avancera lentement.");
  if (dures.length > 1 && plan.profil === "debutant") a.push("Deux séances dures par semaine : c'est beaucoup pour un débutant (doigts).");
  for (let i = 0; i < 7; i++) { const j = (i + 1) % 7;
    if (idx[i] === "dure" && salle(idx[j])) a.push(`${JOURS[j]} : moins de 48 h après la séance dure du ${JOURS[i].toLowerCase()}. Les doigts récupèrent en 48 h.`);
    if (salle(idx[i]) && idx[j] === "dure") a.push(`${JOURS[j]} : la séance dure suit une séance en salle la veille. Mieux vaut arriver reposé.`); }
  const nSalle = idx.filter(salle).length; if (nSalle > 4) a.push(`${nSalle} séances en salle par semaine : prévois au moins 2 jours sans grimpe.`);
  if (plan.secondaires && plan.secondaires.some(x => SECONDAIRES[x.type] && SECONDAIRES[x.type].disc === "Voie") && !idx.includes("voie")) a.push("Un objectif secondaire en voie, mais aucune séance voie dans la semaine.");
  return a;
}
export function alertesPhases(plan) {
  const a = [], s = plan.semaines.slice((plan.premiere || 1) - 1); let max = 0;
  s.forEach((x, i) => { if (i && x.charge > max + 10) a.push(`Semaine ${i + (plan.premiere || 1)} : la charge monte de plus de 10 points d'un coup (${max} → ${x.charge}).`); max = Math.max(max, x.charge); });
  if (s.length < 6) a.push(`Bloc de ${s.length} semaines : c'est court pour consolider un niveau. Bien pour un bloc de reprise ou d'entretien.`);
  if (s.length > 10) a.push(`Bloc de ${s.length} semaines : la lassitude et la fatigue s'accumulent. Garde au moins deux semaines légères.`);
  if (!s.length || s[s.length - 1].type !== "decharge") a.push("Pas de semaine de décharge à la fin : le risque de blessure monte et le bloc suivant démarre fatigué.");
  if (s.length >= 6 && !s.some(x => x.type === "respiration" || x.type === "decharge")) a.push("Aucune semaine légère : prévois une respiration au milieu.");
  return a;
}
export function alertesFeux(feux) {
  const a = [];
  if (!feux.some(f => f.criteres.some(c => ["essais", "taux", "differents"].includes(c.type)))) a.push("Aucun feu mesuré par tes passages : tu ne sauras pas si l'objectif est atteint.");
  if (!feux.some(f => f.criteres.some(c => c.type === "douleur"))) a.push("Pas de garde-fou douleur : il protège les doigts pendant tout le bloc.");
  return a;
}
