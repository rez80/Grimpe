// ecrans/assistant.js — « Construire un bloc » : 7 étapes, chargé seulement quand on l'ouvre.
// Les alertes sont des conseils : rien n'est jamais bloqué, « Suivant » reste toujours possible. C'est le grimpeur qui décide.
import { h, si, liste, choix, forcerOuvert } from "../html.js";
import { JOURS, semaineDe, dateSeance, jourMois, hm } from "../dates.js";
import { programmeEffectif, etapesSeance, dureeSeance } from "../programme.js";
import { lignesDe } from "../parseur.js";
import { libelleCritere, finBloc } from "../blocs.js";
import { PHASES, ORDRE_PHASES, ROLES, PROFILS, MODELES, modele, planVide, semainesParDefaut, feuxParDefaut, genererBloc, libellesPhases, crans,
  TYPES_SEANCE, DUREES, exercicesProposes, consigne, consigneDefaut, ligneAjout,
  alertesObjectif, alertesJours, alertesPhases, alertesFeux } from "../plan.js";

const ETAPES = ["Départ", "Objectif", "Disponibilités", "Phases", "Séances", "Feux verts", "Récapitulatif"];
const POURQUOI = [
  "On part de ce que tu réussis déjà de façon régulière (niveau consolidé), pas de ton meilleur jour. L'app le propose d'après tes passages ; corrige-le si tu sais mieux.",
  "Un seul objectif, mesurable : c'est lui qui décide du contenu de la séance dure. La règle habituelle est un cran au-dessus du niveau consolidé par bloc. Un objectif secondaire et un fil rouge (peur, technique) restent légers.",
  "Une seule séance dure par semaine suffit pour progresser au début. Les doigts (tendons, poulies) récupèrent en 48 h : pas de séance en salle la veille ni le lendemain de la séance dure. Les séances bonus ne comptent pas comme manquées.",
  "Trois réglages font monter la charge : le nombre d'essais, le volume, la difficulté. Pas plus de 10 points d'une semaine à l'autre, une semaine de respiration au milieu, et une décharge à la fin : on progresse pendant la récupération.",
  "Chaque séance suit le même squelette : échauffement, contrôle des doigts, pyramide, partie principale, règles d'arrêt, retour au calme. Les chiffres ci-dessous sont des cibles, pas des obligations.",
  "Un feu vert dit quand l'objectif est atteint, avec tes passages : nombre d'essais, taux de réussite, cotations différentes. Le garde-fou douleur passe avant tout.",
  "Relis, compare avec ce qui était prévu, puis crée le bloc. Tu pourras le modifier ou le retirer depuis les Options du Programme ; « Annuler » le défait aussitôt.",
];

// --- Démarrer l'assistant ---
export function initial(ctx, d = {}) {
  const { doc, data } = ctx, debutProg = doc.reglages.dateDebut || data.dateDebut, wNow = Math.max(1, semaineDe(debutProg, ctx.aujourdhui()));
  const B = ctx.bilan, c = B.consolides || {}, depart = { Voie: (c["Voie-Vertical"] || {}).niveau || "5a", Bloc: (c["Bloc-Vertical"] || {}).niveau || "4" };
  const existant = d.bloc && (doc.blocs || []).find(b => b.id === d.bloc);
  let plan, etape = 0;
  if (existant && existant.plan) { plan = JSON.parse(JSON.stringify(existant.plan)); plan.id = existant.id; }
  else if (d.modele && modele(d.modele)) { plan = modele(d.modele).plan(); etape = d.recap ? 6 : 0; }
  else { const der = derniereSemaine(ctx); plan = planVide({ nom: nomPour(ctx, der + 1, false), debut: der + 1, depart }); plan.titre = ""; }
  return { etape, plan, apercu: (plan.premiere || 1) - 1, pourquoi: false, wNow, edition: !!existant };
}
const derniereSemaine = ctx => Math.max(0, ...programmeEffectif(ctx.data, { ...ctx.doc, blocs: [] }).map(s => s.semaine), ...(ctx.doc.blocs || []).map(finBloc));
function nomPour(ctx, w, remplace) {
  const P = ctx.programme, ph = remplace && (P.find(s => s.semaine === w) || {}).phase; if (ph && /^B\d+/.test(ph)) return ph.split(" · ")[0];
  const n = Math.max(0, ...P.map(s => +((/^B(\d+)/.exec(s.phase || "") || [])[1] || 0)), ...(ctx.doc.blocs || []).map(b => +((/^B(\d+)/.exec(b.nom) || [])[1] || 0)));
  return `B${n + 1}`;
}

// --- Rendu ---
export function rendre(ctx) {
  const A = ctx.state.assistant; if (!A) return { html: h`<p class="petit">Assistant fermé.</p>`, titre: h`<b>Construire un bloc</b>` };
  const P = A.plan, E = ctx.data.echelles, i = A.etape;
  const corps = [etapeDepart, etapeObjectif, etapeJours, etapePhases, etapeSeances, etapeFeux, etapeRecap][i](ctx, A, P, E);
  const html = h`<div class="as-etapes">${ETAPES.map((t, k) => h`<button class="as-pt ${k === i ? "actif" : k < i ? "fait" : ""}" data-act="asAller" data-k="${k}" aria-label="Étape ${k + 1} : ${t}">${k + 1}</button>`)}</div>
    <div class="carte as-carte"><p class="petit">Étape ${i + 1} sur ${ETAPES.length}</p><h2 class="as-titre">${ETAPES[i]}</h2>
      <button class="lien" data-act="asPourquoi">${A.pourquoi ? "▾" : "▸"} Pourquoi ?</button>${si(A.pourquoi, () => h`<p class="as-pourquoi">${POURQUOI[i]} <button class="lien" data-act="ouvrirAide" data-k="bloc">Le guide complet ›</button></p>`)}
      ${corps}</div>
    <div class="as-pied">${i > 0 ? h`<button data-act="asAller" data-k="${i - 1}">‹ Précédent</button>` : h`<button data-act="asQuitter">Fermer</button>`}
      ${i < ETAPES.length - 1 ? h`<button class="principal" data-act="asAller" data-k="${i + 1}">Suivant ›</button>` : h`<button class="principal" data-act="asCreer">${A.edition ? "Enregistrer le bloc" : "Créer le bloc"}</button>`}</div>`;
  return { html, titre: h`<b>Construire un bloc</b>` };
}
const hmc = m => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
const alertes = l => l.length ? h`${l.map(t => h`<div class="avert">${t}</div>`)}<p class="petit">Ce sont des conseils : tu peux continuer tel quel, c'est toi qui décides.</p>` : "";
const champ = (label, contenu) => h`<div class="as-champ"><label class="champ">${label}</label>${contenu}</div>`;
const sel = (chemin, options, valeur, vide = null) => liste(chemin, options, valeur, { act: "asChamp", vide, data: { chemin } });
const nombre = (chemin, valeur, { min = 0, max = 99 } = {}) => h`<input type="number" inputmode="numeric" class="as-nb" min="${min}" max="${max}" value="${valeur}" data-act="asChamp" data-chemin="${chemin}" data-num="1">`;

function etapeDepart(ctx, A, P, E) {
  const der = derniereSemaine(ctx), quand = [];
  for (let w = Math.max(1, Math.min(A.wNow, der)); w <= der; w++) quand.push([String(w), `Remplacer à partir de la semaine ${w} (${jourMois(dateSeance(ctx.doc.reglages.dateDebut || ctx.data.dateDebut, w, "Lundi"))})`]);
  quand.push([`apres`, `Après le programme (semaine ${der + 1})`]);
  const valQuand = P.remplace ? String(P.debut) : "apres";
  return h`${si(!A.edition, () => h`<div class="as-modeles"><p class="petit">Partir d'un modèle :</p>${MODELES.map(m => h`<button class="item" data-act="asModele" data-id="${m.id}"><span><b>${m.titre}</b><br><span class="petit">${m.resume}</span></span><span class="petit">${P.modele === m.id ? "✓" : "›"}</span></button>`)}
      <button class="item" data-act="asModele" data-id=""><span><b>Partir de zéro</b><br><span class="petit">tous les choix à faire</span></span><span class="petit">${!P.modele ? "✓" : "›"}</span></button></div>`)}
    ${champ("Profil", choix("asProfil", Object.entries(PROFILS).map(([k, p]) => [k, p.label]), P.profil))}<p class="petit">${(PROFILS[P.profil] || {}).pourquoi || ""}</p>
    ${champ("Niveau consolidé en voie", sel("depart.Voie", E.Voie, P.depart.Voie))}
    ${champ("Niveau consolidé en bloc", sel("depart.Bloc", E.Bloc, P.depart.Bloc))}
    <p class="petit">Proposé d'après tes passages (≥ 5 essais à ≥ 70 % sur la cotation).</p>
    ${champ("Quand", sel("quand", quand, valQuand))}
    ${champ("Durée du bloc", sel("nbSemaines", DUREES.map(n => [String(n), `${n} semaines${n === 8 ? " (habituel)" : ""}`]), String(P.semaines.length)))}
    <p class="petit">8 semaines : le compromis habituel. 4 à 6 : un bloc court, sans respiration. 11 à 12 : deux semaines de respiration.</p>
    ${champ("Le plan commence à sa semaine", sel("premiere", [1, 2, 3, 4].map(n => [String(n), n === 1 ? "1 (début normal)" : n === 2 ? "2 (la 1re déjà faite)" : `${n} (les ${n - 1} premières déjà faites)`]), String(P.premiere || 1)))}
    ${champ("Nom", h`<input type="text" class="as-texte" value="${P.nom}" data-act="asChamp" data-chemin="nom" maxlength="6">`)}
    ${champ("Titre", h`<input type="text" class="as-texte" value="${P.titre}" placeholder="ex. Le 5 en bloc" data-act="asChamp" data-chemin="titre" maxlength="40">`)}`;
}

function etapeObjectif(ctx, A, P, E) {
  const o = P.objectif;
  return h`${champ("Discipline", choix("asObjDisc", ["Bloc", "Voie"], o.disc))}
    ${champ("Cotation à consolider", sel("objectif.cot", crans(E, o.disc), o.cot, "—"))}
    ${alertes(alertesObjectif(P, E))}
    ${champ("Objectif secondaire", sel("secondaire", [["", "Aucun"], ["devers", "Dévers facile (au volume)"]], P.secondaire))}
    ${champ("Fil rouge en voie", sel("fil", [["", "Aucun"], ["hauteur", "Hauteur (appréhension en haut)"]], P.fil))}`;
}

function etapeJours(ctx, A, P) {
  return h`<div class="as-jours">${JOURS.map(j => h`<div class="as-jour"><span>${j}</span>${sel(`jours.${j}`, Object.entries(ROLES).map(([k, r]) => [k, k === "dure" ? `Séance dure (${P.objectif.disc.toLowerCase()})` : r.label]), P.jours[j] || "repos")}</div>`)}</div>
    ${alertes(alertesJours(P))}
    ${champ("Sans partenaire, la séance voie devient", sel("planB", [["bloc", "Une séance bloc modérée (plan B)"], ["", "Rien (séance sautée)"]], P.planB))}
    <p class="petit">Le plan B est écrit dans chaque séance voie : tu choisis la version au moment de commencer.</p>
    ${champ("Durée d'une séance en salle", sel("duree", [60, 90, 120, 150, 180].map(m => [String(m), hm(m * 60)]), String(P.duree)))}`;
}

function etapePhases(ctx, A, P) {
  const p0 = (P.premiere || 1) - 1, max = Math.max(100, ...P.semaines.map(s => s.charge));
  return h`<div class="as-graphe">${P.semaines.map((s, k) => h`<div class="as-barre ${k < p0 ? "passee" : ""}"><i class="ph-${s.type}" style="height:${Math.round(100 * s.charge / max)}%"></i><span>S${k + 1}</span></div>`)}</div>
    <table class="tableau as-table"><tr><th>Sem.</th><th>Phase</th><th>Charge</th></tr>
    ${P.semaines.map((s, k) => h`<tr class="${k < p0 ? "passee" : ""}"><td>S${k + 1}${si(k >= p0, () => h`<br><span class="petit">sem. ${P.debut + k - p0}</span>`)}</td><td>${sel(`semaines.${k}.type`, ORDRE_PHASES.map(t => [t, PHASES[t].label]), s.type)}</td><td>${nombre(`semaines.${k}.charge`, s.charge, { max: 150 })}</td></tr>`)}</table>
    <p class="petit">Charge en % de la semaine la plus dure. ${Object.values(PHASES).map(p => `${p.label} : ${p.pourquoi}`).join(" ")}</p>
    ${alertes(alertesPhases(P))}`;
}

function etapeSeances(ctx, A, P, E) {
  const p0 = (P.premiere || 1) - 1, o = P.objectif, roles = new Set(Object.values(P.jours));
  const col = [roles.has("dure") && ["essais", `Essais ${o.cot || "?"}`], roles.has("volume") && ["volume", "Volume"], roles.has("volume") && P.secondaire === "devers" && ["devers", "Dévers"], roles.has("voie") && ["voies", `Voies ${crans(E, "Voie")[crans(E, "Voie").indexOf(P.depart.Voie) + 1] || ""}`], roles.has("course") && ["course", "Course min"]].filter(Boolean);
  const bloc = genererBloc(P, E), w = P.debut + Math.max(A.apercu, p0) - p0, duJour = bloc.seances.filter(s => s.semaine === w);
  return h`<table class="tableau as-table as-saisie"><tr><th>Sem.</th>${col.map(([, l]) => h`<th>${l}</th>`)}</tr>
    ${P.semaines.map((s, k) => k < p0 ? "" : h`<tr><td><b>S${k + 1}</b><br><span class="petit">${PHASES[s.type].label}</span></td>${col.map(([c]) => h`<td>${nombre(`semaines.${k}.${c}`, s[c])}</td>`)}</tr>`)}</table>
    <p class="petit">Essais : à la séance dure · Volume et dévers : au volume · Voies : un cran au-dessus de ton niveau voie.</p>
    ${exercices(ctx, A, P, E)}
    ${champ("Voir les séances de la semaine", sel("apercu", P.semaines.map((s, k) => k < p0 ? null : [String(k), `S${k + 1} · ${PHASES[s.type].label}`]).filter(Boolean), String(Math.max(A.apercu, p0))))}
    ${duJour.map(s => h`<details class="as-apercu"><summary><b>${s.jour}</b> · ${s.activite}${s.bonus ? " (bonus)" : ""}</summary><pre class="code">${s.contenu}</pre></details>`)}
    <p class="petit">Après la création, chaque séance se modifie comme les autres (⋯ › Modifier le plan).</p>`;
}

// Exercices : retirer, remplacer, ajouter (par type de séance), et la consigne technique de chaque semaine
const optionsExos = ctx => { const g = {}; for (const e of ctx.data.exercices) (g[e.categorie] = g[e.categorie] || []).push(e.nom); return Object.entries(g).map(([groupe, options]) => ({ groupe, options })); };
function exercices(ctx, A, P, E) {
  const prop = exercicesProposes(P, E), types = Object.keys(TYPES_SEANCE).filter(t => prop[t] || ((P.exos || {}).ajouts || {})[t]), t = types.includes(A.exoType) ? A.exoType : types[0], p0 = (P.premiere || 1) - 1;
  const X = P.exos || {}, R = (X.retires || {})[t] || [], M = (X.remplaces || {})[t] || {}, aj = (X.ajouts || {})[t] || [], N = A.nouvelExo || {};
  return h`<h3 class="as-sous">Exercices</h3>
    ${si(types.length, () => h`${champ("Type de séance", sel("exoType", types.map(x => [x, TYPES_SEANCE[x]]), t))}
    <div class="liste">${(prop[t] || []).map(nom => h`<div class="as-exo ${R.includes(nom) ? "retire" : ""}"><span>${R.includes(nom) ? h`<s>${nom}</s>` : M[nom] ? h`<s>${nom}</s> → <b>${M[nom]}</b>` : nom}</span>
        ${liste("", [["__retirer", "Retirer"], ...optionsExos(ctx)], R.includes(nom) ? "__retirer" : M[nom] || "", { act: "asExoChanger", vide: "Garder", data: { type: t, nom } })}</div>`)}
      ${aj.map((a, n) => h`<div class="as-exo ajout"><span>+ ${ligneAjout(a).replace(/\s*\{[^}]*\}/g, "").replace(/[«»]/g, "")}${a.phase ? h` <span class="petit">(${PHASES[a.phase].label} seulement)</span>` : ""}</span><button class="lien" data-act="asExoAjoutRetirer" data-type="${t}" data-n="${n}">Retirer</button></div>`)}</div>
    <div class="as-ajout"><b>+ Ajouter un exercice</b>
      ${liste("", optionsExos(ctx), N.nom || "", { act: "asNouvelExo", vide: "Choisir dans la bibliothèque…", data: { k: "nom" } })}
      <div class="as-rangee"><label class="petit">Fois ${h`<input type="number" inputmode="numeric" class="as-nb" min="1" max="20" value="${N.n || 1}" data-act="asNouvelExo" data-k="n">`}</label>
        ${liste("", [["", "Toutes les semaines"], ...ORDRE_PHASES.map(x => [x, `${PHASES[x].label} seulement`])], N.phase || "", { act: "asNouvelExo", vide: null, data: { k: "phase" } })}</div>
      <input type="text" class="as-texte" placeholder="Précision (facultatif) : ex. 10 s, sur grosse prise" value="${N.detail || ""}" data-act="asNouvelExo" data-k="detail" maxlength="60">
      <label class="as-case"><input type="checkbox" ${N.effort ? "checked" : ""} data-act="asNouvelExo" data-k="effort"> Exercice d'effort (sinon facile)</label>
      <button class="petit-btn btn-ajout" data-act="asExoAjouter" data-type="${t}">Ajouter à « ${TYPES_SEANCE[t]} »</button></div>`)}
    <h3 class="as-sous">Consigne technique de chaque semaine</h3>
    <div class="liste">${P.semaines.map((_, k) => k < p0 ? "" : h`<div class="as-exo"><span>S${k + 1}</span>${liste("", optionsExos(ctx), consigne(P, k), { act: "asChamp", vide: null, data: { chemin: `consignes.${k}` } })}</div>`)}</div>
    <p class="petit">Elle sert de fil à la séance volume, à la voie et au plan B de la semaine.</p>`;
}

function etapeFeux(ctx, A, P) {
  const feux = P.feux || feuxParDefaut(P);
  return h`${feux.map((f, n) => h`<div class="as-feu"><div class="as-feu-tete"><b>${f.titre}</b><span class="petit">${({ objectif: "objectif", secondaire: "secondaire", fil: "fil rouge", garde: "garde-fou" })[f.role] || ""}</span><button class="lien" data-act="asFeuRetirer" data-n="${n}">Retirer</button></div>
      ${f.criteres.map((c, m) => h`<div class="as-crit"><span>${c.label || libelleCritere(c)}</span>${c.type === "coche" ? h`<span class="petit">à cocher dans Progrès</span>`
        : c.type === "douleur" ? h`<span class="as-seuil">≤ ${nombre(`feux.${n}.criteres.${m}.max`, c.max ?? 2, { max: 10 })}/10</span>`
        : h`<span class="as-seuil">≥ ${nombre(`feux.${n}.criteres.${m}.min`, c.min ?? 0, { max: 100 })}${c.type === "taux" ? " %" : ""}</span>`}</div>`)}</div>`)}
    ${si(P.feux, () => h`<button class="lien" data-act="asFeuxDefaut">Rétablir les feux proposés</button>`)}
    ${alertes(alertesFeux(feux))}
    <p class="petit">Comptés depuis le début du bloc. Garde-fou : douleur maximale notée sur les 4 dernières semaines.</p>`;
}

function etapeRecap(ctx, A, P, E) {
  const bloc = genererBloc(P, E), fin = bloc.debut + bloc.nb - 1, autres = (ctx.doc.blocs || []).filter(b => b.id !== P.id);
  const chevauche = autres.filter(b => !(finBloc(b) < bloc.debut || b.debut > fin));
  const avant = programmeEffectif(ctx.data, { ...ctx.doc, blocs: autres }), apres = programmeEffectif(ctx.data, { ...ctx.doc, blocs: [...autres.filter(b => !chevauche.includes(b)), bloc] });
  const regl = ctx.doc.reglages, mesure = (Pg, w) => { const l = Pg.filter(s => s.semaine === w && !s.bonus);
    return { n: l.length, min: Math.round(l.reduce((t, s) => t + dureeSeance(s, etapesSeance(s, {}), ctx.data, regl), 0) / 60),
      essais: l.reduce((t, s) => t + lignesDe(s.contenu.split("\n## ")[0]).filter(e => e.type === "action" && e.grimpe && e.grimpe.cot === P.objectif.cot && e.grimpe.disc === P.objectif.disc).reduce((x, e) => x + e.n, 0), 0) }; };
  const toutes = [...Object.values(alertesObjectif(P, E)), ...alertesJours(P), ...alertesPhases(P), ...alertesFeux(bloc.feux)];
  const lignes = []; for (let w = bloc.debut; w <= fin; w++) lignes.push({ w, a: mesure(avant, w), b: mesure(apres, w), ph: (bloc.seances.find(s => s.semaine === w) || {}).phase || "" });
  return h`<p><b>${bloc.nom} · ${bloc.titre}</b><br><span class="petit">Semaines ${bloc.debut} → ${fin} · ${bloc.remplace ? "remplace ce qui était prévu (les séances déjà faites restent)" : "ajouté au programme"}</span></p>
    <p class="petit">${P.objectif.disc} ${P.objectif.cot} · ${PROFILS[P.profil].label} · ${JOURS.filter(j => P.jours[j] && P.jours[j] !== "repos").map(j => `${j.slice(0, 3)}. ${ROLES[P.jours[j]].label.toLowerCase()}`).join(" · ")}</p>
    ${si(chevauche.length, () => h`<div class="avert">${chevauche.map(b => `${b.nom} · ${b.titre}`).join(", ")} couvre déjà ces semaines : il sera retiré.</div>`)}
    <table class="tableau as-table"><tr><th>Sem.</th><th>Séances</th><th>Temps</th><th>Essais ${P.objectif.cot}</th></tr>
      ${lignes.map(x => h`<tr><td>${x.w}<br><span class="petit">${x.ph.replace(/^[^·]*·\s*/, "")}</span></td><td>${x.a.n} → <b>${x.b.n}</b></td><td>${hmc(x.a.min)} → <b>${hmc(x.b.min)}</b></td><td>${x.a.essais} → <b>${x.b.essais}</b></td></tr>`)}</table>
    <p class="petit">Avant → après, sans les séances bonus (course, prévention). Le temps est estimé d'après les repos et les routines.</p>
    <p><b>Feux verts</b></p><ul class="as-liste">${bloc.feux.map(f => h`<li>${f.titre} : ${f.criteres.map(c => `${c.label || libelleCritere(c)}${c.type === "coche" ? "" : c.type === "douleur" ? ` ≤ ${c.max ?? 2}` : ` ≥ ${c.min}${c.type === "taux" ? " %" : ""}`}`).join(" · ")}</li>`)}</ul>
    ${si(toutes.length, () => h`<details class="as-apercu"><summary>${toutes.length} conseil${toutes.length > 1 ? "s" : ""} non suivi${toutes.length > 1 ? "s" : ""}</summary>${alertes(toutes)}</details>`)}`;
}

// --- Actions ---
const fixer = (o, chemin, v) => { const k = chemin.split("."); let x = o; for (let i = 0; i < k.length - 1; i++) x = x[k[i]]; x[k[k.length - 1]] = v; };
export const actions = {
  asAller: (ctx, d) => { ctx.state.assistant.etape = +d.k; ctx.state.assistant.pourquoi = false; ctx.rendre(true); },
  asPourquoi: ctx => { ctx.state.assistant.pourquoi = !ctx.state.assistant.pourquoi; ctx.rendre(); },
  asQuitter: ctx => { ctx.state.assistant = null; ctx.ouvrir("programme"); },
  asModele: (ctx, d) => { const A = ctx.state.assistant;
    if (d.id) A.plan = modele(d.id).plan(); else { const der = derniereSemaine(ctx); A.plan = planVide({ nom: nomPour(ctx, der + 1, false), debut: der + 1, depart: A.plan.depart }); }
    A.apercu = (A.plan.premiere || 1) - 1; ctx.rendre(); },
  asProfil: (ctx, d) => { const P = ctx.state.assistant.plan, types = P.semaines.map(s => s.type); P.profil = d.valeur;
    P.semaines = semainesParDefaut(d.valeur, types.length).map((s, k) => ({ ...s, type: types[k] || s.type })); ctx.rendre(); },
  asObjDisc: (ctx, d) => { const P = ctx.state.assistant.plan; P.objectif = { disc: d.valeur, cot: "" }; if (!P.feuxModifies) P.feux = null; ctx.rendre(); },
  asChamp: (ctx, d, el) => { const A = ctx.state.assistant, P = A.plan, c = d.chemin; let v = d.num ? Math.max(0, Math.round(+el.value || 0)) : el.value;
    if (c === "apercu") A.apercu = +v;
    else if (c === "quand") { P.remplace = v !== "apres"; P.debut = v === "apres" ? derniereSemaine(ctx) + 1 : +v; P.nom = nomPour(ctx, P.debut, P.remplace); }
    else if (c === "nbSemaines") { P.semaines = semainesParDefaut(P.profil, +v); P.consignes = null; P.premiere = Math.min(P.premiere || 1, P.semaines.length - 1); A.apercu = (P.premiere || 1) - 1; }
    else if (c === "premiere") { P.premiere = +v; A.apercu = Math.max(A.apercu, +v - 1); }
    else if (c === "duree") P.duree = +v;
    else if (c === "nom") P.nom = v.trim() || P.nom;
    else if (c === "exoType") A.exoType = v;
    else if (c.startsWith("consignes.")) { P.consignes = P.consignes || []; P.consignes[+c.split(".")[1]] = v === consigneDefaut(+c.split(".")[1]) ? null : v; }
    else { if (c.startsWith("feux.")) { P.feux = P.feux || feuxParDefaut(P); P.feuxModifies = true; } fixer(P, c, v); }
    if (/^(objectif|secondaire|fil|depart)/.test(c) && !P.feuxModifies) P.feux = null;
    ctx.rendre(); },
  asExoChanger: (ctx, d, el) => { const P = ctx.state.assistant.plan, X = P.exos = P.exos || {}, t = d.type, nom = d.nom;
    X.retires = X.retires || {}; X.remplaces = X.remplaces || {}; X.retires[t] = (X.retires[t] || []).filter(x => x !== nom); X.remplaces[t] = { ...(X.remplaces[t] || {}) }; delete X.remplaces[t][nom];
    if (el.value === "__retirer") X.retires[t].push(nom); else if (el.value) X.remplaces[t][nom] = el.value;
    ctx.state.assistant.exoType = t; ctx.rendre(); },
  asNouvelExo: (ctx, d, el) => { const A = ctx.state.assistant; A.nouvelExo = A.nouvelExo || {}; A.nouvelExo[d.k] = el.type === "checkbox" ? el.checked : el.type === "number" ? Math.max(1, +el.value || 1) : el.value; if (el.tagName === "SELECT") ctx.rendre(); },
  asExoAjouter: (ctx, d) => { const A = ctx.state.assistant, N = A.nouvelExo || {}; if (!N.nom) { ctx.toast("Choisis d'abord un exercice dans la liste"); return; }
    const X = A.plan.exos = A.plan.exos || {}; X.ajouts = X.ajouts || {}; X.ajouts[d.type] = [...(X.ajouts[d.type] || []), { nom: N.nom, n: N.n || 1, detail: (N.detail || "").trim(), phase: N.phase || "", effort: !!N.effort }];
    A.nouvelExo = {}; A.exoType = d.type; ctx.rendre(); },
  asExoAjoutRetirer: (ctx, d) => { const X = ctx.state.assistant.plan.exos; X.ajouts[d.type] = X.ajouts[d.type].filter((_, n) => n !== +d.n); ctx.rendre(); },
  asFeuRetirer: (ctx, d) => { const P = ctx.state.assistant.plan; P.feux = (P.feux || feuxParDefaut(P)).filter((_, n) => n !== +d.n); P.feuxModifies = true; ctx.rendre(); },
  asFeuxDefaut: ctx => { const P = ctx.state.assistant.plan; P.feux = null; P.feuxModifies = false; ctx.rendre(); },
  asCreer: ctx => { const A = ctx.state.assistant, P = A.plan, bloc = genererBloc(P, ctx.data.echelles), ancien = (ctx.doc.blocs || []).find(b => b.id === P.id);
    if (ancien) bloc.coches = { ...(ancien.coches || {}) };
    const fin = bloc.debut + bloc.nb - 1;
    ctx.modifier(A.edition ? `bloc ${bloc.nom} modifié` : `bloc ${bloc.nom} créé`, d => { d.blocs = (d.blocs || []).filter(b => b.id !== bloc.id && (finBloc(b) < bloc.debut || b.debut > fin)); d.blocs.push(bloc); });
    ctx.state.assistant = null; forcerOuvert(`prog-bloc-${bloc.nom}`);
    const w = ctx.state.semaineVue; ctx.state.semaineVue = w >= bloc.debut && w <= fin ? w : bloc.debut;
    ctx.ouvrir("programme"); ctx.toast(`${bloc.nom} · ${bloc.titre} : ${A.edition ? "enregistré" : "créé"}`, () => ctx.agir("annuler")); },
};
