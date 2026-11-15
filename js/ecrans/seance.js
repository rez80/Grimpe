// ecrans/seance.js — l'écran Séance, vu du mur : rien n'est demandé pendant la séance.
// Le plan se lit, un curseur dit où on en est, les voies se touchent, la douleur et la fin ont un bouton. C'est tout.
import { h, si, classes, lier, ico, pictoProfil } from "../html.js";
import { etapesSeance, dureeEtape, dureeSeance, etatSeance, discipline, reposDefaut, seanceARegler } from "../programme.js";
import { versionsDe, titreAction } from "../parseur.js";
import { avertissements, reussi, forme, parVoie, projets, causePrincipale, tentatives as toutesTentatives } from "../analyse.js";
import { court, hm, hhmm, mmss, semaineDe, ajouterJours } from "../dates.js";
import { salleDe, sallesPour, voiesEnPlace, hexDe, texteSur, libelleVoie, secteurDe, cotationDe } from "../salles.js";

export const GENRES = { echauffement: "Échauffement", securite: "Sécurité", facile: "Facile", effort: "Effort", recup: "Récupération" };
export const RES_LABEL = { ok: "Réussi", sec: "Avec sec", ko: "Échec" };
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
const actives = etapes => etapes.filter(e => e.type !== "info");
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
export const salleCourante = (ctx, s, sa, disc) => salleDe(ctx.doc, sa.salle || (ctx.doc.reglages.salleParDefaut || {})[disc]);
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
  for (const f of ctx.bilan.nouveauxFeux) out = h`${out}<div class="carte feu-carte"><div><b>🟢 Feu vert : ${f.titre}</b><br><span class="petit">${f.criteres.map(c => `${c.t} : ${c.val}${c.pct ? " %" : ""}`).join(" · ")}</span></div><button data-act="feuVu" data-id="${f.id}">Vu !</button></div>`;
  // La séance d'hier à régler
  const hier = seanceARegler(ctx.programme, doc, auj);
  if (hier && hier.id !== s.id && plusTard() === `${hier.id}|${auj}`) out = h`${out}<button class="hier-mini" data-act="hierRouvrir"><span>${court(hier.date)} · ${hier.activite} : bilan ?</span><span>›</span></button>`;
  else if (hier && hier.id !== s.id) { const eh = etatSeance(hier, ctx.saisie(hier.id), auj);
    out = h`${out}<div class="carte hier"><div><b>${court(hier.date)} · ${hier.activite}</b><br><span class="petit">${eh === "abilan" ? "Séance terminée, il manque le bilan (effort, douleur)." : eh === "encours" ? "Séance restée ouverte." : "Faite ? Sautée ? Dis-le en un appui, ou laisse."}</span></div>
      <div class="hier-btns"><button class="principal" data-act="hierBilan" data-id="${hier.id}">${eh === "passee" ? "Faite → bilan" : "Bilan"}</button>${si(eh === "passee", h`<button data-act="hierSautee" data-id="${hier.id}">Sautée</button>`)}<button data-act="hierPlusTard" data-id="${hier.id}">Plus tard</button></div></div>`; }

  // Bandeau
  const sousTitre = sa.fin ? `✓ Faite en ${hm(dureeReelle(sa))} · prévu ≈ ${hm(duree)}` : etat === "sautee" ? `Sautée${sa.raison ? " · " + sa.raison : ""}` : `≈ ${hm(duree)} · ${actives(etapes).length} étapes`;
  const theme = etapes.find(e => e.type === "info" && /^thème/i.test(e.texte));
  out = h`${out}<div class="bandeau-seance ${enCours ? "reduit" : ""}"><h1>${s.activite}${s.libre ? " · séance créée" : ""}</h1><div class="phase">${s.phase}${s.modifie ? " · modifiée" : ""}${s.dateFixee ? ` · déplacée (prévue ${court(s.datePrevue)})` : ""}</div><div class="sous-titre">${sousTitre}</div>
    ${theme ? h`<div class="theme">🎯 ${lier(theme.texte.replace(/^thème[^:]*:\s*/i, ""), data.exercices)}</div>` : ""}
    ${si(avant && versions.length > 1, h`<div class="segment blanc">${versions.map((v, n) => h`<button data-act="version" data-n="${n}" class="${(sa.version || 0) === n ? "choisi" : ""}">${v.replace(/\s*\(.*\)\s*$/, "")}</button>`)}</div>`)}
    ${si(avant, h`<button class="gros blanc" data-act="demarrer">${ico("play")} Commencer</button><div class="liens"><button class="lien-blanc" data-act="sauterOuvrir">Séance sautée</button><button class="lien-blanc" data-act="bilanOuvrir">Déjà faite ? Bilan</button></div>`)}
    ${si(etat === "abilan", h`<button class="gros blanc" data-act="bilanOuvrir">Donner le bilan</button>`)}
    ${frise(ctx, s, sa, etapes, enCours ? courante : null)}
  </div>`;

  // Avertissements, et la version allégée si elle existe
  const averts = avertissements(s, ctx.programme, doc), fj = forme(sa, data.params);
  for (const a of averts) out = h`${out}<div class="avert">${ico("alerte")} ${a}</div>`;
  const allegee = versions.findIndex(v => /allég|léger|legere|court|récup/i.test(v));
  if (avant && allegee >= 0 && allegee !== (sa.version || 0) && (averts.length || fj === "rouge")) out = h`${out}<div class="avert">Il existe une version « ${versions[allegee]} » : <button class="lien" data-act="version" data-n="${allegee}">la prendre aujourd'hui</button></div>`;

  // Carte Maintenant
  if (enCours) {
    const ecoule = (Date.now() - sa.debut - (sa.pauseTotale || 0)) / 1000, suivante = etapeSuivante(sa, etapes);
    out = h`${out}<div class="carte maintenant">
      <div class="ligne-haut"><span>${fj ? h`<span class="point ${fj}"></span>` : ""}Depuis ${hhmm(sa.debut)} · ${hm(ecoule)} · fin estimée ${hhmm(Date.now() + Math.max(0, duree - ecoule) * 1000)}</span></div>
      ${si(!sa.recup, h`<div class="forme-ligne"><span class="petit">Forme ?</span><button data-act="forme" data-f="bien">🙂 Bien</button><button data-act="forme" data-f="moyen">😐 Moyen</button><button data-act="forme" data-f="pastop">😣 Pas top</button></div>`)}
      ${courante && actives(etapes).every(e => etapeFinie(sa, e)) ? h`<p class="tout-fait">✓ Toutes les étapes sont faites. Fin de séance quand tu veux.</p>`
      : courante ? h`<div class="maintenant-etape"><span class="genre genre-${courante.type === "routine" ? courante.genre || "echauffement" : courante.genre}"></span><b>${courante.type === "routine" ? courante.nom : titreAction(courante)}</b>${courante.type === "action" && courante.n > 1 ? h` <span class="petit">${avecRonds(courante) ? `${nbFait(sa, courante)}/${courante.n}` : courante.grimpe ? `${nbNotes(sa, courante)}/${courante.n * Math.max(1, courante.serie || 1)} notés` : `× ${courante.n}`}</span>` : ""}</div>
        <div class="boutons-maintenant">${boutonsEtape(ctx, s, sa, courante, true)}
          ${avecRonds(courante) && nbFait(sa, courante) < courante.n ? h`<button class="principal" data-act="rond" data-k="${courante.k}" data-i="${nbFait(sa, courante)}">+1 · ${nbFait(sa, courante) + 1}/${courante.n}</button>${suivante ? h`<button data-act="suivant">Passer à : ${titreDe(suivante)} ›</button>` : ""}`
            : h`<button class="principal" data-act="suivant">✓ Fait${suivante ? h` · suivant : ${titreDe(suivante)}` : ""}</button>`}</div>` : ""}
      <div class="boutons-bas"><button data-act="douleurOuvrir">${ico("alerte")} Douleur</button><button class="danger-contour" data-act="bilanOuvrir">${ico("stop")} Fin de séance</button></div>
    </div>`;
  }

  // Résumé après la séance
  if (sa.fin && etat === "faite") { const t = sa.tentatives || [], ok = t.filter(reussi).length;
    out = h`${out}<div class="carte resume"><div class="ligne-res"><span>Effort</span><b>${sa.effort ?? "—"}/10</b></div>
      <div class="ligne-res"><span>Douleur après</span><b>${sa.douleur && sa.douleur.apres ? `${sa.douleur.apres}/10 · ${sa.douleur.zone || ""}` : "aucune"}</b></div>
      ${t.length ? h`<div class="ligne-res"><span>${disc === "Bloc" ? "Blocs réussis" : "Voies réussies"}</span><b>${ok} sur ${t.length}</b></div>` : ""}
      ${sa.notes ? h`<p class="petit">« ${sa.notes} »</p>` : ""}
      <div class="liens"><button class="lien" data-act="bilanOuvrir">Modifier le bilan</button><button class="lien" data-act="reprendre">Reprendre la séance</button></div></div>`; }
  if (etat === "sautee") out = h`${out}<p class="petit centre">Séance sautée · <button class="lien" data-act="desauter">annuler</button></p>`;

  // Les voies : projets, cotations visées, nouvelles
  if (estGrimpe && (enCours || sa.fin || (sa.tentatives || []).length || avant)) out = h`${out}${carteVoies(ctx, s, sa, etapes, disc, enCours || avant)}`;

  // Le plan : replié pendant une séance de grimpe en cours (la carte Maintenant suffit), ouvert sinon
  const infos = etapes.filter(e => e.type === "info"), faites = actives(etapes).filter(e => etapeFinie(sa, e)).length;
  const replie = enCours && estGrimpe && !state.ouverts.has("plan");
  out = h`${out}${enCours && estGrimpe ? h`<button class="pli titre-plan" data-act="plier" data-k="plan">${replie ? "▸" : "▾"} Plan de séance <span class="petit">${faites}/${actives(etapes).length} faites</span></button>` : h`<h2 class="section">Plan de séance${sa.debut ? h` <span class="petit">${faites}/${actives(etapes).length} faites</span>` : ""}</h2>`}
  ${si(!replie, () => h`<div class="etapes">
    ${si(infos.length, h`<button class="pli" data-act="plier" data-k="consignes">${state.ouverts.has("consignes") ? "▾" : "▸"} Consignes (${infos.length})</button>${si(state.ouverts.has("consignes"), h`<div class="consignes">${infos.map(e => h`<div class="info">${lier(e.texte, data.exercices)}</div>`)}</div>`)}`)}
    ${actives(etapes).map((e, n) => ligneEtape(ctx, s, sa, e, n + 1, enCours && courante && courante.k === e.k, enCours))}
    ${si(s.libre && !etapes.length, h`<p class="petit">Séance libre : note simplement ce que tu fais.</p>`)}
  </div>`)}`;

  // Tentatives de la séance
  if ((sa.tentatives || []).length) out = h`${out}<div class="carte"><h2>Passages de la séance <span class="petit">${(sa.tentatives || []).filter(reussi).length} / ${sa.tentatives.length}</span></h2>
    ${sa.tentatives.map((v, i) => h`<button class="tentative" data-act="resultatEditer" data-i="${i}"><span class="pastille" style="background:${hexDe(doc, v.couleur)}"></span><span>${libelleVoie(v)}${v.profil ? ` · ${v.profil.toLowerCase()}` : ""}${v.approx ? " · en gros" : ""}</span><span class="res res-${v.res}">${v.res === "sec" ? `${v.sec} sec` : RES_LABEL[v.res]}</span></button>`)}</div>`;
  if (s.libre || s.copie) out = h`${out}<button class="gros contour danger" data-act="supprimerLibre">Supprimer cette séance</button>`;
  return { html: out, titre: h`<b>${court(s.date)}</b> · ${s.activite}`, fleches: true, menu: true, activite: disc === "Bloc" ? "Bloc" : s.activite, infos: "", glisser: !enCours };
}

// Boutons d'une étape : repos, chrono, fractions, guidée (jamais de case à cocher)
function boutonsEtape(ctx, s, sa, e, grands) {
  const { data, doc } = ctx, repos = e.repos ?? reposDefaut(doc.reglages, s.activite);
  return h`${si(e.type === "routine" && data.routines.some(r => r.routine === e.nom && r.duree), h`<button data-act="guide" data-k="${e.k}">${ico("play")} Guidée</button>`)}
    ${si(e.chrono, h`<button data-act="chrono" data-k="${e.k}">${ico("play")} ${mmss(e.chrono || 0)}</button>`)}
    ${si(e.fractions, h`<button data-act="fractions" data-k="${e.k}">${ico("play")} Fractions</button>`)}
    ${si(e.type === "action" && (e.repos || e.grimpe) && repos > 0, h`<button data-act="repos" data-k="${e.k}">${ico("repos")} Repos ${mmss(repos)}</button>`)}
    ${si(grands && doc.reglages.raccourciRepos && e.type === "action" && (e.repos || e.grimpe) && repos > 0, h`<a class="bouton" href="shortcuts://run-shortcut?name=${encodeURIComponent(doc.reglages.raccourciRepos)}&input=text&text=${repos}">🔔 iPhone</a>`)}`;
}

const titreDe = e => e.type === "routine" ? e.nom : titreAction(e);
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
        : h`<div class="texte">${e.n > 1 ? h`<b>${e.n}×</b> ` : ""}${lier(e.texte, data.exercices)}${e.grimpe && e.grimpe.cot ? h` <span class="badge">${e.grimpe.cot}</span>` : ""}${e.feu ? feuBadge(ctx, e.feu) : ""}</div>`}
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
  return h`<div class="frise" aria-hidden="true">${a.map((e, i) => h`<span class="frise-seg genre-${e.type === "routine" ? e.genre || "echauffement" : e.genre} ${classes(etapeFinie(sa, e) && "fait", courante && courante.k === e.k && "ici")}" style="flex-grow:${d[i]}"></span>`)}</div>`;
}
const CLE_PLUS_TARD = "grimpe-hier-plus-tard";
const plusTard = () => { try { return localStorage.getItem(CLE_PLUS_TARD) || ""; } catch { return ""; } };

// --- La carte des voies ---
function carteVoies(ctx, s, sa, etapes, disc, actif) {
  const { doc, state } = ctx, salles = sallesPour(doc, disc), salle = salleCourante(ctx, s, sa, disc);
  const cibles = [...new Set(etapes.filter(e => e.grimpe && e.grimpe.cot).map(e => e.grimpe.cot))];
  let out = h`<div class="carte voies"><div class="ligne-haut"><h2>${disc === "Bloc" ? "Blocs" : "Voies"}</h2>
    ${si(salles.length, h`<div class="choix compact salle-choix">${salles.map(x => h`<button data-act="choisirSalle" data-id="${x.id}" class="${salle && salle.id === x.id ? "choisi" : ""}">${x.nom}</button>`)}<button data-act="choisirSalle" data-id="" class="${!salle ? "choisi" : ""}">sans</button></div>`)}</div>`;
  if (salle) {
    const voies = parVoie(toutesTentatives(ctx.programme, doc)), enPlace = voiesEnPlace(salle, disc), auj = (sa.tentatives || []);
    const histo = id => voies.find(v => v.voieId === id), proj = projets(voies, disc, salle).filter(v => v.voieId && enPlace.some(x => x.id === v.voieId));
    const tuile = v => { const hv = histo(v.id), t = auj.filter(x => x.voieId === v.id), hex = hexDe(doc, v.couleur, salle), sec = secteurDe(salle, v);
      return h`<button class="tuile-voie ${t.length ? (t.some(reussi) ? "ok-auj" : "ko-auj") : ""}" data-act="voieRapide" data-id="${v.id}" style="background:${hex};color:${texteSur(hex)}"><b>${v.etoile ? "★ " : ""}${v.cotSalle || v.cot || "?"}</b>${pictoProfil(v.profil, "picto-tuile")}<span>${v.nom || (sec ? sec.nom : "") || (v.profil || "").toLowerCase()}</span>
        ${hv ? h`<span class="tuile-histo">${hv.reussies ? "✓" : ""}${hv.essais - hv.reussies ? `✗${hv.essais - hv.reussies}` : ""}${t.length ? ` · auj. ${t.map(x => x.res === "ok" ? "✓" : x.res === "sec" ? "s" : "✗").join("")}` : ""}</span>` : h`<span class="tuile-histo">jamais</span>`}</button>`; };
    const etoilees = enPlace.filter(v => v.etoile), dejaVue = v => v.etoile || proj.some(p => p.voieId === v.id);
    if (etoilees.length) out = h`${out}<h3>★ À essayer <span class="petit">${etoilees.length}</span></h3><div class="tuiles">${etoilees.map(tuile)}</div>`;
    const projVoies = proj.map(v => enPlace.find(x => x.id === v.voieId)).filter(v => !v.etoile);
    if (projVoies.length) out = h`${out}<h3>Projets <span class="petit">tentés, pas encore enchaînés</span></h3><div class="tuiles">${projVoies.map(tuile)}</div>`;
    const parCot = c => enPlace.filter(v => (v.cot === c || v.cotSalle === c) && !dejaVue(v));
    for (const c of cibles) { const l = parCot(c); if (l.length) out = h`${out}<h3>En ${c} <span class="petit">${l.length}</span></h3><div class="tuiles">${l.map(tuile)}</div>`; }
    const autres = enPlace.filter(v => !dejaVue(v) && !cibles.some(c => v.cot === c || v.cotSalle === c));
    if (autres.length) out = h`${out}<button class="pli" data-act="plier" data-k="autresVoies">${state.ouverts.has("autresVoies") ? "▾" : "▸"} Autres voies de la salle (${autres.length})</button>${si(state.ouverts.has("autresVoies"), h`<div class="tuiles">${autres.map(tuile)}</div>`)}`;
    if (!enPlace.length) out = h`${out}<p class="petit">Aucune voie connue dans cette salle : ajoute-les au fil des séances, elles resteront.</p>`;
    out = h`${out}<div class="liens"><button class="gros contour" data-act="nouvelleVoieOuvrir">+ Nouvelle ${disc === "Bloc" ? "bloc" : "voie"}</button></div>`;
  } else {
    // Sans salle : les cotations visées, un appui = un passage
    const cots = cibles.length ? cibles : ctx.data.echelles[disc].slice(3, 9);
    out = h`${out}<div class="cot-rapide">${cots.map(c => h`<div class="cot-ligne"><b>${c}</b><button class="ok" data-act="noterRapide" data-cot="${c}" data-res="ok">✓</button>${si(disc === "Voie", h`<button class="sec" data-act="noterRapide" data-cot="${c}" data-res="sec">sec</button>`)}<button class="ko" data-act="noterRapide" data-cot="${c}" data-res="ko">✗</button></div>`)}</div>
      <p class="petit">Un appui = un passage, modifiable ensuite dans la liste. <button class="lien" data-act="resultat">Autre cotation, profil…</button>${si(!salles.length, h` · <button class="lien" data-act="ouvrirVue" data-vue="salles">Créer ta salle</button> pour retrouver tes voies.`)}</p>`;
  }
  return h`${out}</div>`;
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
  ctx.toast(`${RES_LABEL[t.res]} · ${libelleVoie(t)}`, () => ctx.store.annuler());
  const e = t.k ? etapeDe(ctx, s, ctx.saisie(s.id), t.k) : null;
  if (e && ctx.doc.reglages.reposAuto && (e.repos || e.grimpe)) lancerRepos(ctx, s, ctx.saisie(s.id), e);
}

export const actions = {
  version: (ctx, d) => { const s = courant(ctx); ctx.modifierSeance(s.id, "version", sa => { sa.version = +d.n; }); ctx.rendre(); },
  demarrer: ctx => { const s = courant(ctx), disc = discipline(s, ctx.saisie(s.id)), candidates = sallesPour(ctx.doc, disc);
    ctx.modifierSeance(s.id, "début de séance", x => { x.debut = Date.now(); delete x.fin; delete x.statut;
      if (s.date !== ctx.aujourdhui()) x.dateReelle = ctx.aujourdhui(); else delete x.dateReelle;           // faite un autre jour que prévu : datée du jour réel
      if (!x.salle) x.salle = (ctx.doc.reglages.salleParDefaut || {})[disc] || (candidates.length === 1 ? candidates[0].id : ""); }); ctx.rendre(true); },
  // « ✓ Fait · suivant » : coche l'étape en cours et passe à la prochaine pas encore faite
  suivant: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), etapes = etapesSeance(s, sa), c = etapeCourante(sa, etapes); if (!c) return;
    ctx.modifierSeance(s.id, "étape faite", x => { demarrerSiBesoin(x); x.faites = x.faites || {}; if (!avecRonds(c)) x.faites[c.k] = Math.max(1, x.faites[c.k] || 0);
      const n = prochaineApres(x, etapes, c.k); if (n) x.curseur = n.k; else delete x.curseur; }); ctx.rendre(); },
  // Case ✓ : coche ou décoche ; cocher l'étape en cours fait avancer
  cocher: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), etapes = etapesSeance(s, sa), e = etapes.find(x => x.k === d.k), finie = etapeFinie(sa, e), cour = etapeCourante(sa, etapes);
    ctx.modifierSeance(s.id, finie ? "étape décochée" : "étape faite", x => { x.faites = x.faites || {};
      if (finie) { if (e.grimpe && nbNotes(x, e) >= e.n * Math.max(1, e.serie || 1)) x.faites[e.k] = -1; else delete x.faites[e.k]; } else { demarrerSiBesoin(x); x.faites[e.k] = avecRonds(e) ? e.n : 1; if (cour && cour.k === e.k) { const n = prochaineApres(x, etapes, e.k); if (n) x.curseur = n.k; else delete x.curseur; } } }); ctx.rendre(); },
  // Rond i : un passage de plus (ou de moins si on retouche le dernier rond plein) ; la dernière fait avancer
  rond: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), etapes = etapesSeance(s, sa), e = etapes.find(x => x.k === d.k), i = +d.i, n = nbFait(sa, e), cour = etapeCourante(sa, etapes);
    const nouveau = i < n ? i : i + 1;
    ctx.modifierSeance(s.id, "passage", x => { demarrerSiBesoin(x); x.faites = x.faites || {}; if (nouveau) x.faites[e.k] = nouveau; else delete x.faites[e.k];
      if (nouveau >= e.n && cour && cour.k === e.k) { const p = prochaineApres(x, etapes, e.k); if (p) x.curseur = p.k; else delete x.curseur; } });
    if (nouveau > n && nouveau < e.n && ctx.doc.reglages.reposAuto) lancerRepos(ctx, s, ctx.saisie(s.id), e);
    ctx.rendre(); },
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
  choisirSalle: (ctx, d) => { const s = courant(ctx), disc = discipline(s, ctx.saisie(s.id));
    ctx.modifier("salle", doc => { const sa = doc.seances[s.id] = doc.seances[s.id] || {}; sa.salle = d.id; doc.reglages.salleParDefaut = { ...(doc.reglages.salleParDefaut || {}), [disc]: d.id }; }, { annulable: false }); ctx.rendre(); },
  voieRapide: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discipline(s, sa), salle = salleCourante(ctx, s, sa, disc), v = salle.voies.find(x => x.id === d.id);
    ctx.ouvrirModal({ type: "voieRapide", seanceId: s.id, salleId: salle.id, voieId: v.id, disc, res: "", sec: 1, cause: "" }); },
  noterRapide: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discipline(s, sa);
    ajouterTentative(ctx, s, { t: Date.now(), k: cleRattachement(ctx, s, sa, disc), disc, cot: d.cot, cotSalle: "", profil: "", res: d.res, ...(d.res === "sec" ? { sec: 1 } : {}) }); ctx.rendre(); },
  nouvelleVoieOuvrir: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discipline(s, sa), salle = salleCourante(ctx, s, sa, disc), c = cotationDe(salle, disc);
    ctx.ouvrirModal({ type: "nouvelleVoie", seanceId: s.id, salleId: salle.id, disc, couleur: "", cotSalle: "", chiffre: "", nom: "", profil: "", secteurId: ctx.state.dernierSecteur || "", mode: c.mode }); },
  resultat: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), disc = discipline(s, sa), dernier = (sa.tentatives || []).slice(-1)[0];
    ctx.ouvrirModal({ type: "resultat", seanceId: s.id, k: cleRattachement(ctx, s, sa, disc), disc, cot: dernier ? dernier.cot : "", profil: "Vertical", res: "", sec: 1, style: "À vue", couleur: "", nom: "", cause: "", salle: sa.salle || "" }); },
  resultatEditer: (ctx, d) => { const s = courant(ctx), sa = ctx.saisie(s.id), t = sa.tentatives[+d.i]; ctx.ouvrirModal({ type: "resultat", seanceId: s.id, edit: +d.i, ...t, sec: t.sec || 1, profil: t.profil || "Vertical", style: t.style || "À vue" }); },
  douleurOuvrir: ctx => ctx.ouvrirModal({ type: "douleur", seanceId: courant(ctx).id, zone: "", niveau: 3 }),
  sauterOuvrir: ctx => ctx.ouvrirModal({ type: "sauter", seanceId: courant(ctx).id, raison: "" }),
  bilanOuvrir: (ctx, d) => { const s = d && d.id ? ctx.seance(d.id) : courant(ctx), sa = ctx.saisie(s.id), disc = discipline(s, sa);
    // Heures proposées : celles de la séance si elle a été suivie, sinon la durée prévue finissant maintenant (aujourd'hui) ou à partir de 18 h (un autre jour)
    const prevue = dureeSeance(s, etapesSeance(s, sa), ctx.data, ctx.doc.reglages) * 1000, jour = sa.dateReelle || s.date, auj = ctx.aujourdhui();
    let debut = sa.debut, fin = sa.fin || (sa.debut ? Date.now() : null);
    if (!debut) { if (jour === auj) { fin = Date.now(); debut = fin - prevue; } else { debut = new Date(`${jour}T18:00:00`).getTime(); fin = debut + prevue; } }
    if (sa.duree != null && sa.debut) fin = sa.debut + sa.duree * 60000;
    ctx.ouvrirModal({ type: "bilan", seanceId: s.id, disc, effort: sa.effort ?? "", apres: (sa.douleur || {}).apres ?? 0, zone: (sa.douleur || {}).zone || "", notes: sa.notes || "", hDebut: hhmm(debut), hFin: hhmm(fin), jour,
      grille: Object.fromEntries([...new Set((sa.tentatives || []).filter(t => t.approx).map(t => t.cot + "|" + t.res))].map(k => [k, (sa.tentatives || []).filter(t => t.approx && t.cot + "|" + t.res === k).length])), details: false }); },
  hierBilan: (ctx, d) => actions.bilanOuvrir(ctx, { id: d.id }),                                   // on reste sur la séance du jour
  hierSautee: (ctx, d) => ctx.ouvrirModal({ type: "sauter", seanceId: d.id, raison: "" }),
  hierPlusTard: (ctx, d) => { try { localStorage.setItem(CLE_PLUS_TARD, `${d.id}|${ctx.aujourdhui()}`); } catch { /* ignore */ } ctx.rendre(); },   // replié jusqu'à demain
  hierRouvrir: ctx => { try { localStorage.removeItem(CLE_PLUS_TARD); } catch { /* ignore */ } ctx.rendre(); },
  etoileVoie: (ctx, d) => { ctx.modifier("voie à essayer", doc => { const v = salleDe(doc, d.salle).voies.find(x => x.id === d.id); if (v.etoile) delete v.etoile; else v.etoile = ctx.aujourdhui(); }); ctx.rendre(); },
  feuVu: (ctx, d) => { ctx.modifier("feu vert vu", doc => { doc.feuxVus[d.id] = ctx.aujourdhui(); }, { annulable: false }); ctx.rendre(); },
  menu: ctx => ctx.ouvrirModal({ type: "menu", seanceId: courant(ctx).id }),
  supprimerLibre: ctx => { const s = courant(ctx); if (!confirm("Supprimer cette séance et ses saisies ?")) return;
    ctx.modifier("suppression de séance", d => { d.ops = d.ops.filter(o => o.cible !== s.id); delete d.seances[s.id]; }); ctx.state.seanceId = null; ctx.ouvrir("programme"); },
  prec: ctx => naviguer(ctx, -1), suiv: ctx => naviguer(ctx, 1),
};
function naviguer(ctx, pas) { const P = ctx.programme, i = P.findIndex(s => s.id === courant(ctx).id); const n = P[i + pas]; if (n) { ctx.state.seanceId = n.id; ctx.state.ouverts = new Set(); ctx.rendre(true); } }
