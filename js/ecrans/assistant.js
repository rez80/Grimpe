// ecrans/assistant.js — « Construire un bloc » : 7 étapes, chargé seulement quand on l'ouvre.
// Présentation de l'app : des lignes « Libellé ……… valeur › » ; un appui ouvre les choix dans un cadre, choisir le referme.
// Les alertes sont des conseils : rien n'est jamais bloqué, « Suivant » reste toujours possible. C'est le grimpeur qui décide.
import { h, si, liste, forcerOuvert } from "../html.js";
import { JOURS, semaineDe, dateSeance, jourMois, hm } from "../dates.js";
import { programmeEffectif, etapesSeance, dureeSeance } from "../programme.js";
import { lignesDe } from "../parseur.js";
import { salleDe, salleParDefautPour, cotationDe, deuxCot } from "../salles.js";
import { libelleCritere, finBloc, feuxBloc } from "../blocs.js";
import { FAMILLES, NOMS_FAMILLES, sansAccent } from "./plus.js";
import { PHASES, ORDRE_PHASES, ROLES, PROFILS, MODELES, modele, planVide, normaliser, semainesParDefaut, feuxParDefaut, genererBloc, crans,
  TYPES_SEANCE, DUREES, SECONDAIRES, FILS, ROLES_PERSO, estBonus, autreDe, fourchette, proposeSemaine, niveauSecondaire, exercicesProposes, consigne, consigneDevers, themesNouveaux, themesDevers, doublons, ligneAjout,
  alertesObjectif, alertesJours, alertesPhases, alertesFeux } from "../plan.js";

const ETAPES = ["Départ", "Objectif", "Disponibilités", "Phases", "Séances", "Feux verts", "Récapitulatif"];
const POURQUOI = [
  "On part de ce que tu réussis déjà de façon régulière (niveau consolidé), pas de ton meilleur jour. L'app le propose d'après tes passages ; corrige-le si tu sais mieux. 8 semaines est le compromis habituel.",
  "Un seul objectif principal, mesurable : c'est lui qui décide du contenu de la séance dure. La règle habituelle : un cran au-dessus du niveau consolidé par bloc. Deux objectifs secondaires au plus, et un fil rouge (une peur, un savoir-faire) restent légers.",
  "Une seule séance dure par semaine suffit pour progresser au début. Les doigts (tendons, poulies) récupèrent en 48 h : pas de séance en salle la veille ni le lendemain de la séance dure. Les séances bonus ne comptent pas comme manquées.",
  "Trois réglages font monter la charge : le nombre d'essais, le volume, la difficulté. Pas plus de 10 points d'une semaine à l'autre, une semaine de respiration au milieu, et une décharge à la fin : on progresse pendant la récupération.",
  "Chaque séance suit le même squelette : échauffement, contrôle des doigts, pyramide, partie principale, règles d'arrêt, retour au calme. Les chiffres sont des cibles, pas des obligations. La consigne de la semaine donne le fil technique.",
  "Un feu vert dit quand un objectif est atteint, avec tes passages : nombre d'essais, taux de réussite, cotations différentes. Le garde-fou douleur passe avant tout.",
  "Relis, puis crée le bloc. Tu pourras le modifier ou le retirer depuis sa carte dans le Programme ; « Annuler » le défait aussitôt.",
];

// --- Démarrer l'assistant ---
export function initial(ctx, d = {}) {
  const { doc, data } = ctx, debutProg = doc.reglages.dateDebut || data.dateDebut, wNow = Math.max(1, semaineDe(debutProg, ctx.aujourdhui()));
  const B = ctx.bilan, c = B.consolides || {}, depart = { Voie: (c["Voie-Vertical"] || {}).niveau || "5a", Bloc: (c["Bloc-Vertical"] || {}).niveau || "4" };
  const existant = d.bloc && (doc.blocs || []).find(b => b.id === d.bloc);
  let plan, etape = 0;
  if (existant && existant.plan) { plan = normaliser(existant.plan); plan.id = existant.id; }
  else if (d.modele && modele(d.modele)) { plan = modele(d.modele).plan(); etape = d.recap ? 6 : 0; }
  else if (d.suite && (doc.blocs || []).some(b => b.id === d.suite)) plan = planSuite(ctx, doc.blocs.find(b => b.id === d.suite));
  else { const der = derniereSemaine(ctx); plan = planVide({ nom: nomPour(ctx, der + 1, false), debut: der + 1, depart }); }
  return { etape, plan, apercu: (plan.premiere || 1) - 1, pourquoi: false, section: null, wNow, edition: !!existant };
}
// « Partir du bloc précédent » : mêmes jours, réglages et exercices ; niveaux mis à jour ; objectif suivant s'il est atteint, sinon le même
function planSuite(ctx, b, supposeReussi = false) {      // supposeReussi : bloc pas encore fini, mais on prépare la suite comme s'il était réussi
  const E = ctx.data.echelles, q = normaliser(b.plan), der = derniereSemaine(ctx), rang = (d, c) => (E[d] || []).indexOf(String(c)), debutProg = ctx.doc.reglages.dateDebut || ctx.data.dateDebut;
  const p = { ...JSON.parse(JSON.stringify(q)), modele: `suite:${b.id}`, nom: nomPour(ctx, der + 1, false), titre: "", debut: der + 1, remplace: false, premiere: 1, feux: null, feuxModifies: false, consignes: null, consignesDevers: null };
  delete p.id;
  const c = ctx.bilan.consolides || {};
  for (const d of ["Voie", "Bloc"]) { const n = (c[`${d}-Vertical`] || {}).niveau; if (n && rang(d, n) > rang(d, p.depart[d])) p.depart[d] = n; }
  const F = feuxBloc(b, { programme: ctx.programme, doc: ctx.doc, aujourdhui: ctx.aujourdhui(), dateDebut: debutProg }), o = q.objectif, atteint = supposeReussi || (F.find(f => f.role === "objectif") || {}).ok;
  if (atteint && rang(o.disc, o.cot) > rang(o.disc, p.depart[o.disc])) p.depart[o.disc] = o.cot;
  p.objectif = { disc: o.disc, cot: atteint || rang(o.disc, o.cot) <= rang(o.disc, p.depart[o.disc]) ? (E[o.disc] || [])[rang(o.disc, p.depart[o.disc]) + 1] || o.cot : o.cot };
  p.secondaires = (q.secondaires || []).map(x => x.type === "devers" || x.type === "dalle" ? { ...x, niveau: p.depart.Bloc } : x);
  const filFait = supposeReussi || (F.find(f => f.role === "fil") || {}).ok; if (filFait) p.fil = "";
  p.supposeReussi = supposeReussi;
  const deja = (ctx.doc.blocs || []).filter(x => x.plan).flatMap(x => { const r = normaliser(x.plan); return r.semaines.map((_, k) => consigne(r, k)); });
  p.consignes = themesNouveaux(p, ctx.data.exercices, deja);
  if ((p.secondaires || []).some(x => x.type === "devers")) p.consignesDevers = themesDevers(p, ctx.data.exercices, (ctx.doc.blocs || []).filter(x => x.plan).flatMap(x => { const r = normaliser(x.plan); return r.semaines.map((_, k) => consigneDevers(r, k)); }));
  return p;
}
const derniereSemaine = ctx => Math.max(0, ...programmeEffectif(ctx.data, { ...ctx.doc, blocs: [] }).map(s => s.semaine), ...(ctx.doc.blocs || []).map(finBloc));
function nomPour(ctx, w, remplace) {
  const P = ctx.programme, ph = remplace && (P.find(s => s.semaine === w) || {}).phase; if (ph && /^B\d+/.test(ph)) return ph.split(" · ")[0];
  const n = Math.max(0, ...P.map(s => +((/^B(\d+)/.exec(s.phase || "") || [])[1] || 0)), ...(ctx.doc.blocs || []).map(b => +((/^B(\d+)/.exec(b.nom) || [])[1] || 0)));
  return `B${n + 1}`;
}

// --- Petits éléments, au style de l'app ---
// Une ligne « Libellé ……… valeur › » ; son contenu s'ouvre dessous dans un cadre
const ligne = (A, cle, label, valeur, contenu) => h`<button class="fiche-ligne" data-act="asSection" data-k="${cle}" aria-expanded="${A.section === cle ? "true" : "false"}"><span>${label}</span><span class="val">${valeur ?? "—"} ${A.section === cle ? "▾" : "›"}</span></button>${A.section === cle ? h`<div class="fiche-contenu as-cadre">${contenu()}</div>` : ""}`;
// Une ligne qui ouvre une fenêtre (pas de cadre)
const ligneFenetre = (label, valeur, act, data = {}) => h`<button class="fiche-ligne" data-act="${act}" ${Object.entries(data).map(([k, v]) => h`data-${k}="${v}" `)}><span>${label}</span><span class="val">${valeur} ›</span></button>`;
const groupe = (titre, contenu, note = "") => h`<div class="carte as-groupe"><h3 class="as-sous">${titre}${note ? h` <span class="petit">${note}</span>` : ""}</h3>${contenu}</div>`;
// Puces : un appui choisit et referme la ligne
const puces = (chemin, options, actuel, { num = false, garder = false } = {}) => h`<div class="choix as-puces">${options.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o];
  return h`<button data-act="asValeur" data-chemin="${chemin}" data-valeur="${v}" ${num ? h`data-num="1"` : ""} ${garder ? h`data-garder="1"` : ""} class="${String(actuel) === String(v) ? "choisi" : ""}">${l}</button>`; })}</div>`;
// − valeur + (chiffres)
const pas = (chemin, val, { min = 0, max = 99, d = 1, suffixe = "" } = {}) => h`<span class="as-pas"><button data-act="asPas" data-chemin="${chemin}" data-d="${-d}" data-min="${min}" data-max="${max}" aria-label="moins">−</button><b>${val}${suffixe}</b><button data-act="asPas" data-chemin="${chemin}" data-d="${d}" data-min="${min}" data-max="${max}" aria-label="plus">+</button></span>`;
// Liste déroulante (plus de 4 choix) : la valeur change sans refermer la ligne
// Une cotation de l'app avec son équivalent dans la salle habituelle (« 4 · ≈ 5+ »), comme partout ailleurs dans l'app
const salleEq = (ctx, disc) => salleDe(ctx.doc, salleParDefautPour(ctx.doc, disc)) || (ctx.doc.salles || []).find(s => (s.type === disc || s.type === "Bloc et voie") && cotationDe(s, disc).mode === "liste") || null;
const eq = (ctx, disc, cot) => cot ? deuxCot(salleEq(ctx, disc), disc, "", cot) : cot;
const eqOptions = (ctx, disc, l) => l.map(c => [c, eq(ctx, disc, c)]);
const deroulant = (chemin, options, valeur, vide = null) => liste("", options, valeur, { act: "asChamp", vide, data: { chemin } });
const champTexte = (chemin, valeur, ph, max = 40) => h`<input type="text" class="as-texte" value="${valeur || ""}" placeholder="${ph}" data-act="asChamp" data-chemin="${chemin}" maxlength="${max}">`;
const rangee = (label, contenu) => h`<div class="as-rangee"><span>${label}</span>${contenu}</div>`;
const alertes = l => l.length ? h`${l.map(t => h`<div class="avert">${t}</div>`)}<p class="petit">Ce sont des conseils : tu peux continuer tel quel, c'est toi qui décides.</p>` : "";
const hmc = m => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
// Une plage de cotations autour d'un niveau (pour ne pas afficher toute l'échelle)
const plage = (E, d, autour, avant = 4, apres = 8) => { const l = E[d] || [], i = Math.max(0, l.indexOf(String(autour))); return l.slice(Math.max(0, i - avant), i + apres + 1); };

// --- Rendu ---
export function rendre(ctx) {
  const A = ctx.state.assistant; if (!A) return { html: h`<p class="petit">Assistant fermé.</p>`, titre: h`<b>Construire un bloc</b>` };
  const P = A.plan, E = ctx.data.echelles, i = A.etape;
  const corps = [etapeDepart, etapeObjectif, etapeJours, etapePhases, etapeSeances, etapeFeux, etapeRecap][i](ctx, A, P, E);
  const html = h`<div class="as-haut"><div class="as-etapes">${ETAPES.map((t, k) => h`<button class="as-pt ${k === i ? "actif" : k < i ? "fait" : ""}" data-act="asAller" data-k="${k}" aria-label="Étape ${k + 1} : ${t}">${k + 1}</button>`)}</div>
      <div class="as-nom"><b>${i + 1} · ${ETAPES[i]}</b> <button class="lien" data-act="asPourquoi">${A.pourquoi ? "▾" : "▸"} Pourquoi ?</button></div></div>
    ${si(A.pourquoi, () => h`<p class="as-pourquoi">${POURQUOI[i]} <button class="lien" data-act="ouvrirAide" data-k="bloc">Le guide complet ›</button></p>`)}
    ${corps}
    <div class="barre-seance barre-assistant">${i > 0 ? h`<button data-act="asAller" data-k="${i - 1}">‹ Précédent</button>` : ""}
      ${i < ETAPES.length - 1 ? h`<button class="principal" data-act="asAller" data-k="${i + 1}">Suivant ›</button>` : h`<button class="principal" data-act="asCreer">${A.edition ? "Enregistrer le bloc" : "Créer le bloc"}</button>`}</div>`;
  return { html, titre: h`<b>Construire un bloc</b>` };
}

// 1. Départ
function etapeDepart(ctx, A, P, E) {
  const der = derniereSemaine(ctx), quand = [], debutProg = ctx.doc.reglages.dateDebut || ctx.data.dateDebut;
  for (let w = Math.max(1, Math.min(A.wNow, der)); w <= der; w++) quand.push([String(w), `Remplacer à partir de la semaine ${w} (${jourMois(dateSeance(debutProg, w, "Lundi"))})`]);
  quand.push(["apres", `Après le programme (semaine ${der + 1})`]);
  const valQuand = P.remplace ? `remplace dès la semaine ${P.debut}` : `après le programme (sem. ${P.debut})`;
  const precedents = (ctx.doc.blocs || []).filter(b => b.plan && b.id !== P.id).map(b => [`suite:${b.id}`, `Partir de ${b.nom} · ${b.titre}`, "mêmes jours et exercices, niveaux à jour, objectif suivant s'il est atteint"]);
  const choixModeles = [...precedents, ...MODELES.map(m => [m.id, m.titre, m.resume]), ["", "Partir de zéro", "tous les choix à faire"]], nomModele = (choixModeles.find(x => x[0] === (P.modele || "")) || [, "Partir de zéro"])[1];
  return h`${si(!A.edition, () => groupe("Point de départ du plan", ligne(A, "modele", "Modèle", nomModele, () => h`<div class="liste">${choixModeles.map(([id, t, r]) => h`<button class="item" data-act="asModele" data-id="${id}"><span><b>${t}</b><br><span class="petit">${r}</span></span><span>${(P.modele || "") === id ? "✓" : ""}</span></button>`)}</div>`)))}
    ${(() => { const src = !A.edition && String(P.modele || "").startsWith("suite:") && (ctx.doc.blocs || []).find(b => `suite:${b.id}` === P.modele);
      if (!src || finBloc(src) < A.wNow) return "";      // bloc fini : ses feux verts décident
      return groupe(`${src.nom} n'est pas encore fini`, h`${ligne(A, "suppose", `${src.nom} réussi ?`, P.supposeReussi ? "oui, le supposer" : "selon ses feux verts", () => h`${puces("supposeReussi", [["", "Selon ses feux verts"], ["1", "Oui, le supposer"]], P.supposeReussi ? "1" : "")}
        <p class="petit">Oui : l'assistant prépare la suite comme si ${src.nom} était réussi : objectif au cran suivant, niveaux et dévers à jour, nouveau fil rouge à choisir. Tes autres réglages de l'étape 1 sont gardés.</p>`)}`); })()}
    ${groupe("Toi", h`${ligne(A, "profil", "Profil", PROFILS[P.profil].label, () => h`${puces("profil", Object.entries(PROFILS).map(([k, p]) => [k, p.label]), P.profil)}<p class="petit">${PROFILS[P.profil].pourquoi}</p>`)}
      ${ligne(A, "dv", "Niveau consolidé en voie", eq(ctx, "Voie", P.depart.Voie), () => puces("depart.Voie", eqOptions(ctx, "Voie", plage(E, "Voie", P.depart.Voie)), P.depart.Voie))}
      ${ligne(A, "db", "Niveau consolidé en bloc", eq(ctx, "Bloc", P.depart.Bloc), () => puces("depart.Bloc", eqOptions(ctx, "Bloc", plage(E, "Bloc", P.depart.Bloc)), P.depart.Bloc))}
      <p class="petit">Proposé d'après tes passages (≥ 5 essais à ≥ 70 % sur la cotation).</p>`)}
    ${groupe("Le bloc", h`${ligne(A, "quand", "Quand", valQuand, () => h`<div class="liste">${quand.map(([v, l]) => h`<button class="item ${String(P.remplace ? P.debut : "apres") === v ? "choisi" : ""}" data-act="asValeur" data-chemin="quand" data-valeur="${v}"><span>${l}</span></button>`)}</div>`)}
      ${ligne(A, "duree", "Durée", `${P.semaines.length} semaines`, () => h`${puces("nbSemaines", DUREES.map(n => [String(n), String(n)]), String(P.semaines.length), { num: true })}<p class="petit">8 semaines : le compromis habituel. 4 à 6 : un bloc court, sans respiration. 11 à 12 : deux semaines de respiration.</p>`)}
      ${ligne(A, "premiere", "Commence à sa semaine", String(P.premiere || 1), () => h`${puces("premiere", [1, 2, 3, 4].map(String), String(P.premiere || 1), { num: true })}<p class="petit">Pour reprendre un plan en cours de route : les premières semaines sont considérées comme faites.</p>`)}
      ${ligne(A, "nom", "Nom", P.nom, () => h`<input type="text" class="as-texte" value="${P.nom}" data-act="asChamp" data-chemin="nom" maxlength="6">`)}
      ${ligne(A, "titre", "Titre", P.titre || "à écrire", () => h`<input type="text" class="as-texte" value="${P.titre}" placeholder="Le 5+ en bloc" data-act="asChamp" data-chemin="titre" maxlength="40">`)}`)}`;
}

// 2. Objectif
const MESURES_SEC = [["differents", "Réussis différents"], ["essais", "Essais"], ["taux", "Réussite %"], ["avue", "À vue ou flash"]];
function cadreAutre(x, n, E, P) {
  const ch = `secondaires.${n}`;
  return h`<label class="champ">Ton objectif</label>${champTexte(`${ch}.titre`, x.titre, "Fissures, dalle 6A, mobilité hanches…")}
    <label class="champ">Travaillé à la séance</label>${deroulant(`${ch}.ou`, Object.entries(ROLES_PERSO), x.ou || "volume")}
    <label class="champ">Validé par</label>${puces(`${ch}.valid`, [["coche", "Une case à cocher"], ["seuil", "Un seuil sur tes passages"]], x.valid || "coche", { garder: true })}
    ${si(x.valid === "seuil", () => h`${puces(`${ch}.disc`, ["Bloc", "Voie"], x.disc || "Bloc", { garder: true })}
      ${deroulant(`${ch}.cot`, plage(E, x.disc || "Bloc", P.depart[x.disc || "Bloc"], 3, 8), x.cot || "", "Cotation…")}
      ${deroulant(`${ch}.mesure`, MESURES_SEC, x.mesure || "differents")}${rangee("Seuil", pas(`${ch}.min`, x.min || 3, { min: 1, max: 50 }))}`)}
    <p class="petit">Une consigne « Objectif secondaire : … » est ajoutée à cette séance (sauf en décharge), avec son feu vert.</p>`;
}
function etapeObjectif(ctx, A, P, E) {
  const o = P.objectif, secs = P.secondaires || [], libres = Object.keys(SECONDAIRES).filter(t => t === "autre" || !secs.some(x => x.type === t));
  return h`${groupe("Objectif principal", h`${ligne(A, "disc", "Discipline", o.disc, () => puces("objectif.disc", ["Bloc", "Voie"], o.disc))}
      ${ligne(A, "cot", "Cotation à consolider", o.cot ? eq(ctx, o.disc, o.cot) : "à choisir", () => deroulant("objectif.cot", eqOptions(ctx, o.disc, plage(E, o.disc, P.depart[o.disc], 1, 6)), o.cot, "Cotation…"))}`)}
    ${alertes(alertesObjectif(P, E))}
    ${groupe("Objectifs secondaires", h`${secs.map((x, n) => { const S = SECONDAIRES[x.type];
        return ligne(A, `sec-${n}`, x.type === "autre" ? (x.titre || "Objectif à toi") : S.label, x.type === "autre" ? (ROLES_PERSO[x.ou || "volume"] || "").toLowerCase() : x.type === "gainage" ? `${x.niveau} s` : eq(ctx, S.disc, x.niveau), () => h`${x.type === "autre" ? cadreAutre(x, n, E, P)
          : x.type === "gainage" ? rangee("Planche visée", pas(`secondaires.${n}.niveau`, x.niveau, { min: 30, max: 300, d: 10, suffixe: " s" }))
          : h`<label class="champ">Niveau</label>${deroulant(`secondaires.${n}.niveau`, eqOptions(ctx, S.disc, plage(E, S.disc, x.niveau, 3, 4)), x.niveau)}`}
          ${si(x.type !== "autre", () => h`<p class="petit">Travaillé ${S.ou}. Feu vert : ${S.feu(x.niveau).map(c => libelleCritere(c) + (c.min != null ? ` ≥ ${c.min}` : "")).join(" · ")}.</p>`)}
          <button class="petit-btn danger" data-act="asSecRetirer" data-n="${n}">Retirer cet objectif</button>`); })}
      ${si(secs.length < 2, () => h`<div class="as-ajout-sec">${liste("", libres.map(t => [t, `${SECONDAIRES[t].label}${t !== "autre" ? ` · ${SECONDAIRES[t].ou}` : ""}`]), "", { act: "asSecAjouter", vide: "+ Ajouter un objectif secondaire…" })}</div>`)}
      ${si(!secs.length, h`<p class="petit">Aucun pour l'instant.</p>`)}`, "(2 au plus)")}
    ${groupe("Fil rouge", h`${deroulant("fil", Object.entries(FILS).map(([k, f]) => [k, f.label]), P.fil || "")}
      ${si(P.fil && FILS[P.fil], () => h`<p class="petit">${FILS[P.fil].pourquoi || ""}</p>`)}
      ${si(P.fil === "autre", () => { const fa = P.filAutre || {}, ou = fa.ou || ["volume"];
        return h`<div class="fiche-contenu as-cadre"><label class="champ">Ton fil rouge</label>${champTexte("filAutre.titre", fa.titre, "Respirer en grimpant, regarder les pieds…")}
          <label class="champ">Dans les séances</label><div class="choix as-puces">${Object.entries(ROLES_PERSO).map(([r, l]) => h`<button data-act="asFilOu" data-role="${r}" class="${ou.includes(r) ? "choisi" : ""}">${l}</button>`)}</div>
          <p class="petit">Une consigne « Fil rouge : … » dans ces séances (sauf en décharge), et une case à cocher dans Progrès.</p></div>`; })}`)}`;
}

// 3. Disponibilités
const DUREES_AUTRE = [20, 30, 45, 60, 75, 90, 120].map(m => [String(m), hm(m * 60)]);
function etapeJours(ctx, A, P) {
  const roles = Object.entries(ROLES).map(([k, r]) => [k, k === "dure" ? `Séance dure (${P.objectif.disc.toLowerCase()})` : r.label]), lab = k => (roles.find(r => r[0] === k) || [, "Repos"])[1];
  const valeur = j => { const r = P.jours[j] || "repos"; if (r === "repos") return "Repos"; const a = autreDe(P, j);
    return `${r === "autre" ? `${(P.joursAutre || {})[j] && P.joursAutre[j].nom ? a.nom : "Autre sport"} · ${a.intensite}` : lab(r).replace(/…$/, "")}${estBonus(P, j) ? " · bonus" : ""}`; };
  return h`${groupe("Semaine type", JOURS.map(j => ligne(A, `j-${j}`, j, valeur(j), () => { const r = P.jours[j] || "repos", a = autreDe(P, j);
      return h`${deroulant(`jours.${j}`, roles, r)}
        ${si(r === "autre", () => h`<label class="champ">Sport</label>${champTexte(`joursAutre.${j}.nom`, (P.joursAutre || {})[j] ? P.joursAutre[j].nom : "", "Vélo, natation, yoga…", 30)}
          <label class="champ">Durée</label>${deroulant(`joursAutre.${j}.duree`, DUREES_AUTRE, String(a.duree))}
          <label class="champ">Intensité</label>${puces(`joursAutre.${j}.intensite`, [["facile", "Facile"], ["soutenue", "Soutenue"]], a.intensite, { garder: true })}
          ${si(a.intensite === "soutenue", h`<p class="petit">Soutenue : elle compte dans les alertes de fatigue (veille ou lendemain de la séance dure, jours soutenus d'affilée).</p>`)}`)}
        ${si(r !== "repos", () => h`<label class="as-case"><input type="checkbox" ${estBonus(P, j) ? "checked" : ""} data-act="asBonus" data-jour="${j}"> Séance bonus <span class="petit">(jamais « manquée », hors avancement du bloc)</span></label>`)}`; })))}
    ${alertes(alertesJours(P))}
    ${groupe("Réglages", h`${ligne(A, "planB", "Sans partenaire, la voie devient", P.planB === "bloc" ? "du bloc modéré" : "rien", () => h`${puces("planB", [["bloc", "Bloc modéré (plan B)"], ["", "Rien (séance sautée)"]], P.planB)}<p class="petit">Le plan B est écrit dans chaque séance voie : tu choisis la version au moment de commencer.</p>`)}
      ${ligne(A, "dureeS", "Durée d'une séance en salle", hm(P.duree * 60), () => deroulant("duree", [60, 90, 120, 150, 180].map(m => [String(m), hm(m * 60)]), String(P.duree)))}`)}`;
}

// 4. Phases
function etapePhases(ctx, A, P) {
  const p0 = (P.premiere || 1) - 1, max = Math.max(100, ...P.semaines.map(s => s.charge));
  return h`<div class="carte as-groupe"><div class="as-graphe">${P.semaines.map((s, k) => h`<div class="as-barre ${k < p0 ? "passee" : ""}"><i class="ph-${s.type}" style="height:${Math.round(100 * s.charge / max)}%"></i><span>S${k + 1}</span></div>`)}</div>
      <p class="petit">Charge en % de la semaine la plus dure.</p></div>
    ${groupe("Semaines", P.semaines.map((s, k) => k < p0 ? h`<div class="fiche-ligne passee"><span>S${k + 1}</span><span class="val">déjà faite</span></div>`
      : ligne(A, `ph-${k}`, h`S${k + 1} <span class="petit">sem. ${P.debut + k - p0}</span>`, `${PHASES[s.type].label} · ${s.charge}`, () => h`${deroulant(`semaines.${k}.type`, ORDRE_PHASES.map(t => [t, PHASES[t].label]), s.type)}
        <p class="petit">${PHASES[s.type].pourquoi}</p>${rangee("Charge", pas(`semaines.${k}.charge`, s.charge, { min: 20, max: 150, d: 5 }))}`)))}
    ${alertes(alertesPhases(P))}`;
}

// 5. Séances
function etapeSeances(ctx, A, P, E) {
  const p0 = (P.premiere || 1) - 1, o = P.objectif, roles = new Set(Object.values(P.jours)), secs = (P.secondaires || []).map(x => x.type), voieTravail = (P.secondaires || []).find(x => x.type === "voie");
  const col = [roles.has("dure") && ["essais", `Essais ${o.cot || "?"}`, "essais", 30], roles.has("volume") && ["volume", "Volume (blocs)", "vol.", 40],
    roles.has("volume") && (secs.includes("devers") || secs.includes("dalle")) && ["devers", secs.includes("devers") && secs.includes("dalle") ? "Dévers et dalle" : secs.includes("dalle") ? "Dalle" : "Dévers", secs.includes("dalle") && !secs.includes("devers") ? "dalle" : "dév.", 12],
    roles.has("voie") && ["voies", `Voies en ${voieTravail ? voieTravail.niveau : crans(E, "Voie")[crans(E, "Voie").indexOf(P.depart.Voie.replace(/\+$/, "")) + 1] || ""}`, "voies", 8], roles.has("course") && ["course", "Course (min)", "min", 90]].filter(Boolean);
  const resume = s => col.slice(0, 2).map(([c, , court]) => `${s[c]} ${court}`).join(" · ");
  // Exercices
  const prop = exercicesProposes(P, E), X = P.exos || {}, types = Object.keys(TYPES_SEANCE).filter(t => prop[t] || (X.ajouts || {})[t]);
  const resumeExos = t => { const R = (X.retires || {})[t] || [], M = Object.keys((X.remplaces || {})[t] || {}).length, aj = ((X.ajouts || {})[t] || []).length, n = (prop[t] || []).length - R.length;
    return [`${n}`, aj && `+${aj}`, M && `${M} remplacé${M > 1 ? "s" : ""}`, R.length && `${R.length} retiré${R.length > 1 ? "s" : ""}`].filter(Boolean).join(" · "); };
  const exosType = t => { const R = (X.retires || {})[t] || [], M = (X.remplaces || {})[t] || {}, aj = (X.ajouts || {})[t] || [];
    return h`<div class="liste">${(prop[t] || []).map(nom => h`<div class="as-exo"><span>${R.includes(nom) ? h`<s>${nom}</s> <span class="petit">retiré</span>` : M[nom] ? h`<s>${nom}</s> → <b>${M[nom]}</b>` : nom}</span>
        <span class="as-exo-act">${R.includes(nom) || M[nom] ? h`<button class="petit-btn" data-act="asExoGarder" data-type="${t}" data-nom="${nom}">Rétablir</button>` : h`<button class="petit-btn" data-act="asExoFenetre" data-mode="remplacer" data-type="${t}" data-nom="${nom}">Remplacer</button><button class="petit-btn danger" data-act="asExoRetirer" data-type="${t}" data-nom="${nom}">Retirer</button>`}</span></div>`)}
      ${aj.map((a, n) => h`<div class="as-exo ajout"><span>+ ${ligneAjout(a).replace(/\s*\{[^}]*\}/g, "").replace(/[«»]/g, "").replace(/\s+/g, " ")}${a.phase ? h` <span class="petit">(${PHASES[a.phase].label} seulement)</span>` : ""}</span><span class="as-exo-act"><button class="petit-btn danger" data-act="asExoAjoutRetirer" data-type="${t}" data-n="${n}">Retirer</button></span></div>`)}</div>
      <button class="petit-btn btn-ajout" data-act="asExoFenetre" data-mode="ajout" data-type="${t}">+ Ajouter un exercice</button>`; };
  const devers = secs.includes("devers"), bloc = genererBloc(P, E), wA = Math.max(A.apercu, p0), duJour = bloc.seances.filter(s => s.semaine === P.debut + wA - p0);
  return h`${alertes(doublons(bloc))}<p class="as-note">Ces chiffres viennent de ton profil (${PROFILS[P.profil].label}) et de la phase de la semaine, pas de ta cotation : ils montent en Construction, baissent en Respiration et en Décharge. Touche une semaine pour voir le détail et les fourchettes conseillées.</p>${groupe("Chiffres par semaine", P.semaines.map((s, k) => k < p0 ? "" : ligne(A, `sem-${k}`, h`<b>S${k + 1}</b> <span class="petit">${PHASES[s.type].label}</span>`, resume(s), () => col.map(([c, l, , mx]) => { const f = fourchette(P, k, c), pr = proposeSemaine(P, k, c), hors = f && (s[c] < f[0] || s[c] > f[1]);
        return h`<div class="as-chiffre">${rangee(l, pas(`semaines.${k}.${c}`, s[c], { max: mx }))}<p class="petit">${OU_CHIFFRE[c]} · proposé : ${pr ?? "—"}${f ? ` · conseillé en ${PHASES[s.type].label.toLowerCase()} : ${f[0] === f[1] ? f[0] : `${f[0]} à ${f[1]}`}` : ""}</p>${si(hors, h`<div class="avert">Hors de la fourchette conseillée : c'est possible, mais surveille la fatigue et les doigts.</div>`)}</div>`; })))
      , "un appui pour régler")}
    ${groupe("Exercices", types.map(t => ligne(A, `ex-${t}`, TYPES_SEANCE[t], resumeExos(t), () => exosType(t))))}
    ${groupe("Consignes de la semaine", h`${P.semaines.map((s, k) => k < p0 ? "" : ligneFenetre(h`S${k + 1} <span class="petit">${PHASES[s.type].label}</span>`, consigne(P, k), "asExoFenetre", { mode: "consigne", k }))}
      <div class="as-boutons"><button class="petit-btn" data-act="asThemes">Proposer des thèmes nouveaux</button>${si((P.consignes || []).some(Boolean), h`<button class="petit-btn" data-act="asConsignesDefaut">Rétablir</button>`)}</div>
      <p class="petit">Le fil technique de la semaine : volume, voie et plan B.</p>`)}
    ${si(devers, () => groupe("Consignes dévers", P.semaines.map((s, k) => k < p0 ? "" : ligneFenetre(h`S${k + 1}`, consigneDevers(P, k), "asExoFenetre", { mode: "consigneDevers", k })), "au volume"))}
    ${groupe("Aperçu des séances", h`${puces("apercu", P.semaines.map((s, k) => k < p0 ? null : [String(k), `S${k + 1}`]).filter(Boolean), String(wA), { num: true, garder: true })}
      ${duJour.map(s => h`<details class="as-apercu"><summary><b>${s.jour}</b> · ${s.activite}${s.bonus ? " (bonus)" : ""}</summary><pre class="code">${s.contenu}</pre></details>`)}
      <p class="petit">Après la création, chaque séance se modifie comme les autres (⋯ › Modifier le plan).</p>`)}`;
}

const OU_CHIFFRE = { essais: "Essais sur l'objectif, à la séance dure", volume: "Nombre de blocs au volume (sous ton objectif)", devers: "Blocs en dévers ou en dalle, au volume", voies: "Voies un cran au-dessus de ton niveau, à la séance voie", course: "Minutes de course (bonus)" };
// 6. Feux verts
const ROLES_FEU = { objectif: "objectif", secondaire: "secondaire", fil: "fil rouge", garde: "garde-fou", libre: "à toi" };
const CONSEIL_CRITERE = {
  essais: "Essais : les échecs comptent aussi, ils montrent que tu t'es mesuré au niveau.",
  taux: "70 % : le seuil d'un niveau consolidé (7 réussites sur 10).",
  differents: "Plusieurs blocs ou voies différents : on ne valide pas un niveau sur un seul passage travaillé.",
  coche: "Case à cocher dans Progrès, quand c'est fait pour de vrai.",
  douleur: "Le garde-fou passe avant tout : au-delà, on allège et on consulte si ça dure.",
  memeJour: "Le même jour : c'est l'endurance qui est mesurée.", avue: "À vue ou flash : réussi au premier essai, sans répétition.", mesure: "Mesuré dans la routine (planche, etc.).",
};
// Seuils peu cohérents ou irréalistes : des conseils, rien n'est bloqué
function alertesSeuils(feux, P, E) {
  const a = [], bloc = genererBloc(P, E), prevus = {};
  for (const s of bloc.seances) for (const l of lignesDe(s.contenu.split("\n## Remplacement")[0])) if (l.type === "action" && l.grimpe && l.grimpe.cot) { const k = `${l.grimpe.disc}|${l.grimpe.cot}`; prevus[k] = (prevus[k] || 0) + l.n; }
  for (const f of feux) { const c = t => f.criteres.find(x => x.type === t), e = c("essais"), d = c("differents"), t = c("taux");
    if (e && d && e.min < d.min) a.push(`${f.titre} : moins d'essais exigés (${e.min}) que de ${e.disc === "Voie" ? "voies" : "blocs"} différents (${d.min}).`);
    if (e && prevus[`${e.disc}|${e.cot}`] != null && e.min > prevus[`${e.disc}|${e.cot}`]) a.push(`${f.titre} : ${e.min} essais exigés, mais le plan n'en prévoit que ${prevus[`${e.disc}|${e.cot}`]} en ${e.cot}.`);
    if (t && t.min > 90) a.push(`${f.titre} : ${t.min} % de réussite, c'est très exigeant ; 70 % suffit pour dire « consolidé ».`);
    if (d && d.min > 6 && P.profil === "debutant") a.push(`${f.titre} : ${d.min} différents en un bloc d'entraînement, c'est beaucoup pour un débutant.`); }
  return a;
}
function etapeFeux(ctx, A, P) {
  const E = ctx.data.echelles;
  const feux = P.feux || feuxParDefaut(P);
  return h`${feux.map((f, n) => h`<div class="carte as-groupe"><div class="as-feu-tete"><h3 class="as-sous">${f.titre}</h3><span class="petit">${ROLES_FEU[f.role] || ""}</span></div>
      ${f.criteres.map((c, m) => c.type === "coche" ? h`<div class="fiche-ligne"><span>${c.label}</span><span class="val">à cocher dans Progrès</span></div>`
        : c.type === "douleur" ? ligne(A, `fc-${n}-${m}`, libelleCritere(c), `≤ ${c.max ?? 2}/10`, () => rangee("Douleur maximale", pas(`feux.${n}.criteres.${m}.max`, c.max ?? 2, { max: 10, suffixe: "/10" })))
        : ligne(A, `fc-${n}-${m}`, c.label || libelleCritere(c), `≥ ${c.min ?? 0}${c.type === "taux" ? " %" : c.type === "mesure" ? " s" : ""}`, () => rangee("Seuil", pas(`feux.${n}.criteres.${m}.min`, c.min ?? 0, { max: c.type === "taux" ? 100 : c.type === "mesure" ? 600 : 50, d: c.type === "taux" ? 5 : c.type === "mesure" ? 10 : 1, suffixe: c.type === "taux" ? " %" : "" }))))}
      <p class="petit as-conseil-feu">${[...new Set(f.criteres.map(c => CONSEIL_CRITERE[c.type]).filter(Boolean))].join(" ")}</p>
      <button class="petit-btn danger as-retirer" data-act="asFeuRetirer" data-n="${n}">Retirer ce feu</button></div>`)}
    <div class="as-boutons"><button class="petit-btn btn-ajout" data-act="asFeuFenetre">+ Ajouter un feu vert</button>${si(P.feux, h`<button class="petit-btn" data-act="asFeuxDefaut">Rétablir les feux proposés</button>`)}</div>
    ${alertes([...alertesFeux(feux), ...alertesSeuils(feux, P, E)])}
    <p class="petit">Comptés depuis le début du bloc. Garde-fou : douleur maximale notée sur les 4 dernières semaines.</p>`;
}

// 7. Récapitulatif
function etapeRecap(ctx, A, P, E) {
  const bloc = genererBloc(P, E), fin = bloc.debut + bloc.nb - 1, autres = (ctx.doc.blocs || []).filter(b => b.id !== P.id);
  const chevauche = autres.filter(b => !(finBloc(b) < bloc.debut || b.debut > fin));
  const avant = programmeEffectif(ctx.data, { ...ctx.doc, blocs: autres }), apres = programmeEffectif(ctx.data, { ...ctx.doc, blocs: [...autres.filter(b => !chevauche.includes(b)), bloc] });
  const regl = ctx.doc.reglages, mesure = (Pg, w) => { const l = Pg.filter(s => s.semaine === w && !s.bonus);
    return { n: l.length, min: Math.round(l.reduce((t, s) => t + dureeSeance(s, etapesSeance(s, {}), ctx.data, regl), 0) / 60),
      essais: l.reduce((t, s) => t + lignesDe(s.contenu.split("\n## ")[0]).filter(e => e.type === "action" && e.grimpe && e.grimpe.cot === P.objectif.cot && e.grimpe.disc === P.objectif.disc).reduce((x, e) => x + e.n, 0), 0) }; };
  const toutes = [...alertesObjectif(P, E), ...alertesJours(P), ...alertesPhases(P), ...alertesFeux(bloc.feux), ...doublons(bloc)];
  const lignes = []; for (let w = bloc.debut; w <= fin; w++) lignes.push({ w, a: mesure(avant, w), b: mesure(apres, w), ph: (bloc.seances.find(s => s.semaine === w) || {}).phase || "" });
  const compare = lignes.some(x => x.a.n > 0), cel = (a, b, f = x => x) => compare && a !== undefined ? h`${f(a)} → <b>${f(b)}</b>` : h`<b>${f(b)}</b>`;
  const secs = (P.secondaires || []).map(x => SECONDAIRES[x.type].titre(x.niveau));
  return h`<div class="carte as-groupe"><h3 class="as-sous">${bloc.nom} · ${bloc.titre}</h3>
      <p class="petit">Semaines ${bloc.debut} → ${fin} · ${bloc.remplace ? "remplace ce qui était prévu (les séances commencées ou faites restent)" : "ajouté au programme"}</p>
      <p class="petit">Objectif ${P.objectif.disc.toLowerCase()} ${eq(ctx, P.objectif.disc, P.objectif.cot)}${secs.length ? ` · ${secs.join(" · ")}` : ""}${P.fil ? ` · fil rouge : ${FILS[P.fil].label.toLowerCase()}` : ""} · ${PROFILS[P.profil].label}</p>
      <p class="petit">${JOURS.filter(j => P.jours[j] && P.jours[j] !== "repos").map(j => `${j.slice(0, 3)}. ${ROLES[P.jours[j]].label.toLowerCase()}`).join(" · ")}</p></div>
    ${si(chevauche.length, () => h`<div class="avert">${chevauche.map(b => `${b.nom} · ${b.titre}`).join(", ")} couvre déjà ces semaines : il sera retiré.</div>`)}
    <div class="carte as-groupe"><table class="tableau as-table"><tr><th>Sem.</th><th>Séances</th><th>Temps</th><th>Essais ${P.objectif.cot}</th></tr>
      ${lignes.map(x => h`<tr><td>${x.w}<br><span class="petit">${x.ph.replace(/^[^·]*·\s*/, "")}</span></td><td>${cel(x.a.n, x.b.n)}</td><td>${cel(x.a.min, x.b.min, hmc)}</td><td>${cel(x.a.essais, x.b.essais)}</td></tr>`)}</table>
      <p class="petit">${compare ? "Avant → après, sans" : "Sans"} les séances bonus (course, prévention). Le temps est estimé d'après les repos et les routines.</p></div>
    <div class="carte as-groupe"><h3 class="as-sous">Feux verts</h3><ul class="as-liste">${bloc.feux.map(f => h`<li>${f.titre} : ${f.criteres.map(c => c.type === "coche" ? c.label : `${c.label || libelleCritere(c)}${c.type === "douleur" ? ` ≤ ${c.max ?? 2}/10` : ` ≥ ${c.min}${c.type === "taux" ? " %" : c.type === "mesure" ? " s" : ""}`}`).join(" · ")}</li>`)}</ul></div>
    ${si(toutes.length, () => h`<details class="as-apercu"><summary>${toutes.length} conseil${toutes.length > 1 ? "s" : ""} non suivi${toutes.length > 1 ? "s" : ""}</summary>${alertes(toutes)}</details>`)}`;
}

// --- Fenêtre « exercice » : ajouter, remplacer, choisir une consigne (recherche + filtres, comme la Bibliothèque) ---
const famille = cat => { const i = FAMILLES.findIndex(([, l]) => l.includes(cat)); return i < 0 ? "Autres" : NOMS_FAMILLES[i]; };
const TITRES_FENETRE = { ajout: t => `Ajouter un exercice · ${TYPES_SEANCE[t]}`, remplacer: (t, M) => `Remplacer « ${M.nom} »`, consigne: (t, M) => `Consigne de la semaine S${+M.k + 1}`, consigneDevers: (t, M) => `Consigne dévers · S${+M.k + 1}` };
function listeExos(ctx, M) {
  const q = sansAccent(M.q || "").trim(), l = ctx.data.exercices.filter(e => (!M.fam || famille(e.categorie) === M.fam) && (!M.niv || e.niveau === M.niv) && (!q || sansAccent(`${e.nom} ${e.categorie} ${e.but || ""}`).includes(q)));
  if (!l.length) return h`<p class="petit">Aucun exercice ne correspond.</p>`;
  return h`${l.slice(0, 60).map(e => h`<button class="item as-exo-choix ${M.choix === e.nom ? "choisi" : ""}" data-act="asExoChoisir" data-nom="${e.nom}"><span><b>${e.nom}</b><br><span class="petit">${e.categorie}${e.but ? ` · ${e.but}` : ""}</span></span><span class="petit">${M.choix === e.nom ? "✓" : e.niveau || ""}</span></button>`)}`;
}
function fenetreExo(ctx) {
  const M = ctx.state.modal, ajout = M.mode === "ajout";
  return h`<h2>${TITRES_FENETRE[M.mode](M.t, M)}</h2>
    <input type="search" class="recherche" placeholder="Rechercher un exercice…" value="${M.q || ""}" data-frappe="asExoRecherche" aria-label="Rechercher">
    <div class="barre-filtres">${liste("fam", NOMS_FAMILLES.map(f => [f, f]), M.fam || "", { act: "asExoFiltre", vide: "Toutes les familles" })}${liste("niv", ["Débutant", "Intermédiaire", "Avancé"], M.niv || "", { act: "asExoFiltre", vide: "Tous niveaux" })}</div>
    <div class="liste as-exo-liste" id="as-exo-liste">${listeExos(ctx, M)}</div>
    ${si(ajout, () => h`<div class="fiche-contenu as-cadre">${rangee("Fois", h`<span class="as-pas"><button data-act="asM" data-k="n" data-valeur="${Math.max(1, (M.n || 1) - 1)}">−</button><b>${M.n || 1}</b><button data-act="asM" data-k="n" data-valeur="${Math.min(20, (M.n || 1) + 1)}">+</button></span>`)}
      <label class="champ">Quand</label><div class="choix as-puces">${[["", "Toutes les semaines"], ...ORDRE_PHASES.map(x => [x, PHASES[x].label])].map(([v, l]) => h`<button data-act="asM" data-k="phase" data-valeur="${v}" class="${(M.phase || "") === v ? "choisi" : ""}">${l}</button>`)}</div>
      <label class="champ">Type</label><div class="choix as-puces">${[["", "Facile"], ["1", "Effort"]].map(([v, l]) => h`<button data-act="asM" data-k="effort" data-valeur="${v}" class="${(M.effort ? "1" : "") === v ? "choisi" : ""}">${l}</button>`)}</div>
      <label class="champ">Durée de chaque fois</label>${rangee("Minutes", h`<span class="as-pas"><button data-act="asM" data-k="duree" data-valeur="${Math.max(0, (+M.duree || 0) - 1)}">−</button><b>${+M.duree > 0 ? `${M.duree} min` : "—"}</b><button data-act="asM" data-k="duree" data-valeur="${Math.min(60, (+M.duree || 0) + 1)}">+</button></span>`)}
      <label class="champ">Précision</label><input type="text" class="as-texte" data-champ="detail" value="${M.detail || ""}" placeholder="3 essais, contrôlé" maxlength="60"></div>
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="asExoValider">Ajouter</button></div>`)}
    ${si(!ajout, () => h`<div class="actions"><button data-act="mFermer">Annuler</button></div>`)}`;
}
// --- Fenêtre « feu vert » libre ---
const MESURES_FEU = [["differents", "Réussis différents"], ["essais", "Essais"], ["taux", "Réussite %"], ["avue", "À vue ou flash"]];
function fenetreFeu(ctx) {
  const M = ctx.state.modal, E = ctx.data.echelles, P = ctx.state.assistant.plan, puce = (k, opts) => h`<div class="choix as-puces">${opts.map(([v, l]) => h`<button data-act="asM" data-k="${k}" data-valeur="${v}" class="${String(M[k] ?? "") === v ? "choisi" : ""}">${l}</button>`)}</div>`;
  return h`<h2>Ajouter un feu vert</h2>
    ${puce("sorte", [["seuil", "Seuil sur tes passages"], ["coche", "Case à cocher"]])}
    <label class="champ">Titre</label><input type="text" class="as-texte" data-champ="titre" value="${M.titre || ""}" placeholder="${M.sorte === "coche" ? "Cours de tête" : "Voie 5c"}" maxlength="40">
    ${M.sorte === "coche" ? h`<label class="champ">À cocher quand…</label><input type="text" class="as-texte" data-champ="label" value="${M.label || ""}" placeholder="le cours est fait" maxlength="80">`
      : h`<label class="champ">Discipline</label>${puce("disc", [["Bloc", "Bloc"], ["Voie", "Voie"]])}
        ${liste("cot", plage(E, M.disc, P.depart[M.disc], 3, 8), M.cot, { act: "asExoFiltre", vide: "Cotation…", label: "Cotation" })}
        <label class="champ">Mesure</label>${puce("mesure", MESURES_FEU)}
        <label class="champ">Inclinaison</label>${puce("profil", [["", "Toutes"], ["vertical", "Vertical"], ["devers", "Dévers"], ["dalle", "Dalle"]])}
        ${rangee("Seuil", h`<span class="as-pas"><button data-act="asM" data-k="min" data-valeur="${Math.max(1, (M.min || 1) - (M.mesure === "taux" ? 5 : 1))}">−</button><b>${M.min || 1}${M.mesure === "taux" ? " %" : ""}</b><button data-act="asM" data-k="min" data-valeur="${Math.min(M.mesure === "taux" ? 100 : 50, (M.min || 1) + (M.mesure === "taux" ? 5 : 1))}">+</button></span>`)}`}
    <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="asFeuValider">Ajouter</button></div>`;
}

// --- Actions ---
const fixer = (o, chemin, v) => { const k = chemin.split("."); let x = o; for (let i = 0; i < k.length - 1; i++) { if (x[k[i]] == null) x[k[i]] = /^\d+$/.test(k[i + 1]) ? [] : {}; x = x[k[i]]; } x[k[k.length - 1]] = v; };
const lire = (o, chemin) => chemin.split(".").reduce((x, k) => x == null ? x : x[k], o);
const feuxDe = P => { P.feux = P.feux || feuxParDefaut(P); P.feuxModifies = true; return P.feux; };
function appliquer(ctx, A, c, v) {
  if (/^joursAutre\.\w+\.nom$/.test(c)) v = String(v || "").replace(/\s+/g, " ").trim();
  if (c === "supposeReussi") { const P = A.plan, src = (ctx.doc.blocs || []).find(b => `suite:${b.id}` === P.modele); if (!src) return;
    const garde = { nom: P.nom, titre: P.titre, debut: P.debut, remplace: P.remplace, profil: P.profil, duree: P.duree, premiere: P.premiere };
    A.plan = { ...planSuite(ctx, src, !!v), ...Object.fromEntries(Object.entries(garde).filter(([, x]) => x !== undefined)) }; return; }
  const P = A.plan;
  if (c === "apercu") A.apercu = +v;
  else if (c === "quand") { P.remplace = v !== "apres"; P.debut = v === "apres" ? derniereSemaine(ctx) + 1 : +v; P.nom = nomPour(ctx, P.debut, P.remplace); }
  else if (c === "premiere") { P.premiere = +v; A.apercu = Math.max(A.apercu, +v - 1); }
  else if (c === "nbSemaines") { P.semaines = semainesParDefaut(P.profil, +v); P.consignes = null; P.consignesDevers = null; P.premiere = Math.min(P.premiere || 1, P.semaines.length - 1); A.apercu = (P.premiere || 1) - 1; }
  else if (c === "profil") { const types = P.semaines.map(s => s.type); P.profil = v; P.semaines = semainesParDefaut(v, types.length).map((s, k) => ({ ...s, type: types[k] || s.type })); }
  else if (c === "objectif.disc") { P.objectif = { disc: v, cot: "" }; }
  else if (c === "nom") P.nom = String(v).trim() || P.nom;
  else if (/^jours\.[^.]+$/.test(c) && v === "autre") { fixer(P, c, v); const j = c.split(".")[1]; P.joursAutre = P.joursAutre || {}; P.joursAutre[j] = { nom: "", duree: 45, intensite: "facile", ...(P.joursAutre[j] || {}) }; }
  else if (/^secondaires\.\d+\.disc$/.test(c)) { fixer(P, c, v); fixer(P, c.replace(/disc$/, "cot"), ""); }
  else { if (c.startsWith("feux.")) feuxDe(P); fixer(P, c, /(^duree|\.duree|\.min|\.charge)$/.test(c) ? +v : v); }
  if (/^(objectif|secondaires|fil|depart)/.test(c) && !P.feuxModifies) P.feux = null;
}
export const actions = {
  asAller: (ctx, d) => { const A = ctx.state.assistant; A.etape = +d.k; A.pourquoi = false; A.section = null; ctx.rendre(true); },
  asPourquoi: ctx => { ctx.state.assistant.pourquoi = !ctx.state.assistant.pourquoi; ctx.rendre(); },
  asSection: (ctx, d) => { const A = ctx.state.assistant; A.section = A.section === d.k ? null : d.k; ctx.rendre();
    const t = document.querySelector(`#ecran [data-act=asSection][data-k="${CSS.escape(d.k)}"]`); if (t && A.section) ctx.montrer(t.nextElementSibling || t); },
  asQuitter: ctx => { ctx.state.assistant = null; ctx.ouvrir("programme"); },
  asModele: (ctx, d) => { const A = ctx.state.assistant;
    if (d.id && d.id.startsWith("suite:")) A.plan = planSuite(ctx, ctx.doc.blocs.find(b => b.id === d.id.slice(6)));
    else if (d.id) A.plan = modele(d.id).plan(); else { const der = derniereSemaine(ctx); A.plan = planVide({ nom: nomPour(ctx, der + 1, false), debut: der + 1, depart: A.plan.depart }); }
    A.apercu = (A.plan.premiere || 1) - 1; A.section = null; ctx.rendre(); },
  asValeur: (ctx, d) => { const A = ctx.state.assistant; appliquer(ctx, A, d.chemin, d.num ? +d.valeur : d.valeur); if (!d.garder) A.section = null; ctx.rendre(); },
  asChamp: (ctx, d, el) => { const A = ctx.state.assistant; appliquer(ctx, A, d.chemin, el.value); ctx.rendre(); },
  asPas: (ctx, d) => { const A = ctx.state.assistant, P = A.plan; if (d.chemin.startsWith("feux.")) feuxDe(P);
    const v = Math.max(+d.min, Math.min(+d.max, (+lire(P, d.chemin) || 0) + +d.d)); appliquer(ctx, A, d.chemin, v); ctx.rendre(); },
  asSecAjouter: (ctx, d, el) => { const A = ctx.state.assistant, P = A.plan, type = d.type || (el && el.value); if (!type) return;
    P.secondaires = [...(P.secondaires || []), type === "autre" ? { type, titre: "", ou: "volume", valid: "coche", disc: "Bloc", cot: "", mesure: "differents", min: 3 } : { type, niveau: niveauSecondaire(P, type, ctx.data.echelles) }].slice(0, 2);
    if (!P.feuxModifies) P.feux = null; A.section = `sec-${P.secondaires.length - 1}`; ctx.rendre(); },
  asFilOu: (ctx, d) => { const P = ctx.state.assistant.plan; P.filAutre = P.filAutre || { titre: "", ou: ["volume"] }; const ou = new Set(P.filAutre.ou || ["volume"]);
    if (ou.has(d.role)) ou.delete(d.role); else ou.add(d.role); P.filAutre.ou = [...ou]; ctx.rendre(); },
  asBonus: (ctx, d, el) => { const P = ctx.state.assistant.plan; P.bonus = { ...(P.bonus || {}), [d.jour]: !!el.checked }; ctx.rendre(); },
  asSecRetirer: (ctx, d) => { const A = ctx.state.assistant, P = A.plan; P.secondaires = P.secondaires.filter((_, n) => n !== +d.n); if (!P.feuxModifies) P.feux = null; A.section = null; ctx.rendre(); },
  // Exercices
  asExoRetirer: (ctx, d) => { const X = ctx.state.assistant.plan.exos = ctx.state.assistant.plan.exos || {}; X.retires = X.retires || {}; X.retires[d.type] = [...new Set([...(X.retires[d.type] || []), d.nom])]; ctx.rendre(); },
  asExoGarder: (ctx, d) => { const X = ctx.state.assistant.plan.exos || {}; if (X.retires && X.retires[d.type]) X.retires[d.type] = X.retires[d.type].filter(x => x !== d.nom); if (X.remplaces && X.remplaces[d.type]) delete X.remplaces[d.type][d.nom]; ctx.rendre(); },
  asExoAjoutRetirer: (ctx, d) => { const X = ctx.state.assistant.plan.exos; X.ajouts[d.type] = X.ajouts[d.type].filter((_, n) => n !== +d.n); ctx.rendre(); },
  asExoFenetre: (ctx, d) => ctx.ouvrirModal({ type: "externe", rendu: fenetreExo, mode: d.mode, t: d.type, nom: d.nom, k: d.k, q: "", fam: d.mode === "consigne" || d.mode === "consigneDevers" ? "Technique" : "", niv: "", choix: "", n: 1, phase: "", detail: "", effort: false }),
  asExoRecherche: (ctx, d, el) => { const M = ctx.state.modal; M.q = el.value; const z = document.getElementById("as-exo-liste"); if (z) z.innerHTML = String(listeExos(ctx, M)); },
  asExoFiltre: (ctx, d, el) => { ctx.state.modal[d.champ] = el.value; ctx.rendre(); },
  asM: (ctx, d) => { const M = ctx.state.modal; M[d.k] = d.k === "n" || d.k === "min" ? +d.valeur : d.k === "effort" ? !!d.valeur : d.valeur;
    if (d.k === "disc") M.cot = ""; if (d.k === "mesure") M.min = d.valeur === "taux" ? 70 : 5; ctx.rendre(); },
  asExoChoisir: (ctx, d) => { const M = ctx.state.modal, A = ctx.state.assistant, P = A.plan;
    if (M.mode === "ajout") { M.choix = d.nom; const f = ctx.data.exercices.find(e => e.nom === d.nom); M.duree = f && +f.duree > 0 ? +f.duree : ""; ctx.rendre(); return; }
    if (M.mode === "remplacer") { const X = P.exos = P.exos || {}; X.remplaces = X.remplaces || {}; X.remplaces[M.t] = { ...(X.remplaces[M.t] || {}), [M.nom]: d.nom }; }
    if (M.mode === "consigne") { P.consignes = P.consignes || []; P.consignes[+M.k] = d.nom; }
    if (M.mode === "consigneDevers") { P.consignesDevers = P.consignesDevers || []; P.consignesDevers[+M.k] = d.nom; }
    ctx.fermerModal(); },
  asExoValider: ctx => { const M = ctx.state.modal, P = ctx.state.assistant.plan; if (!M.choix) { ctx.toast("Choisis d'abord un exercice dans la liste"); return; }
    const X = P.exos = P.exos || {}; X.ajouts = X.ajouts || {}; X.ajouts[M.t] = [...(X.ajouts[M.t] || []), { nom: M.choix, n: M.n || 1, detail: (M.detail || "").trim(), phase: M.phase || "", effort: !!M.effort, ...(+M.duree > 0 ? { duree: +M.duree } : {}) }];
    ctx.state.assistant.section = `ex-${M.t}`; ctx.fermerModal(); },
  asThemes: ctx => { const P = ctx.state.assistant.plan, autres = (ctx.doc.blocs || []).filter(b => b.id !== P.id && b.plan).map(b => normaliser(b.plan));
    P.consignes = themesNouveaux(P, ctx.data.exercices, autres.flatMap(q => q.semaines.map((_, k) => consigne(q, k))));
    if ((P.secondaires || []).some(x => x.type === "devers")) P.consignesDevers = themesDevers(P, ctx.data.exercices, autres.flatMap(q => q.semaines.map((_, k) => consigneDevers(q, k))));
    ctx.rendre(); ctx.toast("Thèmes proposés : touche une semaine pour en changer"); },
  asConsignesDefaut: ctx => { ctx.state.assistant.plan.consignes = null; ctx.rendre(); },
  // Feux
  asFeuRetirer: (ctx, d) => { const P = ctx.state.assistant.plan; P.feux = feuxDe(P).filter((_, n) => n !== +d.n); ctx.state.assistant.section = null; ctx.rendre(); },
  asFeuxDefaut: ctx => { const P = ctx.state.assistant.plan; P.feux = null; P.feuxModifies = false; ctx.rendre(); },
  asFeuFenetre: ctx => { ctx.ouvrirModal({ type: "externe", rendu: fenetreFeu, sorte: "seuil", titre: "", label: "", disc: "Voie", cot: "", mesure: "differents", profil: "", min: 3, champ: null }); },
  asFeuValider: ctx => { const M = ctx.state.modal, P = ctx.state.assistant.plan;
    if (M.sorte === "seuil" && !M.cot) { ctx.toast("Choisis une cotation"); return; }
    const c = M.sorte === "coche" ? { type: "coche", label: (M.label || M.titre || "Fait").trim() } : { type: M.mesure, disc: M.disc, cot: M.cot, profil: M.profil || undefined, min: M.min || 1 };
    const titre = (M.titre || "").trim() || (M.sorte === "coche" ? c.label : `${M.disc} ${M.cot}`);
    const feux = feuxDe(P), g = feux.findIndex(f => f.role === "garde"), nouveau = { id: `libre-${Date.now().toString(36)}`, role: "libre", titre, criteres: [c] };
    if (g < 0) feux.push(nouveau); else feux.splice(g, 0, nouveau);                 // le garde-fou reste en dernier
    ctx.fermerModal(); },
  asCreer: ctx => { const A = ctx.state.assistant, P = A.plan, bloc = genererBloc(P, ctx.data.echelles), ancien = (ctx.doc.blocs || []).find(b => b.id === P.id);
    if (ancien) bloc.coches = { ...(ancien.coches || {}) };
    const fin = bloc.debut + bloc.nb - 1;
    ctx.modifier(A.edition ? `bloc ${bloc.nom} modifié` : `bloc ${bloc.nom} créé`, d => { d.blocs = (d.blocs || []).filter(b => b.id !== bloc.id && (finBloc(b) < bloc.debut || b.debut > fin)); d.blocs.push(bloc); });
    ctx.state.assistant = null; forcerOuvert(`prog-bloc-${bloc.nom}`);
    const w = ctx.state.semaineVue; ctx.state.semaineVue = w >= bloc.debut && w <= fin ? w : bloc.debut;
    ctx.ouvrir("programme"); ctx.toast(`${bloc.nom} · ${bloc.titre} : ${A.edition ? "enregistré" : "créé"}`, () => ctx.agir("annuler")); },
};
