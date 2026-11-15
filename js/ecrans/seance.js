// ecrans/seance.js — l'écran Séance, vu du mur : rien n'est demandé pendant la séance.
// Le plan se lit, un curseur dit où on en est, les voies se touchent, la douleur et la fin ont un bouton. C'est tout.
import { h, si, classes, lier } from "../html.js";
import { etapesSeance, dureeEtape, dureeSeance, etatSeance, discipline, reposDefaut, seanceARegler } from "../programme.js";
import { versionsDe, titreAction } from "../parseur.js";
import { avertissements, reussi, forme, parVoie, projets, causePrincipale, tentatives as toutesTentatives } from "../analyse.js";
import { court, hm, hhmm, mmss, semaineDe } from "../dates.js";
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
export function etapeCourante(sa, etapes) { const a = actives(etapes); if (!a.length) return null; return a.find(e => e.k === sa.curseur) || a[0]; }
const etapeSuivante = (sa, etapes) => { const a = actives(etapes), i = a.findIndex(e => e.k === (etapeCourante(sa, etapes) || {}).k); return a[i + 1] || null; };
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
  if (hier && hier.id !== s.id && state.hierIgnoree !== hier.id) { const eh = etatSeance(hier, ctx.saisie(hier.id), auj);
    out = h`${out}<div class="carte hier"><div><b>${court(hier.date)} · ${hier.activite}</b><br><span class="petit">${eh === "abilan" ? "Séance terminée, il manque le bilan (effort, douleur)." : eh === "encours" ? "Séance restée ouverte." : "Faite ? Sautée ? Dis-le en un appui, ou laisse."}</span></div>
      <div class="hier-btns"><button class="principal" data-act="hierBilan" data-id="${hier.id}">${eh === "passee" ? "Faite → bilan" : "Bilan"}</button>${si(eh === "passee", h`<button data-act="hierSautee" data-id="${hier.id}">Sautée</button>`)}<button data-act="hierPlusTard" data-id="${hier.id}">Plus tard</button></div></div>`; }

  // Bandeau
  const sousTitre = sa.fin ? `✓ Faite en ${hm(dureeReelle(sa))} · prévu ≈ ${hm(duree)}` : etat === "sautee" ? `Sautée${sa.raison ? " · " + sa.raison : ""}` : `≈ ${hm(duree)} · ${actives(etapes).length} étapes`;
  const theme = etapes.find(e => e.type === "info" && /^thème/i.test(e.texte));
  out = h`${out}<div class="bandeau-seance ${enCours ? "reduit" : ""}"><h1>${s.activite}${s.libre ? " · séance créée" : ""}</h1><div class="phase">${s.phase}${s.modifie ? " · modifiée" : ""}${s.dateFixee ? ` · déplacée (prévue ${court(s.datePrevue)})` : ""}</div><div class="sous-titre">${sousTitre}</div>
    ${theme ? h`<div class="theme">🎯 ${lier(theme.texte.replace(/^thème[^:]*:\s*/i, ""), data.exercices)}</div>` : ""}
    ${si(avant && versions.length > 1, h`<div class="segment blanc">${versions.map((v, n) => h`<button data-act="version" data-n="${n}" class="${(sa.version || 0) === n ? "choisi" : ""}">${v.replace(/\s*\(.*\)\s*$/, "")}</button>`)}</div>`)}
    ${si(avant, h`<button class="gros blanc" data-act="demarrer">▶ Commencer</button><div class="liens"><button class="lien-blanc" data-act="sauterOuvrir">Séance sautée</button><button class="lien-blanc" data-act="bilanOuvrir">Déjà faite ? Bilan</button></div>`)}
    ${si(etat === "abilan", h`<button class="gros blanc" data-act="bilanOuvrir">Donner le bilan</button>`)}
  </div>`;

  // Avertissements, et la version allégée si elle existe
  const averts = avertissements(s, ctx.programme, doc), fj = forme(sa, data.params);
  for (const a of averts) out = h`${out}<div class="avert">⚠ ${a}</div>`;
  const allegee = versions.findIndex(v => /allég|léger|legere|court|récup/i.test(v));
  if (avant && allegee >= 0 && allegee !== (sa.version || 0) && (averts.length || fj === "rouge")) out = h`${out}<div class="avert">Il existe une version « ${versions[allegee]} » : <button class="lien" data-act="version" data-n="${allegee}">la prendre aujourd'hui</button></div>`;

  // Carte Maintenant
  if (enCours) {
    const ecoule = (Date.now() - sa.debut - (sa.pauseTotale || 0)) / 1000, suivante = etapeSuivante(sa, etapes);
    out = h`${out}<div class="carte maintenant">
      <div class="ligne-haut"><span>${fj ? h`<span class="point ${fj}"></span>` : ""}Depuis ${hhmm(sa.debut)} · ${hm(ecoule)} · fin estimée ${hhmm(Date.now() + Math.max(0, duree - ecoule) * 1000)}</span></div>
      ${si(!sa.recup, h`<div class="forme-ligne"><span class="petit">Forme ?</span><button data-act="forme" data-f="bien">🙂 Bien</button><button data-act="forme" data-f="moyen">😐 Moyen</button><button data-act="forme" data-f="pastop">😣 Pas top</button></div>`)}
      ${courante ? h`<div class="maintenant-etape"><span class="genre genre-${courante.type === "routine" ? courante.genre || "echauffement" : courante.genre}"></span><b>${courante.type === "routine" ? courante.nom : titreAction(courante)}</b>${courante.type === "action" && courante.n > 1 ? h` <span class="petit">× ${courante.n}</span>` : ""}</div>
        <div class="boutons-maintenant">${boutonsEtape(ctx, s, sa, courante, true)}
          ${suivante ? h`<button class="principal" data-act="suivant">Suivant : ${suivante.type === "routine" ? suivante.nom : titreAction(suivante)} ›</button>` : h`<span class="petit">Dernière étape du plan.</span>`}</div>` : ""}
      <div class="boutons-bas"><button data-act="douleurOuvrir">⚠ Douleur</button><button class="danger-contour" data-act="bilanOuvrir">■ Fin de séance</button></div>
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

  // Le plan
  const infos = etapes.filter(e => e.type === "info");
  out = h`${out}<h2 class="section">Plan de séance</h2><div class="etapes">
    ${si(infos.length, h`<button class="pli" data-act="plier" data-k="consignes">${state.ouverts.has("consignes") ? "▾" : "▸"} Consignes (${infos.length})</button>${si(state.ouverts.has("consignes"), h`<div class="consignes">${infos.map(e => h`<div class="info">${lier(e.texte, data.exercices)}</div>`)}</div>`)}`)}
    ${actives(etapes).map((e, n) => ligneEtape(ctx, s, sa, e, n + 1, enCours && courante && courante.k === e.k, enCours))}
    ${si(s.libre && !etapes.length, h`<p class="petit">Séance libre : note simplement ce que tu fais.</p>`)}
  </div>`;

  // Tentatives de la séance
  if ((sa.tentatives || []).length) out = h`${out}<div class="carte"><h2>Passages de la séance <span class="petit">${(sa.tentatives || []).filter(reussi).length} / ${sa.tentatives.length}</span></h2>
    ${sa.tentatives.map((v, i) => h`<button class="tentative" data-act="resultatEditer" data-i="${i}"><span class="pastille" style="background:${hexDe(doc, v.couleur)}"></span><span>${libelleVoie(v)}${v.profil ? ` · ${v.profil.toLowerCase()}` : ""}${v.approx ? " · en gros" : ""}</span><span class="res res-${v.res}">${v.res === "sec" ? `${v.sec} sec` : RES_LABEL[v.res]}</span></button>`)}</div>`;
  if (s.libre) out = h`${out}<button class="gros contour danger" data-act="supprimerLibre">Supprimer cette séance</button>`;
  return { html: out, titre: h`<b>${court(s.date)}</b> · ${s.activite}`, fleches: true, menu: true, activite: disc === "Bloc" ? "Bloc" : s.activite, infos: s.phase };
}

// Boutons d'une étape : repos, chrono, fractions, guidée (jamais de case à cocher)
function boutonsEtape(ctx, s, sa, e, grands) {
  const { data, doc } = ctx, repos = e.repos ?? reposDefaut(doc.reglages, s.activite);
  return h`${si(e.type === "routine" && data.routines.some(r => r.routine === e.nom && r.duree), h`<button data-act="guide" data-k="${e.k}">▶ Guidée</button>`)}
    ${si(e.chrono, h`<button data-act="chrono" data-k="${e.k}">▶ ${mmss(e.chrono || 0)}</button>`)}
    ${si(e.fractions, h`<button data-act="fractions" data-k="${e.k}">▶ Fractions</button>`)}
    ${si(e.type === "action" && (e.repos || e.grimpe) && repos > 0, h`<button data-act="repos" data-k="${e.k}">⏱ Repos ${mmss(repos)}</button>`)}
    ${si(grands && doc.reglages.raccourciRepos && e.type === "action" && (e.repos || e.grimpe) && repos > 0, h`<a class="bouton" href="shortcuts://run-shortcut?name=${encodeURIComponent(doc.reglages.raccourciRepos)}&input=text&text=${repos}">🔔 iPhone</a>`)}`;
}

function ligneEtape(ctx, s, sa, e, num, actuelle, enCours) {
  const { data, state } = ctx, ouverte = state.ouverts.has("e" + e.k);
  const genre = e.type === "routine" ? e.genre || "echauffement" : e.genre, titre = e.type === "routine" ? e.nom : titreAction(e), duree = dureeEtape(e, s, data, ctx.doc.reglages);
  const notees = e.grimpe ? (sa.tentatives || []).filter(t => t.k === e.k).length : 0;
  const mesure = e.mesure ? h`<span class="mesure-champ"><input type="number" inputmode="decimal" step="any" data-act="mesureSaisie" data-k="${e.k}" data-cle="${e.mesure}" value="${(sa.mesures || {})[e.mesure] ?? ""}" placeholder="—"></span>` : "";
  return h`<div class="etape genre-${genre} ${classes(actuelle && "actuelle")}" data-k="${e.k}">
    <div class="etape-ligne">
      <button class="etape-txt" data-act="plier" data-k="e${e.k}"><span class="num">${actuelle ? "▶" : num}</span><span class="titre">${titre}${e.type === "action" && e.n > 1 ? h` <span class="petit">× ${e.n}</span>` : ""}${notees ? h` <span class="badge">${notees}/${e.n * Math.max(1, e.serie || 1)} noté${notees > 1 ? "s" : ""}</span>` : ""}</span><span class="petit duree">${hm(duree)}</span></button>
      ${mesure}
      ${si(enCours && !actuelle, h`<button class="curseur" data-act="allerA" data-k="${e.k}" aria-label="J'en suis là">⤵</button>`)}
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
      return h`<button class="tuile-voie ${t.length ? (t.some(reussi) ? "ok-auj" : "ko-auj") : ""}" data-act="voieRapide" data-id="${v.id}" style="background:${hex};color:${texteSur(hex)}"><b>${v.cotSalle || v.cot || "?"}</b><span>${v.nom || (sec ? sec.nom : "") || (v.profil || "").toLowerCase()}</span>
        ${hv ? h`<span class="histo">${hv.reussies ? "✓" : ""}${hv.essais - hv.reussies ? `✗${hv.essais - hv.reussies}` : ""}${t.length ? ` · auj. ${t.map(x => x.res === "ok" ? "✓" : x.res === "sec" ? "s" : "✗").join("")}` : ""}</span>` : h`<span class="histo">jamais</span>`}</button>`; };
    if (proj.length) out = h`${out}<h3>Projets <span class="petit">tentés, pas encore enchaînés</span></h3><div class="tuiles">${proj.map(v => tuile(enPlace.find(x => x.id === v.voieId)))}</div>`;
    const parCot = c => enPlace.filter(v => (v.cot === c || v.cotSalle === c) && !proj.some(p => p.voieId === v.id));
    for (const c of cibles) { const l = parCot(c); if (l.length) out = h`${out}<h3>En ${c} <span class="petit">${l.length}</span></h3><div class="tuiles">${l.map(tuile)}</div>`; }
    const autres = enPlace.filter(v => !proj.some(p => p.voieId === v.id) && !cibles.some(c => v.cot === c || v.cotSalle === c));
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
  ctx.modifierSeance(s.id, "passage noté", sa => { sa.tentatives = sa.tentatives || []; demarrerSiBesoin(sa); sa.tentatives.push(t); });
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
  suivant: ctx => { const s = courant(ctx), sa = ctx.saisie(s.id), n = etapeSuivante(sa, etapesSeance(s, sa)); if (n) ctx.modifierSeance(s.id, "étape suivante", x => { x.curseur = n.k; }, { annulable: false }); ctx.rendre(); },
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
    ctx.ouvrirModal({ type: "bilan", seanceId: s.id, disc, effort: sa.effort ?? "", apres: (sa.douleur || {}).apres ?? 0, zone: (sa.douleur || {}).zone || "", notes: sa.notes || "", duree: sa.duree ?? (sa.debut ? Math.round(((sa.fin || Date.now()) - sa.debut - (sa.pauseTotale || 0)) / 60000) : Math.round(dureeSeance(s, etapesSeance(s, sa), ctx.data, ctx.doc.reglages) / 60)),
      grille: Object.fromEntries([...new Set((sa.tentatives || []).filter(t => t.approx).map(t => t.cot + "|" + t.res))].map(k => [k, (sa.tentatives || []).filter(t => t.approx && t.cot + "|" + t.res === k).length])), details: false }); },
  hierBilan: (ctx, d) => actions.bilanOuvrir(ctx, { id: d.id }),                                   // on reste sur la séance du jour
  hierSautee: (ctx, d) => ctx.ouvrirModal({ type: "sauter", seanceId: d.id, raison: "" }),
  hierPlusTard: (ctx, d) => { ctx.state.hierIgnoree = d.id; ctx.rendre(); },
  feuVu: (ctx, d) => { ctx.modifier("feu vert vu", doc => { doc.feuxVus[d.id] = ctx.aujourdhui(); }, { annulable: false }); ctx.rendre(); },
  menu: ctx => ctx.ouvrirModal({ type: "menu", seanceId: courant(ctx).id }),
  supprimerLibre: ctx => { const s = courant(ctx); if (!confirm("Supprimer cette séance et ses saisies ?")) return;
    ctx.modifier("suppression de séance", d => { d.ops = d.ops.filter(o => o.cible !== s.id); delete d.seances[s.id]; }); ctx.state.seanceId = null; ctx.ouvrir("programme"); },
  prec: ctx => naviguer(ctx, -1), suiv: ctx => naviguer(ctx, 1),
};
function naviguer(ctx, pas) { const P = ctx.programme, i = P.findIndex(s => s.id === courant(ctx).id); const n = P[i + pas]; if (n) { ctx.state.seanceId = n.id; ctx.state.ouverts = new Set(); ctx.rendre(true); } }
