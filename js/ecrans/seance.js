// ecrans/seance.js — l'écran Séance, vu du mur : rien n'est demandé pendant la séance.
// Le plan se lit, un curseur dit où on en est, les voies se touchent, la douleur et la fin ont un bouton. C'est tout.
import { h, si, classes, lier, ico, pictoProfil, pli, ouvert, info, liste as listeDeroulante } from "../html.js";
import { etapesSeance, dureeEtape, dureeSeance, etatSeance, discipline, reposDefaut, seanceARegler, activiteAffichee, nomSeance } from "../programme.js";
import { versionsDe, titreAction } from "../parseur.js";
import { avertissements, reussi, marqueVoie, forme, parVoie, projets, causePrincipale, anonyme, tentatives as toutesTentatives } from "../analyse.js";
import { court, hm, hhmm, mmss, duree as dureeTexte, semaineDe, ajouterJours } from "../dates.js";
// Le passage lui-même, daté comme dans les calculs : il ne doit compter ni comme « avant lui » ni comme une réussite précédente
export const refPassage = (ctx, seanceId, t) => { const s = ctx.seance(seanceId), sa = ctx.saisie(seanceId); return t && { ...t, date: sa.dateReelle || (s && s.date) }; };
import { salleDe, profilHabituel, salleParDefautPour, retenirSalle, sallesPour, voiesEnPlace, hexDe, texteSur, libelleVoie, secteurDe, cotationDe, trierNiveaux, cotSalleDe, deuxCot, cotLibelle } from "../salles.js";

export const GENRES = { echauffement: "Échauffement", securite: "Sécurité", facile: "Facile", effort: "Effort", recup: "Récupération" };
export const RES_LABEL = { ok: "Réussi", sec: "Avec sec", ko: "Échec" };
// Les mêmes mots partout : voie « Enchaînée · Avec sec · Échec », bloc « Réussi · Échec »
export const resLabel = t => t.res === "ok" ? (t.disc === "Bloc" ? "Réussi" : "Enchaînée") : RES_LABEL[t.res] || "";
export const choixResultat = disc => disc === "Bloc" ? [["ok", "✓ Réussi"], ["ko", "✗ Échec"]] : [["ok", "✓ Enchaînée"], ["sec", "Avec sec"], ["ko", "✗ Échec"]];
const FORMES = { bien: { doigts: 5, coudes: 5, epaules: 5, energie: 5, motivation: 5 }, moyen: { doigts: 3, coudes: 3, epaules: 3, energie: 4, motivation: 4 } };

// --- Sélection de la séance affichée ---
export function courant(ctx) {
  const P = ctx.programme, { state } = ctx;
  if (state.seanceId && P.some(s => s.id === state.seanceId)) return P.find(s => s.id === state.seanceId);
  const auj = ctx.aujourdhui();
  const s = P.find(s => { const sa = ctx.saisie(s.id); return sa.debut && !sa.fin; }) || P.find(s => s.date === auj && !ctx.saisie(s.id).fin) || P.find(s => s.date >= auj) || P[P.length - 1];
  if (s) state.seanceId = s.id;
  return s;
}
export const actives = etapes => etapes.filter(e => e.type !== "info");
// Une étape se coche (case ✓) ; une action répétée hors grimpe se compte en ronds (2/3) ; une étape de grimpe est faite quand on la coche
// ou quand tous ses passages sont notés. Rien n'est obligatoire : c'est un repère, les analyses n'en dépendent pas.
export const avecRonds = e => e.type === "action" && !e.grimpe && e.n > 1;
export const nbNotes = (sa, e) => (sa.tentatives || []).filter(t => t.k === e.k).length;
export const nbFait = (sa, e) => Math.max(0, (sa.faites || {})[e.k] || 0);
// faites[k] = -1 : décochée à la main, même si tous ses passages sont notés
export const etapeFinie = (sa, e) => { const f = (sa.faites || {})[e.k]; if (f === -1) return false;
  return avecRonds(e) ? nbFait(sa, e) >= e.n : nbFait(sa, e) >= 1 || (!!e.grimpe && nbNotes(sa, e) >= e.n * Math.max(1, e.serie || 1)); };
// L'étape en cours : celle désignée (« J'en suis là », « Suivant »), sinon la première pas encore faite
export function etapeCourante(sa, etapes) { const a = actives(etapes); if (!a.length) return null; return a.find(e => e.k === sa.curseur) || a.find(e => !etapeFinie(sa, e)) || a[a.length - 1]; }
// La prochaine étape pas encore faite après « k » (puis depuis le début)
function prochaineApres(sa, etapes, k) { const a = actives(etapes), i = a.findIndex(e => e.k === k); return [...a.slice(i + 1), ...a.slice(0, Math.max(0, i))].find(e => !etapeFinie(sa, e)) || null; }
const etapeSuivante = (sa, etapes) => { const c = etapeCourante(sa, etapes); return c ? prochaineApres(sa, etapes, c.k) : null; };
// La salle de la séance : celle choisie (« » = salle inconnue, voulu), sinon la salle par défaut — même règle en voie et en bloc
export const salleCourante = (ctx, s, sa, disc) => salleDe(ctx.doc, sa.salle !== undefined ? sa.salle : salleParDefautPour(ctx.doc, disc));
const dureeReelle = sa => sa.duree != null ? sa.duree * 60 : (sa.fin - sa.debut - (sa.pauseTotale || 0)) / 1000;

export function rendre(ctx) {
  const s = courant(ctx);
  if (!s) return { html: h`<p class="carte">Aucune séance dans le programme.</p>`, titre: "Séance" };
  const sa = ctx.saisie(s.id), { data, doc, state } = ctx, auj = ctx.aujourdhui();
  const etapes = etapesSeance(s, sa), versions = versionsDe(s.contenu), etat = etatSeance(s, sa, auj), disc = discipline(s, sa);
  const enCours = etat === "encours", avant = !sa.debut && !sa.fin && etat !== "sautee", estGrimpe = ["Voie", "Bloc"].includes(disc);
  const duree = dureeSeance(s, etapes, data, doc.reglages), courante = etapeCourante(sa, etapes);
  let out = h``;

  // Feux verts tout juste atteints : une carte, une fois
  for (const f of ctx.bilan.nouveauxFeux) out = h`${out}<div class="carte feu-carte"><div><b><span class="feu-pt ok"></span> Feu vert : ${f.titre}</b><br><span class="petit">${f.criteres.map(c => `${c.t} : ${c.val}${c.pct ? " %" : ""}`).join(" · ")}</span></div><button data-act="feuVu" data-id="${f.id}">Vu !</button></div>`;
  // Bandeau
  const sousTitre = sa.fin ? `✓ Faite en ${hm(dureeReelle(sa))} · prévu ≈ ${hm(duree)}` : etat === "sautee" ? `Sautée${sa.raison ? " · " + sa.raison : ""}` : `≈ ${hm(duree)} · ${actives(etapes).length} étapes`;
  const theme = etapes.find(e => e.type === "info" && /^thème/i.test(e.texte));
  const nom = activiteAffichee(s, sa);
  // Consignes : toujours tout en haut (au-dessus du bandeau ou de « En cours ») ; ouvertes avant la séance, repliées en une ligne pendant
  const inf = etapes.filter(e => e.type === "info" && !/^thème/i.test(e.texte));
  const apercu = inf.length ? inf[0].texte.replace(/[{}«»]/g, "").slice(0, 48) + (inf[0].texte.length > 48 || inf.length > 1 ? "…" : "") : "aucune";
  const cleC = enCours ? "consignes-encours" : "consignes-seance", defC = false;      // repliées : l'aperçu suffit, un appui les ouvre
  const consignes = () => pli(cleC, defC, h`${ico("consignes")} Consignes`, () => inf.length ? h`<div class="consignes">${inf.map(e => h`<div class="info">${lier(e.texte, data.exercices)}</div>`)}</div>` : h`<p class="petit">Pas de consigne pour cette séance.</p>`, { resume: inf.length ? (ouvert(cleC, defC) ? String(inf.length) : apercu) : "aucune", classe: `carte pli-consignes ${inf.length ? "avec" : "sans"}` });
  const averts = avertissements(s, ctx.programme, doc), fj = forme(sa, data.params);
  const blocAverts = () => { let o = h``; for (const a of averts) o = h`${o}<div class="avert">${ico("alerte")} ${a}</div>`;
    const allegee = versions.findIndex(v => /allég|léger|legere|court|récup/i.test(v));
    if (avant && allegee >= 0 && allegee !== (sa.version || 0) && (averts.length || fj === "rouge")) o = h`${o}<div class="avert">Il existe une version « ${versions[allegee]} » : <button class="petit-btn" data-act="version" data-n="${allegee}">la prendre aujourd'hui</button></div>`;
    return o; };

  if (!enCours) {
    // Avant ou après : la bannière dans la couleur de l'activité, puis les consignes
    out = h`${out}${consignes()}<div class="bandeau-seance"><h1>${nomSeance(s, sa)}${s.libre ? " · séance créée" : ""}</h1><div class="phase">${s.phase}${s.modifie ? " · modifiée" : ""}${s.dateFixee ? ` · déplacée (prévue ${court(s.datePrevue)})` : ""}</div>
      ${frise(ctx, s, sa, etapes, null)}<div class="sous-titre">${sousTitre}</div>
      ${theme ? h`<div class="theme">${ico("cible")} ${lier(theme.texte.replace(/^thème[^:]*:\s*/i, ""), data.exercices)}</div>` : ""}
      ${si(avant && versions.length > 1, h`<div class="segment blanc">${versions.map((v, n) => h`<button data-act="version" data-n="${n}" class="${(sa.version || 0) === n ? "choisi" : ""}">${v.replace(/\s*\(.*\)\s*$/, "")}</button>`)}</div>`)}
      ${si(avant, h`<button class="gros blanc" data-act="demarrer">${ico("play")} Commencer</button><div class="liens-bandeau"><button class="petit-blanc" data-act="sauterOuvrir">Sautée</button><button class="petit-blanc" data-act="bilanOuvrir">Déjà faite → bilan</button></div>`)}
      ${si(etat === "abilan", h`<button class="gros blanc" data-act="bilanOuvrir">Donner le bilan</button>`)}
    </div>${blocAverts()}`;
  } else {
    // Pendant : une seule carte « En cours », teintée de la couleur de l'activité. De haut en bas : où j'en suis (ligne du temps),
    // l'étape en cours, ce qu'il faut faire, le gros bouton, puis le détail (encadré). Douleur et Fin de séance : barre fixe en bas.
    const ecoule = (Date.now() - sa.debut - (sa.pauseTotale || 0)) / 1000, suivante = etapeSuivante(sa, etapes), act = actives(etapes);
    const toutFait = act.every(e => etapeFinie(sa, e)), rang = courante ? act.findIndex(e => e.k === courante.k) + 1 : act.length;
    out = h`${out}${consignes()}<div class="carte encours" data-activite="${nom}">
      <div class="encours-tete"><span class="encours-nom">${fj ? h`<span class="point ${fj}"></span>` : ""}<b>${nomSeance(s, sa)}</b> <span class="petit">${s.phase}</span></span><span class="petit">${hm(ecoule)} · fin ≈ ${hhmm(Date.now() + Math.max(0, duree - ecoule) * 1000)}</span>${si(!sa.recup, h`<span class="forme-mini"><span class="petit">Forme ?</span><button data-act="forme" data-f="bien" aria-label="Bien">🙂</button><button data-act="forme" data-f="moyen" aria-label="Moyen">😐</button><button data-act="forme" data-f="pastop" aria-label="Pas top">😣</button></span>`)}</div>
      ${frise(ctx, s, sa, etapes, toutFait ? null : courante)}
      ${toutFait || !courante ? h`<div class="tout-fait"><b>✓ Toutes les étapes sont faites</b><span class="petit">Bravo ! Il reste le bilan : effort, douleur, et ce que tu as grimpé.</span></div>
          <button class="gros principal" data-act="bilanOuvrir">${ico("stop")} Terminer la séance</button>`
      : h`<div class="encours-etape"><span class="petit">Étape ${rang} sur ${act.length}</span>
          <div class="maintenant-etape"><span class="genre genre-${courante.type === "routine" ? courante.genre || "echauffement" : courante.genre}"></span><b>${courante.type === "routine" ? courante.nom : titreAction(courante)}</b>${courante.type === "action" && courante.n > 1 ? h` <span class="petit">${avecRonds(courante) ? `${nbFait(sa, courante)}/${courante.n}` : courante.grimpe ? `${nbNotes(sa, courante)}/${courante.n * Math.max(1, courante.serie || 1)} notés` : `× ${courante.n}`}</span>` : ""}</div></div>
        <div class="boutons-maintenant">${boutonsEtape(ctx, s, sa, courante, true)}</div>
        ${avecRonds(courante) && nbFait(sa, courante) < courante.n ? h`<button class="gros principal" data-act="rond" data-k="${courante.k}" data-i="${nbFait(sa, courante)}">+1 · ${nbFait(sa, courante) + 1}/${courante.n}</button>${suivante ? h`<button class="gros contour" data-act="suivant">Passer à : ${titreDe(suivante)} ›</button>` : ""}`
          : suivante ? h`<button class="gros principal" data-act="suivant">✓ Fait · suivant : ${titreDe(suivante)}</button>`
          : h`<button class="gros principal" data-act="suivantFin">✓ Fait · terminer la séance</button>`}
        ${pli("m-detail", false, "Détail de l'étape", () => h`<div class="detail-cadre">${detailEtape(ctx, courante)}</div>`, { classe: "pli-maintenant" })}`}
    </div>${blocAverts()}
    <div class="barre-seance"><button class="contour-orange" data-act="douleurOuvrir">${ico("alerte")} Douleur</button><button class="fin-seance" data-act="bilanOuvrir">${ico("stop")} Fin de séance</button></div>`;
  }

  // Résumé après la séance
  if (sa.fin && etat === "faite") { const t = sa.tentatives || [], ok = t.filter(reussi).length;
    out = h`${out}<div class="carte resume"><div class="ligne-res"><span>Effort</span><b>${sa.effort ?? "—"}/10</b></div>
      <div class="ligne-res"><span>Douleur après</span><b>${sa.douleur && sa.douleur.apres ? `${sa.douleur.apres}/10 · ${sa.douleur.zone || ""}` : "aucune"}</b></div>
      ${t.length ? h`<div class="ligne-res"><span>${disc === "Bloc" ? "Blocs réussis" : "Voies réussies"}</span><b>${ok} sur ${t.length}</b></div>` : ""}
      ${sa.notes ? h`<p class="petit">« ${sa.notes} »</p>` : ""}
      <div class="liens"><button class="petit-btn" data-act="bilanOuvrir">Modifier le bilan</button><button class="petit-btn" data-act="reprendre">Reprendre la séance</button></div></div>`; }
  if (etat === "sautee") out = h`${out}<p class="petit centre">Séance sautée · <button class="petit-btn" data-act="desauter">annuler</button></p>`;

  // Les voies : projets, cotations visées, nouvelles
  if (estGrimpe || (sa.tentatives || []).length) out = h`${out}${carteVoies(ctx, s, sa, etapes, disc)}`;

  // Le plan : replié pendant une séance de grimpe en cours (la carte Maintenant suffit), ouvert sinon
  const faites = actives(etapes).filter(e => etapeFinie(sa, e)).length, grimpeEnCours = enCours && estGrimpe;
  out = h`${out}${pli(grimpeEnCours ? "plan-encours" : "plan", !grimpeEnCours, "Plan de séance", () => h`<div class="etapes">
    ${actives(etapes).map((e, n) => ligneEtape(ctx, s, sa, e, n + 1, enCours && courante && courante.k === e.k, enCours))}
    ${si(s.libre && !etapes.length, h`<p class="petit">Séance libre : note simplement ce que tu fais.</p>`)}
  </div>`, { resume: sa.debut ? `${faites}/${actives(etapes).length} faites` : `${actives(etapes).length} étapes`, classe: `carte pli-plan act-${({ Voie: "voie", Bloc: "bloc", Maison: "maison", Course: "course" })[disc] || "autre"}` })}`;

  if (s.libre || s.copie) out = h`${out}<button class="gros contour danger" data-act="supprimerLibre">Supprimer cette séance</button>`;
  return { html: out, titre: h`<b>${court(s.date)}</b> · ${nomSeance(s, sa)}`, fleches: true, menu: true, activite: disc === "Bloc" ? "Bloc" : s.activite, infos: "", glisser: !enCours };
}

// Boutons d'une étape : repos, chrono, fractions, guidée (jamais de case à cocher)
function boutonsEtape(ctx, s, sa, e, grands) {
  const { data, doc } = ctx, repos = e.repos ?? reposDefaut(doc.reglages, s.activite);
  return h`${si(e.type === "routine" && data.routines.some(r => r.routine === e.nom && r.duree), h`<button data-act="guide" data-k="${e.k}">${ico("play")} Guidée</button>`)}
    ${si(e.chrono, h`<button data-act="chrono" data-k="${e.k}">${ico("play")} ${dureeTexte(e.chrono || 0)}</button>`)}
    ${si(e.fractions, h`<button data-act="fractions" data-k="${e.k}">${ico("play")} Fractions</button>`)}
    ${si(e.type === "action" && (e.repos || e.grimpe) && repos > 0, h`<button data-act="repos" data-k="${e.k}">${ico("repos")} Repos ${dureeTexte(repos)}</button>`)}
    ${si(grands && doc.reglages.raccourciRepos && e.type === "action" && (e.repos || e.grimpe) && repos > 0, h`<a class="bouton" href="shortcuts://run-shortcut?name=${encodeURIComponent(doc.reglages.raccourciRepos)}&input=text&text=${repos}">${ico("cloche")} iPhone</a>`)}`;
}

// Une cible « bloc 5 » affiche aussi son équivalent dans la salle du jour : « 3 · ≈ 5 »
function badgeCot(ctx, g) { const s = courant(ctx), sa = s ? ctx.saisie(s.id) : {}, salle = s ? salleCourante(ctx, s, sa, g.disc) : null; return deuxCot(salle, g.disc, "", g.cot); }
const titreDe = e => e.type === "routine" ? e.nom : titreAction(e);
function detailEtape(ctx, e) { const { data } = ctx;
  return e.type === "routine" ? h`<ol class="routine">${data.routines.filter(r => r.routine === e.nom).map(r => h`<li><b>${r.etape}</b>${r.duree ? h` <span class="petit">${hm(r.duree)}</span>` : ""}<div class="petit">${lier(r.quoi, data.exercices)}</div></li>`)}</ol>`
    : h`<div class="texte">${e.n > 1 ? h`<b>${e.n}×</b> ` : ""}${lier(e.texte, data.exercices)}${e.grimpe && e.grimpe.cot ? h` <span class="badge">${badgeCot(ctx, e.grimpe)}</span>` : ""}${e.feu ? feuBadge(ctx, e.feu) : ""}</div>`; }
function ligneEtape(ctx, s, sa, e, num, actuelle, enCours) {
  const { data, state } = ctx, ouverte = state.ouverts.has("e" + e.k), finie = etapeFinie(sa, e);
  const genre = e.type === "routine" ? e.genre || "echauffement" : e.genre, titre = e.type === "routine" ? e.nom : titreAction(e), duree = dureeEtape(e, s, data, ctx.doc.reglages);
  const notees = e.grimpe ? (sa.tentatives || []).filter(t => t.k === e.k).length : 0;
  const mesure = e.mesure ? h`<span class="mesure-champ"><input type="number" inputmode="decimal" step="any" data-act="mesureSaisie" data-k="${e.k}" data-cle="${e.mesure}" value="${(sa.mesures || {})[e.mesure] ?? ""}" placeholder="—"></span>` : "";
  const ronds = avecRonds(e) ? h`<span class="ronds">${Array.from({ length: e.n }, (_, i) => h`<button class="rond ${i < nbFait(sa, e) ? "ok" : ""}" data-act="rond" data-k="${e.k}" data-i="${i}" aria-label="Passage ${i + 1}"></button>`)}</span>` : "";
  return h`<div class="etape genre-${genre} ${classes(actuelle && "actuelle", finie && "finie")}" data-k="${e.k}">
    <div class="etape-ligne">
      <button class="etape-txt" data-act="plier" data-k="e${e.k}"><span class="num">${actuelle ? ico("play") : finie ? "✓" : num}</span><span class="titre">${titre}${e.type === "action" && e.n > 1 ? h` <span class="petit">× ${e.n}</span>` : ""}${notees ? h` <span class="badge">${notees}/${e.n * Math.max(1, e.serie || 1)} noté${notees > 1 ? "s" : ""}</span>` : ""}</span><span class="petit duree">${hm(duree)}</span></button>
      ${mesure}${ronds}
      <button class="case ${finie ? "ok" : ""}" data-act="cocher" data-k="${e.k}" aria-label="${finie ? "Étape faite (décocher)" : "Marquer l'étape faite"}">✓</button>
    </div>
    ${si(ouverte, h`<div class="etape-detail">
      ${e.type === "routine" ? h`<ol class="routine">${data.routines.filter(r => r.routine === e.nom).map(r => h`<li><b>${r.etape}</b>${r.duree ? h` <span class="petit">${hm(r.duree)}</span>` : ""}<div class="petit">${lier(r.quoi, data.exercices)}</div></li>`)}</ol>`
        : h`<div class="texte">${e.n > 1 ? h`<b>${e.n}×</b> ` : ""}${lier(e.texte, data.exercices)}${e.grimpe && e.grimpe.cot ? h` <span class="badge">${badgeCot(ctx, e.grimpe)}</span>` : ""}${e.feu ? feuBadge(ctx, e.feu) : ""}</div>`}
      <div class="actions-etape">${boutonsEtape(ctx, s, sa, e, false)}${si(enCours && !actuelle, h`<button data-act="allerA" data-k="${e.k}">J'en suis là</button>`)}</div></div>`)}
  </div>`;
}
function feuBadge(ctx, cible) {
  const f = ctx.bilan.feux.find(x => ({ "5c": "voie5c", "6a": "voie6a", "6A": "bloc6" })[cible] === x.id); if (!f) return "";
  return h` <span class="badge ${f.ok ? "vert" : "gris"}">${f.ok ? "feu vert ✓" : "feu vert pas encore"} ${cible}</span>`;
}

// --- Frise : le déroulé prévu, une case par étape, largeur = durée, couleur = type ; faites atténuées, en cours entourée ---
function frise(ctx, s, sa, etapes, courante) {
  const a = actives(etapes); if (a.length < 2) return "";
  const d = a.map(e => Math.max(60, dureeEtape(e, s, ctx.data, ctx.doc.reglages)));
  const tot = d.reduce((x, y) => x + y, 0);       // la durée de chaque phase, en minutes, quand le segment est assez large pour l'écrire
  return h`<div class="frise" aria-hidden="true">${a.map((e, i) => h`<span class="frise-seg genre-${e.type === "routine" ? e.genre || "echauffement" : e.genre} ${classes(etapeFinie(sa, e) && "fait", courante && courante.k === e.k && "ici")}" style="flex-grow:${d[i]}" title="${Math.round(d[i] / 60)} min">${d[i] / tot >= 0.055 ? Math.max(1, Math.round(d[i] / 60)) : ""}</span>`)}</div>`;
}
const CLE_PLUS_TARD = "grimpe-hier-plus-tard";
const plusTard = () => { try { return localStorage.getItem(CLE_PLUS_TARD) || ""; } catch { return ""; } };

// Toutes les étapes cochées pendant une séance en cours : l'app propose d'elle-même de terminer
function proposerFin(ctx, s) { const sa = ctx.saisie(s.id); if (!sa.debut || sa.fin) return;
  if (actives(etapesSeance(s, sa)).every(e => etapeFinie(sa, e))) ctx.toast("✓ Toutes les étapes sont faites", null, { label: "Terminer la séance", action: () => ctx.agir("bilanOuvrir") }); }
// --- La carte des voies ---
// Cotations proposées en passage rapide : celles prévues par la séance, sinon autour du niveau consolidé (cotations sans « + »)
// Ce qu'on note : la discipline de la séance, ou l'autre si la salle a des voies et des blocs et qu'on l'a choisie (« Voie | Bloc »)
export const discSaisie = (ctx, s, sa) => { const d = ctx.state.discSaisie; return d && d.id === s.id ? d.disc : discipline(s, sa); };
const mixte = salle => !!salle && salle.type === "Bloc et voie";
const choixDisc = (ctx, s, sa, salle) => mixte(salle) ? h`<div class="segment disc-saisie">${["Voie", "Bloc"].map(x => h`<button data-act="discSaisie" data-valeur="${x}" class="${discSaisie(ctx, s, sa) === x ? "choisi" : ""}">${x}</button>`)}</div>` : "";
function cotationsRapides(ctx, etapes, disc, sa = {}, salle = null) {
  const ech = ctx.data.echelles[disc] || [], plus = ((sa.rapides || {})[disc] || []);
  const base = cotationsBase(ctx, etapes, disc, salle);
  return [...new Set([...base, ...plus])].sort((a, b) => ech.indexOf(a) - ech.indexOf(b));
}
function cotationsBase(ctx, etapes, disc, salle = null) {
  const cibles = [...new Set(etapes.filter(e => e.grimpe && e.grimpe.disc === disc && e.grimpe.cot).map(e => e.grimpe.cot))];
  if (cibles.length) return cibles;
  // Pas de cible de cette discipline dans la séance (ex. des blocs dans une séance voie) : 4 cotations autour de ton niveau
  const ech = ctx.data.echelles[disc] || [], bloc = (ctx.doc.blocs || []).filter(b => b.plan && b.plan.depart).pop();
  const niv = (ctx.bilan.consolides[`${disc}-Vertical`] || {}).niveau || (bloc && bloc.plan.depart[disc]) || (disc === "Bloc" ? "4" : "5a");
  const c = salle ? cotationDe(salle, disc) : null;
  const l = c && c.mode === "liste" && c.liste.length ? [...new Set(c.liste.filter(x => x.app).map(x => String(x.app)))].sort((a, b) => ech.indexOf(a) - ech.indexOf(b))   // celles de la salle
    : ech.filter(x => !x.endsWith("+") || x === niv);
  const i = Math.max(0, l.findIndex(x => ech.indexOf(x) >= ech.indexOf(niv)));
  return l.slice(Math.max(0, i - 1), Math.max(0, i - 1) + 4);
}
// --- La carte des voies, courte : la salle · « + Noter un passage » · tes cibles · voie déjà faite (cotations, un appui) · aujourd'hui, par voie · le mur ---
const tuileVoie = (ctx, salle, v, auj, voies) => { const hv = voies.find(x => x.voieId === v.id), t = auj.filter(x => x.voieId === v.id), hex = hexDe(ctx.doc, v.couleur, salle), sec = secteurDe(salle, v);
  return h`<button class="tuile-voie ${hex === "transparent" ? "sans-couleur" : ""} ${t.length ? (t.some(reussi) ? "ok-auj" : "ko-auj") : ""}" data-act="voieRapide" data-appui="projetOuvrir" data-salle="${salle.id}" data-id="${v.id}" style="background:${hex};color:${texteSur(hex)}"><b>${v.etoile ? "★ " : ""}${v.cotSalle || v.cot || "?"}</b>${v.cotSalle && v.cot && String(v.cotSalle) !== String(v.cot) ? h`<small class="tuile-eq">≈ ${v.cot}</small>` : ""}${pictoProfil(v.profil, "picto-tuile")}<span class="tuile-lieu">${[v.nom, sec ? (/^\d+$/.test(sec.nom) ? `secteur ${sec.nom}` : sec.nom) : ""].filter(Boolean).join(" · ") || (v.profil || "").toLowerCase()}</span>
    ${(m => m ? h`<span class="marque ${m.cls}" aria-label="${m.label}">${m.txt}</span>` : "")(marqueVoie(hv))}<span class="tuile-histo">${hv ? reperes(hv) : "jamais"}${t.length ? ` · auj. ${t.map(x => x.res === "ok" ? "✓" : x.res === "sec" ? "s" : "✗").join("")}` : ""}</span></button>`; };
// Cibles : ★ à essayer puis projets, encore en place
function ciblesDe(ctx, salle, disc) {
  const enPlace = voiesEnPlace(salle, disc), voies = parVoie(toutesTentatives(ctx.programme, ctx.doc));
  const proj = projets(voies, disc, salle).map(p => enPlace.find(x => x.id === p.voieId)).filter(Boolean);
  return { enPlace, voies, cibles: [...enPlace.filter(v => v.etoile), ...proj.filter(v => !v.etoile)] };
}
// Passages d'aujourd'hui regroupés par voie : « 5b bleu  ✗ ✗ ✓ facile  + encore »
function groupesDuJour(sa) {
  const G = new Map();
  (sa.tentatives || []).forEach((t, i) => { const k = t.voieId || (t.couleur || t.nom ? `${t.disc}|${t.cot}|${t.couleur}|${t.nom}` : `${t.disc}|${t.cot}|${t.nouvelle ? "n" + t.t : "anc"}`);
    const g = G.get(k) || { t, l: [] }; g.l.push([t, i]); G.set(k, g); });
  return [...G.values()];
}
function carteVoies(ctx, s, sa, etapes, discSeance) {
  const salle0 = salleCourante(ctx, s, sa, discSeance), disc = mixte(salle0) ? discSaisie(ctx, s, sa) : discSeance;
  const { doc } = ctx, salle = salleCourante(ctx, s, sa, disc), nom = mixte(salle0) ? "Voies et blocs" : disc === "Bloc" ? "Blocs" : "Voies", cots = cotationsRapides(ctx, etapes, disc, sa, salle), groupes = groupesDuJour(sa);
  const C = salle ? ciblesDe(ctx, salle, disc) : null, n = (sa.tentatives || []).length, ok = (sa.tentatives || []).filter(reussi).length, auj = sa.tentatives || [];
  // Les voies en place d'une cotation (en voie, 5b+ va avec 5b ; en bloc, la cotation exacte)
  const deCot = c => C ? C.enPlace.filter(v => disc === "Bloc" ? String(v.cot) === String(c) : String(v.cot || "").replace(/\+$/, "") === String(c).replace(/\+$/, "")) : [];
  // Ordre des tuiles d'une cote : grimpées aujourd'hui, puis projets et « à essayer », puis le reste par secteur
  const rangV = v => { const hv = C.voies.find(x => x.voieId === v.id); return auj.some(t => t.voieId === v.id) ? 0 : (hv && hv.essais && !hv.reussies) || v.etoile ? 1 : 2; };
  const ordreSect = v => { const k = salle.secteurs.findIndex(x => x.id === v.secteurId); return k < 0 ? 999 : k; };
  const tuilesDe = c => { const l = deCot(c).sort((a, b) => rangV(a) - rangV(b) || ordreSect(a) - ordreSect(b) || (a.ordre || 0) - (b.ordre || 0)), cle = `${s.id}|${disc}|${c}`, tout = (ctx.state.cotsOuvertes || new Set()).has(cle), max = 10;      // 2 rangées de 5
    if (!l.length) return "";
    return h`<div class="tuiles tuiles-cot">${(tout ? l : l.slice(0, max)).map(v => tuileVoie(ctx, salle, v, auj, C.voies))}</div>${si(l.length > max, h`<button class="lien lien-autres" data-act="cotTout" data-k="${cle}">${tout ? "Moins" : `+ ${l.length - max} autre${l.length - max > 1 ? "s" : ""}`}</button>`)}`; };
  const anonymes = c => h`<span class="anon n${disc === "Voie" ? 3 : 2}"><button class="ok" data-act="noterRapide" data-cot="${c}" data-res="ok" aria-label="Réussi en ${c}, ${disc === "Bloc" ? "bloc" : "voie"} pas dans l'app">✓</button>${si(disc === "Voie", h`<button class="sec" data-act="rapideSec" data-cot="${c}" aria-label="En haut avec sec en ${c}">sec</button>`)}<button class="ko" data-act="noterRapide" data-cot="${c}" data-res="ko" aria-label="Pas réussi en ${c}, ${disc === "Bloc" ? "bloc" : "voie"} pas dans l'app">✗</button></span>`;
  const large = cots.some(c => deuxCot(salle, disc, "", c).includes("≈"));
  return pli(`carte-${disc}`, true, nom, () => h`
    <div class="voies-tete"><button class="salle-chip" data-act="choixSalleOuvrir">${salle ? salle.nom : "Choisir la salle"} ›</button>${choixDisc(ctx, s, sa, salle0)}</div>
    <div class="lignes-cot ${large ? "large" : ""}">${cots.map(c => h`<div class="bloc-cot"><div class="ligne-cot"><b>${deuxCot(salle, disc, "", c)}</b>${anonymes(c)}</div>${tuilesDe(c)}</div>`)}</div>
    <div class="voies-outils"><button class="petit-btn btn-ajout" data-act="rapideAutre">+ une autre cotation</button>${si(salle, h`<button class="petit-btn btn-ajout" data-act="nouvelleVoieOuvrir">+ ${disc === "Bloc" ? "Nouveau bloc" : "Nouvelle voie"}</button>`)}<button class="petit-btn" data-act="noterOuvrir">${disc === "Bloc" ? "Autre bloc…" : "Autre voie…"}</button></div>
    ${info("lignesCot")}
    ${si(n, () => h`<h3>Aujourd'hui <span class="petit">${ok} réussi${ok > 1 ? "s" : ""} sur ${n}</span></h3><div class="jour-passages">${groupes.map(g => h`<div class="groupe-passages"><span class="gp-voie"><span class="pastille" style="background:${hexDe(doc, g.t.couleur, salleDe(doc, g.t.salle))}"></span> ${libelleVoie(g.t)}${anonyme(g.t) ? h` <span class="petit">${g.t.disc === "Bloc" ? (g.t.nouvelle ? "nouveau" : "déjà fait") : (g.t.nouvelle ? "nouvelle" : "déjà faite")}</span>` : ""}</span>
        <span class="gp-res">${g.l.map(([t, i]) => h`<button class="tentative res res-${t.res}" data-act="resultatEditer" data-appui="resultatEditer" data-i="${i}" aria-label="Corriger ce passage">${t.res === "sec" ? `${t.sec} sec` : resLabel(t)}${t.aisance === "facile" ? " facile" : ""}${t.approx ? " ~" : ""}</button>`)}<button class="encore" data-act="encore" data-i="${g.l[g.l.length - 1][1]}" aria-label="Encore un passage sur cette voie">+ encore</button></span></div>`)}</div><p class="petit">Touche un résultat pour le corriger.</p>`)}`,
    { resume: `${salle ? salle.nom : "salle inconnue"}${n ? ` · ${ok}/${n}` : ""}`, classe: `carte voies disc-${disc === "Bloc" ? "bloc" : "voie"}` });
}
// « + une autre cotation » : une ligne de plus dans « déjà faite, sans la chercher » (pour cette séance)
function fenetreRapideAutre(ctx, M = ctx.state.modal) {
  const s = ctx.seance(M.seanceId), sa = ctx.saisie(s.id), salle = salleCourante(ctx, s, sa, M.disc), c = cotationDe(salle, M.disc), deja = cotationsRapides(ctx, etapesSeance(s, sa), M.disc, sa, salle);
  const l = salle && c.mode === "liste" && c.liste.length ? c.liste.filter(x => x.app).map(x => String(x.app)) : (ctx.data.echelles[M.disc] || []);
  const groupes = [...new Set(l.map(x => x[0]))];
  return h`<h2>Une autre cotation · ${M.disc === "Bloc" ? "bloc" : "voie"}</h2><p class="petit">Elle s'ajoute aux lignes « déjà faite, sans la chercher » de cette séance.</p>
    ${groupes.map(g => h`<div class="choix compact">${l.filter(x => x[0] === g).map(x => h`<button data-act="rapideAjouter" data-valeur="${x}" class="${deja.includes(x) ? "choisi" : ""}">${deuxCot(salle, M.disc, "", x)}</button>`)}</div>`)}
    <div class="actions"><button data-act="mFermer">Fermer</button></div>`;
}
// La fenêtre « Noter un passage » : en haut nouvelle voie / sans voie précise ; puis filtres couleur et cotation → 1 à 3 voies ; cibles et voies d'aujourd'hui d'abord
export function fenetreNoter(ctx, M) {
  const s = ctx.seance(M.seanceId), sa = ctx.saisie(s.id), disc = M.disc, salle = salleCourante(ctx, s, sa, disc), auj = sa.tentatives || [];
  const haut = h`<div class="noter-haut">${si(salle, h`<button data-act="nouvelleVoieOuvrir">+ ${disc === "Bloc" ? "Nouveau bloc" : "Nouvelle voie"}</button>`)}<button data-act="resultat">Sans ${disc === "Bloc" ? "bloc" : "voie"} précis${disc === "Bloc" ? "" : "e"} <span class="petit">(cotation seule)</span></button></div>`;
  if (!salle) return h`<h2>Noter un passage</h2>${haut}<p class="petit">Salle inconnue : note par cotation, ou choisis la salle du jour pour retrouver ses voies.</p><div class="actions"><button data-act="mFermer">Fermer</button></div>`;
  const { enPlace, voies, cibles } = ciblesDe(ctx, salle, disc), rangCot = c => (ctx.data.echelles[disc] || []).indexOf(c);
  const couleurs = [...new Set(enPlace.map(v => v.couleur).filter(Boolean))], cotes = trierNiveaux(ctx.data.echelles, salle, disc, [...new Set(enPlace.map(v => String(v.cotSalle || v.cot || "")).filter(Boolean))]);           // dans l'ordre de la salle, comme « En bref »
  const etatDe = v => { const hv = voies.find(x => x.voieId === v.id); return !hv || !hv.essais ? "jamais" : hv.reussies ? "reussie" : "projet"; }, nE = e => enPlace.filter(v => etatDe(v) === e).length;
  const filtrees = enPlace.filter(v => (!M.fCouleur || v.couleur === M.fCouleur) && (!M.fCot || (v.cotSalle || v.cot) === M.fCot) && (!M.fEtat || etatDe(v) === M.fEtat));
  const poids = v => cibles.includes(v) ? 0 : auj.some(t => t.voieId === v.id) ? 1 : 2, l = [...filtrees].sort((a, b) => poids(a) - poids(b)), filtre = M.fCouleur || M.fCot || M.fEtat, max = filtre ? 60 : 9;
  return h`<h2>Noter un passage · ${salle.nom}</h2>${choixDisc(ctx, s, sa, salle)}${haut}
    ${enPlace.length ? h`<label class="champ">${disc === "Bloc" ? "Quel bloc" : "Quelle voie"} ? <span class="petit">filtre par couleur, état, niveau</span></label>
      <div class="pastilles filtre-couleurs">${couleurs.map(c => h`<button class="pastille ${M.fCouleur === c ? "choisi" : ""}" style="background:${hexDe(ctx.doc, c, salle)}" data-act="noterFiltre" data-k="fCouleur" data-valeur="${c}" aria-label="${c}" title="${c}"></button>`)}</div>
      <div class="barre-filtres">${listeDeroulante("noter-etat", [["projet", `✗ Projets (${nE("projet")})`], ["jamais", `Jamais essayé${disc === "Bloc" ? "s" : "es"} (${nE("jamais")})`], ["reussie", `✓ Réussi${disc === "Bloc" ? "s" : "es"} (${nE("reussie")})`]], M.fEtat || "", { act: "noterFiltreListe", vide: "Tous les états", data: { k: "fEtat" } })}
        ${listeDeroulante("noter-niveau", cotes.map(c => [c, `${deuxCot(salle, disc, c, "")} (${enPlace.filter(v => String(v.cotSalle || v.cot) === c).length})`]), M.fCot || "", { act: "noterFiltreListe", vide: "Tous les niveaux", data: { k: "fCot" } })}</div>
      ${si(filtre, h`<button class="lien" data-act="noterFiltre" data-k="tout">✕ enlever les filtres</button>`)}
      <div class="tuiles">${l.slice(0, max).map(v => tuileVoie(ctx, salle, v, auj, voies))}</div>
      ${si(l.length > max, h`<p class="petit">${l.length - max} autres : filtre par couleur ou cotation.</p>`)}${si(!l.length, h`<p class="petit">Aucune voie ne correspond : « + ${disc === "Bloc" ? "Nouveau bloc" : "Nouvelle voie"} ».</p>`)}`
      : h`<p class="petit">Aucune voie connue dans ${salle.nom} : ajoute-la avec « + ${disc === "Bloc" ? "Nouveau bloc" : "Nouvelle voie"} », elle restera.</p>`}
    <div class="actions"><button data-act="mFermer">Fermer</button></div>`;
}
// Repère de réussite d'une voie : ✓ (✓ facile), ✗ n
export function reperes(hv) { const ko = hv.essais - hv.reussies - (hv.sec || 0); return [hv.reussies ? (hv.aisance === "facile" ? "✓ facile" : "✓") : "", hv.sec ? `↑ ${hv.sec} sec` : "", ko > 0 ? `✗${ko}` : ""].filter(Boolean).join(" "); }

// --- Rappel de la séance précédente à régler (affiché en haut du Programme) ---
export function carteHier(ctx) {
  const doc = ctx.doc, auj = ctx.aujourdhui(), hier = seanceARegler(ctx.programme, doc, auj); if (!hier) return "";
  if (plusTard() === `${hier.id}|${auj}`) return h`<button class="hier-mini" data-act="hierRouvrir"><span>${court(hier.date)} · ${nomSeance(hier, ctx.saisie(hier.id))} : bilan ?</span><span>›</span></button>`;
  const eh = etatSeance(hier, ctx.saisie(hier.id), auj);
  return h`<div class="carte hier" data-activite="${activiteAffichee(hier, ctx.saisie(hier.id))}"><div><b>${court(hier.date)} · ${nomSeance(hier, ctx.saisie(hier.id))}</b><br><span class="petit">${eh === "abilan" ? "Séance terminée, il manque le bilan (effort, douleur)." : eh === "encours" ? "Séance restée ouverte." : "Faite ? Sautée ? Dis-le en un appui, ou laisse."}</span></div>
    <div class="hier-btns"><button class="principal" data-act="hierBilan" data-id="${hier.id}">${eh === "passee" ? "Faite → bilan" : "Bilan"}</button>${si(eh === "passee", h`<button data-act="hierSautee" data-id="${hier.id}">Sautée</button>`)}<button data-act="hierPlusTard" data-id="${hier.id}">Plus tard</button></div></div>`;
}

// --- Actions ---
const demarrerSiBesoin = sa => { if (!sa.debut && !sa.fin) { sa.debut = Date.now(); delete sa.statut; } };
function lancerRepos(ctx, s, sa, e) { const d = e.repos ?? reposDefaut(ctx.doc.reglages, s.activite); if (d > 0) ctx.minuteur.lancer({ type: "repos", phases: [{ label: "Repos", duree: d }], seanceId: s.id, k: e.k }); }
const etapeDe = (ctx, s, sa, k) => etapesSeance(s, sa).find(e => e.k === k);
// Clé de l'étape à laquelle rattacher un passage : l'étape courante si c'est une étape de grimpe de la discipline,
// sinon la première étape de grimpe de la discipline qui n'a pas encore son compte de passages (le curseur n'est jamais obligatoire)
export function cleRattachement(ctx, s, sa, disc) {
  const etapes = etapesSeance(s, sa), e = etapeCourante(sa, etapes);
  if (e && e.grimpe && e.grimpe.disc === disc) return e.k;
  const n = k => (sa.tentatives || []).filter(t => t.k === k).length;
  const libre = etapes.find(x => x.grimpe && x.grimpe.disc === disc && n(x.k) < x.n * Math.max(1, x.serie || 1));
  return libre ? libre.k : null;
}
export function ajouterTentative(ctx, s, t) {
  ctx.modifierSeance(s.id, "passage noté", (sa, d) => { sa.tentatives = sa.tentatives || []; demarrerSiBesoin(sa); sa.tentatives.push(t);
    if (t.voieId && t.res === "ok") { const sl = d.salles.find(x => x.id === t.salle), v = sl && sl.voies.find(x => x.id === t.voieId); if (v && v.etoile) delete v.etoile; } });   // ★ réussie : elle n'est plus « à essayer »
  ctx.toast(`${resLabel(t)} · ${libelleVoie(t)}`, () => ctx.store.annuler());
  const e = t.k ? etapeDe(ctx, s, ctx.saisie(s.id), t.k) : null;
  if (e && ctx.doc.reglages.reposAuto && (e.repos || e.grimpe)) lancerRepos(ctx, s, ctx.saisie(s.id), e);
}

export const actions = {
  version: (ctx, d) => { const s = courant(ctx); ctx.modifierSeance(s.id, "version", sa => { sa.version = +d.n; }); ctx.rendre(); },
  demarrer: ctx => { const s = courant(ctx), disc = discipline(s, ctx.saisie(s.id)), candidates = sallesPour(ctx.doc, disc);
    ctx.modifierSeance(s.id, "début de séance", x => { x.debut = Date.now(); delete x.fin; delete x.statut;
      if (s.date !== ctx.aujourdhui()) x.dateReelle = ctx.aujourdhui(); else delete x.dateReelle;           // faite un autre jour que prévu : datée du jour réel
      if (x.salle === undefined) x.salle = salleParDefautPour(ctx.doc, disc) || (candidates.length === 1 ? candidates[0].id : ""); }); ctx.rendre(true); },
  // « ✓ Fait · suivant » : coche l'étape en cours et passe à la prochaine pas encore faite
  suivant: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), etapes = etapesSeance(s, sa), c = etapeCourante(sa, etapes); if (!c) return;
    ctx.modifierSeance(s.id, "étape faite", x => { demarrerSiBesoin(x); x.faites = x.faites || {}; if (!avecRonds(c)) x.faites[c.k] = Math.max(1, x.faites[c.k] || 0);
      const n = prochaineApres(x, etapes, c.k); if (n) x.curseur = n.k; else delete x.curseur; }); ctx.rendre(); proposerFin(ctx, s); },
  // Dernière étape : « ✓ Fait » et on passe au bilan
  suivantFin: ctx => { actions.suivant(ctx); ctx.state.toast = null; ctx.agir("bilanOuvrir"); },
  // Case ✓ : coche ou décoche ; cocher l'étape en cours fait avancer
  cocher: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), etapes = etapesSeance(s, sa), e = etapes.find(x => x.k === d.k), finie = etapeFinie(sa, e), cour = etapeCourante(sa, etapes);
    ctx.modifierSeance(s.id, finie ? "étape décochée" : "étape faite", x => { x.faites = x.faites || {};
      if (finie) { if (e.grimpe && nbNotes(x, e) >= e.n * Math.max(1, e.serie || 1)) x.faites[e.k] = -1; else delete x.faites[e.k]; } else { demarrerSiBesoin(x); x.faites[e.k] = avecRonds(e) ? e.n : 1; if (cour && cour.k === e.k) { const n = prochaineApres(x, etapes, e.k); if (n) x.curseur = n.k; else delete x.curseur; } } }); ctx.rendre();
    proposerFin(ctx, s); },
  // Rond i : un passage de plus (ou de moins si on retouche le dernier rond plein) ; la dernière fait avancer
  rond: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), etapes = etapesSeance(s, sa), e = etapes.find(x => x.k === d.k), i = +d.i, n = nbFait(sa, e), cour = etapeCourante(sa, etapes);
    const nouveau = i < n ? i : i + 1;
    ctx.modifierSeance(s.id, "passage", x => { demarrerSiBesoin(x); x.faites = x.faites || {}; if (nouveau) x.faites[e.k] = nouveau; else delete x.faites[e.k];
      if (nouveau >= e.n && cour && cour.k === e.k) { const p = prochaineApres(x, etapes, e.k); if (p) x.curseur = p.k; else delete x.curseur; } });
    if (nouveau > n && nouveau < e.n && ctx.doc.reglages.reposAuto) lancerRepos(ctx, s, ctx.saisie(s.id), e);
    ctx.rendre(); proposerFin(ctx, s); },
  allerA: (ctx, d) => { const s = courant(ctx); ctx.modifierSeance(s.id, "j'en suis là", x => { x.curseur = d.k; }, { annulable: false }); ctx.state.ouverts.delete("e" + d.k); ctx.rendre(); },
  forme: (ctx, d) => { const s = courant(ctx);
    if (d.f === "pastop") return ctx.ouvrirModal({ type: "pasTop", seanceId: s.id, quoi: [], zone: "", niveau: 0 });
    ctx.modifierSeance(s.id, "forme du jour", sa => { sa.recup = { ...FORMES[d.f] }; sa.douleur = { ...(sa.douleur || {}), avant: 0, zoneAvant: "" }; }); ctx.rendre(); },
  reprendre: ctx => { const s = courant(ctx); ctx.modifierSeance(s.id, "reprise", sa => { delete sa.fin; }); ctx.rendre(); },
  desauter: ctx => { const s = courant(ctx); ctx.modifierSeance(s.id, "séance non sautée", sa => { delete sa.statut; delete sa.raison; }); ctx.rendre(); },
  repos: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id); lancerRepos(ctx, s, sa, etapeDe(ctx, s, sa, d.k)); ctx.rendre(); },
  chrono: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), e = etapeDe(ctx, s, sa, d.k);
    const phases = e.cote ? [{ label: titreAction(e) + " · côté 1", duree: e.chrono }, { label: "Changement", duree: 5 }, { label: titreAction(e) + " · côté 2", duree: e.chrono }] : [{ label: titreAction(e), duree: e.chrono }];
    ctx.minuteur.lancer({ type: "chrono", phases, seanceId: s.id, k: e.k }); ctx.rendre(); },
  fractions: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), e = etapeDe(ctx, s, sa, d.k);
    ctx.minuteur.lancer({ type: "fractions", phases: [{ label: "Course", duree: e.fractions.course }, { label: "Marche", duree: e.fractions.marche }], boucles: e.n, seanceId: s.id, k: e.k }); ctx.rendre(); },
  guide: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), e = etapeDe(ctx, s, sa, d.k);
    ctx.minuteur.lancer({ type: "guide", phases: ctx.data.routines.filter(r => r.routine === e.nom).map(r => ({ label: r.etape, duree: r.duree || 30 })), seanceId: s.id, k: e.k }); ctx.rendre(); },
  mesureSaisie: (ctx, d, el) => { const s = courant(ctx), v = el.value === "" ? null : +el.value, sem = semaineDe(ctx.doc.reglages.dateDebut || ctx.data.dateDebut, s.date);
    ctx.modifier("mesure", doc => { const sa = doc.seances[s.id] = doc.seances[s.id] || {}; sa.mesures = sa.mesures || {}; doc.mesures[sem] = doc.mesures[sem] || {};
      if (v === null) { delete sa.mesures[d.cle]; delete doc.mesures[sem][d.cle]; } else { sa.mesures[d.cle] = v; doc.mesures[sem][d.cle] = v; } }); },
  choixSalleOuvrir: ctx => { const s = courant(ctx); ctx.ouvrirModal({ type: "choixSalle", seanceId: s.id, disc: discipline(s, ctx.saisie(s.id)) }); },
  choisirSalle: (ctx, d) => { const s = courant(ctx), disc = discipline(s, ctx.saisie(s.id));
    ctx.modifier("salle", doc => { const sa = doc.seances[s.id] = doc.seances[s.id] || {}; sa.salle = d.id; retenirSalle(doc, disc, d.id); }, { annulable: false }); ctx.rendre(); },
  noterOuvrir: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id); ctx.ouvrirModal({ type: "noter", seanceId: s.id, disc: discSaisie(ctx, s, sa), fCouleur: "", fCot: "" }); },
  discSaisie: (ctx, d) => { const s = courant(ctx); ctx.state.discSaisie = { id: s.id, disc: d.valeur }; const m = ctx.state.modal; if (m && m.type === "noter") { m.disc = d.valeur; m.fCouleur = ""; m.fCot = ""; m.fEtat = ""; } ctx.rendre(); },
  cotTout: (ctx, d) => { const S = ctx.state.cotsOuvertes = ctx.state.cotsOuvertes || new Set(); S.has(d.k) ? S.delete(d.k) : S.add(d.k); ctx.rendre(); },
  rapideSec: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discSaisie(ctx, s, sa), salle = salleCourante(ctx, s, sa, disc);
    ctx.ouvrirModal({ type: "externe", rendu: () => h`<h2>En haut avec sec · ${deuxCot(salle, disc, "", d.cot)}</h2><p class="petit">Un seul passage : combien de repos sur la corde ?</p>
      <div class="choix echelle">${[1, 2, 3, 4, 5, 6].map(n => h`<button data-act="noterRapide" data-cot="${d.cot}" data-res="sec" data-sec="${n}">${n}</button>`)}</div><div class="actions"><button data-act="mFermer">Annuler</button></div>` }); },
  rapideAutre: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discSaisie(ctx, s, sa); ctx.ouvrirModal({ type: "externe", rendu: fenetreRapideAutre, seanceId: s.id, disc }); },
  rapideAjouter: (ctx, d) => { const m = ctx.state.modal; ctx.modifierSeance(m.seanceId, "cotation ajoutée", x => { x.rapides = x.rapides || {}; x.rapides[m.disc] = [...new Set([...(x.rapides[m.disc] || []), d.valeur])]; }, { annulable: false }); ctx.fermerModal(); ctx.rendre(); },
  noterFiltreListe: (ctx, d, el) => { ctx.state.modal[d.k] = el.value; ctx.rendre(); },
  noterFiltre: (ctx, d) => { const m = ctx.state.modal; if (d.k === "tout") { m.fCouleur = ""; m.fCot = ""; m.fEtat = ""; } else m[d.k] = m[d.k] === d.valeur ? "" : d.valeur; ctx.rendre(); },
  murOuvrir: (ctx, d) => ctx.ouvrir("salle", { salleId: d.id }),
  // « + encore » : même voie (de la salle : sa fenêtre rapide ; sans voie : la fenêtre du passage, pré-remplie)
  encore: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), t = sa.tentatives[+d.i]; if (!t) return;
    if (t.voieId && salleDe(ctx.doc, t.salle) && salleDe(ctx.doc, t.salle).voies.some(v => v.id === t.voieId)) return actions.voieRapide(ctx, { id: t.voieId, salle: t.salle });
    ctx.ouvrirModal({ type: "resultat", seanceId: s.id, k: cleRattachement(ctx, s, sa, t.disc), disc: t.disc, cot: t.cot, cotSalle: t.cotSalle, profil: t.profil || "Vertical", res: "", sec: 1, style: "", couleur: t.couleur || "", nom: t.nom || "", cause: "", salle: t.salle || "", nouvelle: false }); },
  voieRapide: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discSaisie(ctx, s, sa), salle = (d.salle && salleDe(ctx.doc, d.salle)) || salleCourante(ctx, s, sa, disc), v = salle && salle.voies.find(x => x.id === d.id); if (!v) return;
    ctx.ouvrirModal({ type: "voieRapide", seanceId: s.id, salleId: salle.id, voieId: v.id, disc, res: "", sec: 1, cause: "" }); },
  noterRapide: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discSaisie(ctx, s, sa);
    const salle = salleCourante(ctx, s, sa, disc);
    const t = { t: Date.now(), k: cleRattachement(ctx, s, sa, disc), disc, cot: d.cot, cotSalle: salle ? cotSalleDe(salle, disc, d.cot).split(" / ")[0] || "" : "", profil: "", res: d.res, ...(d.res === "sec" ? { sec: Math.max(1, +d.sec || 1) } : {}), ...(salle ? { salle: salle.id } : {}) };
    ajouterTentative(ctx, s, t);
    if (ctx.state.modal) ctx.fermerModal();
    ctx.toast(`${t.res === "sec" ? `En haut avec ${t.sec} sec` : resLabel(t)} · ${cotLibelle(t)} · ${disc === "Bloc" ? "bloc déjà fait" : "voie déjà faite"}`, () => ctx.store.annuler(), { label: "Nouvelle voie", action: () => ctx.modifierSeance(s.id, "nouvelle voie", x => { const y = (x.tentatives || []).find(z => z.t === t.t); if (y) y.nouvelle = true; }) });
    ctx.rendre(); },
  nouvelleVoieOuvrir: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discSaisie(ctx, s, sa), salle = salleCourante(ctx, s, sa, disc), c = cotationDe(salle, disc);
    ctx.ouvrirModal({ type: "nouvelleVoie", seanceId: s.id, salleId: salle.id, disc, couleur: "", cotSalle: "", chiffre: "", nom: "", profil: profilHabituel(salle, ctx.state.dernierSecteur || null), secteurId: ctx.state.dernierSecteur || "", mode: c.mode }); },
  resultat: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discSaisie(ctx, s, sa), dernier = (sa.tentatives || []).slice(-1)[0];
    ctx.ouvrirModal({ type: "resultat", seanceId: s.id, k: cleRattachement(ctx, s, sa, disc), disc, cot: dernier ? dernier.cot : "", profil: "Vertical", res: "", sec: 1, style: "", couleur: "", nom: "", cause: "", salle: sa.salle || "", salleEch: (salleCourante(ctx, s, sa, disc) || {}).id || "" }); },
  resultatEditer: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), t = sa.tentatives[+d.i]; ctx.ouvrirModal({ type: "resultat", seanceId: s.id, edit: +d.i, ...t, refTentative: refPassage(ctx, s.id, t), comment: undefined, sec: t.sec || 1, profil: t.profil || "Vertical", style: t.style || "" }); },
  douleurOuvrir: ctx => ctx.ouvrirModal({ type: "douleur", seanceId: courant(ctx).id, zone: "", niveau: 3 }),
  sauterOuvrir: ctx => ctx.ouvrirModal({ type: "sauter", seanceId: courant(ctx).id, raison: "" }),
  bilanOuvrir: (ctx, d) => { const s = d && d.id ? ctx.seance(d.id) : courant(ctx), sa = ctx.saisie(s.id), disc = discipline(s, sa);
    // Heures proposées : celles de la séance si elle a été suivie, sinon la durée prévue finissant maintenant (aujourd'hui) ou à partir de 18 h (un autre jour)
    const prevue = dureeSeance(s, etapesSeance(s, sa), ctx.data, ctx.doc.reglages) * 1000, jour = sa.dateReelle || s.date, auj = ctx.aujourdhui();
    let debut = sa.debut, fin = sa.fin || (sa.debut ? Date.now() : null);
    if (!debut) { if (jour === auj) { fin = Date.now(); debut = fin - prevue; } else { debut = new Date(`${jour}T18:00:00`).getTime(); fin = debut + prevue; } }
    if (sa.duree != null && sa.debut) fin = sa.debut + sa.duree * 60000;
    ctx.ouvrirModal({ type: "bilan", seanceId: s.id, disc, effort: sa.effort ?? "", apres: (sa.douleur || {}).apres ?? 0, zone: (sa.douleur || {}).zone || "", notes: sa.notes || "", hDebut: hhmm(debut), hFin: hhmm(fin), jour,
      grille: Object.fromEntries([...new Set((sa.tentatives || []).filter(t => t.approx).map(t => `${t.cot}|${t.res}|${t.disc || disc}`))].map(k => [k, (sa.tentatives || []).filter(t => t.approx && `${t.cot}|${t.res}|${t.disc || disc}` === k).length])), details: false,
      ...(f => ({ forme: f, formeAvant: f }))(sa.recup ? ({ vert: "bien", orange: "moyen", rouge: "pastop" })[forme(sa, ctx.data.params)] || "" : "") }); },
  hierBilan: (ctx, d) => actions.bilanOuvrir(ctx, { id: d.id }),                                   // on reste sur la séance du jour
  hierSautee: (ctx, d) => ctx.ouvrirModal({ type: "sauter", seanceId: d.id, raison: "" }),
  hierPlusTard: (ctx, d) => { try { localStorage.setItem(CLE_PLUS_TARD, `${d.id}|${ctx.aujourdhui()}`); } catch { /* ignore */ } ctx.rendre(); },   // replié jusqu'à demain
  hierRouvrir: ctx => { try { localStorage.removeItem(CLE_PLUS_TARD); } catch { /* ignore */ } ctx.rendre(); },
  etoileVoie: (ctx, d) => { ctx.modifier("voie à essayer", doc => { const v = salleDe(doc, d.salle).voies.find(x => x.id === d.id); if (v.etoile) delete v.etoile; else v.etoile = ctx.aujourdhui(); }); ctx.rendre(); },
  feuVu: (ctx, d) => { ctx.modifier("feu vert vu", doc => { doc.feuxVus[d.id] = ctx.aujourdhui(); }, { annulable: false }); ctx.rendre(); },
  menu: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id); ctx.ouvrirModal({ type: "menu", seanceId: s.id, surPage: true, avant: !sa.debut && !sa.fin }); },  // depuis la séance : pas ce que la page montre déjà
  supprimerLibre: ctx => { const s = courant(ctx); if (!confirm("Supprimer cette séance et ses saisies ?")) return;
    ctx.modifier("suppression de séance", d => { d.ops = d.ops.filter(o => o.cible !== s.id); delete d.seances[s.id]; }); ctx.state.seanceId = null; ctx.ouvrir("programme"); },
  prec: ctx => naviguer(ctx, -1), suiv: ctx => naviguer(ctx, 1),
};
function naviguer(ctx, pas) { const P = ctx.programme, i = P.findIndex(s => s.id === courant(ctx).id); const n = P[i + pas]; if (n) { ctx.state.seanceId = n.id; ctx.state.ouverts = new Set(); ctx.rendre(true); } }
