// analyse.js — toutes les règles de calcul, en fonctions pures (aucun accès au stockage, aucun DOM).
// Le téléphone calcule ; l'outil Python ne fait que mettre en page ce que l'export contient.
//
// Entrées : data (data.js), doc (document de l'app), programme (programmeEffectif), aujourdhui (AAAA-MM-JJ).

import { ecartJours, semaineDe, ajouterJours, lundiDe } from "./dates.js";

export const DEVERS = ["Léger dévers", "Dévers", "Fort dévers", "Toit"];
export const enDevers = p => DEVERS.includes(p);
export const groupeProfil = p => enDevers(p) ? "Dévers" : "Vertical";
export const baseCot = c => String(c ?? "").replace(/\+$/, "");       // 5b+ compte comme 5b
export const reussi = t => t.res === "ok";
export const rang = (echelles, disc, cot) => (echelles[disc] || []).indexOf(String(cot));

// --- Toutes les tentatives, à plat, datées ---
export function tentatives(programme, doc) {
  const out = [];
  for (const s of programme) {
    const sa = doc.seances[s.id]; if (!sa) continue;
    for (const t of sa.tentatives || []) out.push({ ...t, date: sa.dateReelle || s.date, seanceId: s.id });
  }
  for (const t of doc.passagesAnciens || []) out.push({ ...t, seanceId: "ancien-" + t.date, approx: true });
  return out;
}
// Identité d'une voie : celle de la salle, sinon cotation + couleur + nom ; une tentative anonyme (y compris approximative) compte pour une voie à elle seule
const identite = (t, n) => t.voieId ? t.voieId : t.couleur || t.nom ? `${t.disc}|${t.cot}|${t.couleur || ""}|${t.nom || ""}` : `#${n}`;
export const differentes = l => new Set(l.map((t, n) => identite(t, n))).size;
export const taux = l => l.length ? l.filter(reussi).length / l.length : 0;

// --- Niveau consolidé : la cotation la plus haute réussie à ≥ taux sur ≥ essais, par discipline × profil groupé ---
export function niveauxConsolides(ts, echelles, params) {
  const essaisMin = params.consolide_essais ?? 5, tauxMin = params.consolide_taux ?? 0.7, out = {};
  for (const disc of ["Voie", "Bloc"]) for (const g of ["Vertical", "Dévers"]) {
    const l = ts.filter(t => t.disc === disc && t.cot && groupeProfil(t.profil) === g);
    let niveau = "", detail = [];
    for (const c of echelles[disc]) {
      const x = l.filter(t => baseCot(t.cot) === c); if (!x.length) continue;
      const r = { cot: c, essais: x.length, taux: taux(x) }; detail.push(r);
      if (x.length >= essaisMin && r.taux >= tauxMin) niveau = c;
    }
    out[`${disc}-${g}`] = { disc, groupe: g, niveau, detail };
  }
  return out;
}

// --- Feux verts ---
export function feuxVerts(ts, programme, doc, params, echelles, aujourdhui, dateDebut) {
  const de = (disc, cot, f = () => true) => ts.filter(t => t.disc === disc && baseCot(t.cot) === cot && f(t));
  const crit = (t, val, cible, pct = false, temps = false) => ({ t, val, cible, pct, temps, ok: val >= cible });   // temps : avance tout seul, pas de projection
  const v5b = de("Voie", "5b"), b5 = de("Bloc", "5");
  const jours = params.feu_volume_jours ?? 28, limite = ajouterJours(aujourdhui, -jours);
  let dmax = 0;
  for (const s of programme) { if (s.date < limite || s.date > aujourdhui) continue;
    const sa = doc.seances[s.id]; if (!sa) continue; const d = sa.douleur || {};
    dmax = Math.max(dmax, +d.avant || 0, +d.apres || 0, ...(d.pendant || []).map(x => +x.niveau || 0)); }
  const niveau = (disc, cots) => { let niv = cots[0];
    for (let k = 0; k < cots.length - 1; k++) if (differentes(de(disc, cots[k], t => enDevers(t.profil) && reussi(t))) >= (params.feu_devers ?? 3)) niv = cots[k + 1]; return niv; };
  const nivVoie = niveau("Voie", ["5a", "5b", "5c", "6a"]), nivBloc = niveau("Bloc", ["4", "5", "6A"]);
  const prochain = (disc, niv) => differentes(de(disc, niv, t => enDevers(t.profil) && reussi(t)));
  const anciennete = Math.max(0, ecartJours(dateDebut, aujourdhui));
  return [
    { id: "voie5c", titre: "Projet en voie 5c", criteres: [crit("Voies 5b différentes enchaînées", differentes(v5b.filter(reussi)), params.feu_5c_voies ?? 10),
                                                           crit("Réussite en 5b", Math.round(taux(v5b) * 100), Math.round((params.feu_5c_taux ?? 0.7) * 100), true)] },
    { id: "voie6a", titre: "Premier essai en 6a", criteres: [crit("Voies 5c différentes réussies", differentes(de("Voie", "5c", reussi)), params.feu_6a_voies ?? 3)] },
    { id: "bloc6", titre: "Projet de bloc 6A", criteres: [crit("Réussite en bloc 5", Math.round(taux(b5) * 100), Math.round((params.feu_bloc6_taux ?? 0.8) * 100), true),
                                                        crit("Blocs 5 différents réussis", differentes(b5.filter(reussi)), params.feu_bloc6_blocs ?? 15),
                                                        crit("Séances avec un bloc 5 réussi", new Set(b5.filter(reussi).map(t => t.seanceId)).size, params.feu_bloc6_seances ?? 4)] },
    { id: "deversVoie", titre: `Voie en dévers : travailler le ${nivVoie}`, info: true, criteres: nivVoie === "6a" ? [] : [crit(`Voies ${nivVoie} différentes réussies en dévers`, prochain("Voie", nivVoie), params.feu_devers ?? 3)] },
    { id: "deversBloc", titre: `Bloc en dévers : travailler le ${nivBloc}`, info: true, criteres: nivBloc === "6A" ? [] : [crit(`Blocs ${nivBloc} différents réussis en dévers`, prochain("Bloc", nivBloc), params.feu_devers ?? 3)] },
    { id: "volume", titre: "Plus de volume", criteres: [crit(`Douleur max sur ${jours} jours ≤ ${params.feu_volume_douleur ?? 2}`, dmax <= (params.feu_volume_douleur ?? 2) ? 1 : 0, 1),
                                                       crit("Jours de programme", anciennete, jours, false, true)] },
  ].map(f => ({ ...f, ok: f.criteres.every(c => c.ok) }));
}
// Feu vert cité dans une ligne : « {feu 5c} » → le feu correspondant
export const feuPour = (feux, cible) => feux.find(f => ({ "5c": "voie5c", "6a": "voie6a", "6A": "bloc6", "6": "bloc6" })[cible] === f.id);

// --- Forme du jour : d'après la dernière récupération notée (doigts, coudes, épaules, énergie, motivation : 1 à 5) et la douleur avant ---
export function forme(saisie, params) {
  const r = saisie && saisie.recup; if (!r) return null;
  const notes = ["doigts", "coudes", "epaules", "energie", "motivation"].map(k => +r[k]).filter(x => x > 0);
  if (!notes.length) return null;
  const douleur = +((saisie.douleur || {}).avant) || 0;
  if (notes.some(n => n <= (params.forme_rouge ?? 2)) || douleur > (params.forme_douleur ?? 2)) return "rouge";
  if (notes.every(n => n >= (params.forme_vert ?? 4)) && douleur === 0) return "vert";
  return "orange";
}
export function derniereForme(programme, doc, aujourdhui, params) {
  for (let k = programme.length - 1; k >= 0; k--) {
    const s = programme[k]; if (s.date > aujourdhui) continue;
    const f = forme(doc.seances[s.id], params); if (f) return { forme: f, date: s.date, seanceId: s.id };
  }
  return null;
}

// --- Douleurs : tous les signalements, puis les épisodes (même zone, clos après « episode_ecart » jours sans signalement) ---
export function signalements(programme, doc) {
  const out = [];
  for (const s of programme) { const sa = doc.seances[s.id]; if (!sa || !sa.douleur) continue; const d = sa.douleur, date = sa.dateReelle || s.date;
    if (+d.avant > 0) out.push({ date, zone: d.zoneAvant || "?", niveau: +d.avant, quand: "avant", seanceId: s.id });
    for (const x of d.pendant || []) out.push({ date, zone: x.zone, niveau: +x.niveau, quand: "pendant", seanceId: s.id });
    if (+d.apres > 0) out.push({ date, zone: d.zone || "?", niveau: +d.apres, quand: "après", seanceId: s.id }); }
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}
export function episodes(sig, params, aujourdhui) {
  const ecart = params.episode_ecart ?? 7, out = [];
  for (const x of sig) {
    const e = out.find(y => y.zone === x.zone && !y.fin && ecartJours(y.dernier, x.date) <= ecart);
    if (e) { e.dernier = x.date; e.max = Math.max(e.max, x.niveau); e.n++; }
    else out.push({ zone: x.zone, debut: x.date, dernier: x.date, max: x.niveau, n: 1, fin: null });
    out.forEach(y => { if (!y.fin && ecartJours(y.dernier, x.date) > ecart) y.fin = ajouterJours(y.dernier, ecart); });
  }
  out.forEach(y => { if (!y.fin && ecartJours(y.dernier, aujourdhui) > ecart) y.fin = ajouterJours(y.dernier, ecart); });
  return out;
}

// --- Charge par semaine : minutes, charge = minutes × effort, par activité ---
export function chargeSemaines(programme, doc, dateDebut, aujourdhui) {
  const W = {};
  for (const s of programme) { const sa = doc.seances[s.id]; if (!sa || !sa.fin) continue;
    const w = semaineDe(dateDebut, sa.dateReelle || s.date), min = dureeMinutes(sa);
    const x = W[w] = W[w] || { semaine: w, seances: 0, minutes: 0, charge: 0, parActivite: {} };
    x.seances++; x.minutes += min; x.charge += min * (+sa.effort || 5); x.parActivite[s.activite] = (x.parActivite[s.activite] || 0) + min; }
  const l = Object.values(W).sort((a, b) => a.semaine - b.semaine);
  const wNow = semaineDe(dateDebut, aujourdhui), somme = (a, b) => l.filter(x => x.semaine >= a && x.semaine <= b).reduce((t, x) => t + x.charge, 0);
  return { semaines: l, recentes: somme(wNow - 3, wNow), precedentes: somme(wNow - 7, wNow - 4) };
}
export const dureeMinutes = sa => sa.duree != null ? +sa.duree : sa.fin && sa.debut ? Math.round((sa.fin - sa.debut - (sa.pauseTotale || 0)) / 60000) : 0;

// --- Points faibles sur les N dernières semaines : profil le moins réussi, cause d'échec la plus fréquente, exercices conseillés ---
export function pointsFaibles(ts, conseils, params, aujourdhui) {
  const depuis = ajouterJours(aujourdhui, -7 * (params.faible_semaines ?? 8)), l = ts.filter(t => t.date >= depuis), min = params.faible_essais ?? 5;
  const parProfil = {}; l.forEach(t => { if (!t.profil) return; (parProfil[t.profil] = parProfil[t.profil] || []).push(t); });
  const profils = Object.entries(parProfil).filter(([, x]) => x.length >= min).map(([p, x]) => ({ profil: p, taux: taux(x), essais: x.length })).sort((a, b) => a.taux - b.taux);
  const causes = {}; l.filter(t => !reussi(t) && t.cause).forEach(t => causes[t.cause] = (causes[t.cause] || 0) + 1);
  const cause = Object.entries(causes).sort((a, b) => b[1] - a[1])[0];
  const conseil = (type, valeur) => conseils.find(c => c.type === type && c.valeur === valeur);
  return { profil: profils[0] ? { ...profils[0], conseil: conseil("Profil", profils[0].profil) } : null,
           cause: cause ? { cause: cause[0], n: cause[1], conseil: conseil("Cause", cause[0]) } : null };
}

// --- Vigilance : la liste des signaux du moment ---
export function vigilance({ programme, doc, params, aujourdhui, formeJour, episodesEnCours, charge, feux }) {
  const out = [];
  if (formeJour && formeJour.forme !== "vert") out.push({ niveau: formeJour.forme, texte: `Forme ${formeJour.forme} à la dernière séance` });
  const sig = signalements(programme, doc).filter(x => ecartJours(x.date, aujourdhui) <= 14);
  const zones = {}; sig.forEach(x => zones[x.zone] = (zones[x.zone] || 0) + 1);
  Object.entries(zones).filter(([, n]) => n >= 2).forEach(([z, n]) => out.push({ niveau: "orange", texte: `${z} : ${n} signalements en 14 jours` }));
  episodesEnCours.forEach(e => out.push({ niveau: e.max >= 5 ? "rouge" : "orange", texte: `Épisode en cours : ${e.zone} depuis le ${e.debut.slice(8, 10)}/${e.debut.slice(5, 7)} (max ${e.max}/10)` }));
  const faites = programme.filter(s => doc.seances[s.id] && doc.seances[s.id].fin && s.date <= aujourdhui).slice(-3).map(s => doc.seances[s.id]);
  const d = faites.map(sa => +(sa.douleur || {}).apres || 0);
  if (d.length === 3 && d[0] < d[1] && d[1] < d[2] && d[2] > 0) out.push({ niveau: "orange", texte: "Douleur en hausse sur 3 séances" });
  const ef = faites.slice(-2).map(sa => +sa.effort || 0);
  if (ef.length === 2 && ef.every(x => x >= 8)) out.push({ niveau: "orange", texte: `Deux séances de suite à effort ≥ 8 (${ef.join(", ")})` });
  if (charge.precedentes > 0 && charge.recentes > (params.charge_hausse ?? 1.3) * charge.precedentes) out.push({ niveau: "orange", texte: "Charge des 4 dernières semaines > 1,3 × les 4 précédentes" });
  feux.filter(f => f.ok && !f.info).forEach(f => out.push({ niveau: "vert", texte: `Feu vert : ${f.titre}` }));
  return out;
}

// --- Avertissements avant une séance donnée (douleur récente, zone récurrente, efforts élevés) ---
export function avertissements(s, programme, doc) {
  const out = [], avant = programme.filter(x => x.date < s.date && ecartJours(x.date, s.date) <= 14);
  const sig = signalements(avant, doc), derniere = [...sig].reverse().find(x => x.niveau >= 3);
  if (derniere) out.push(`Douleur signalée le ${derniere.date.slice(8, 10)}/${derniere.date.slice(5, 7)} : ${derniere.zone} ${derniere.niveau}/10. Échauffement plus long, ménage cette zone, arrête si ça revient.`);
  const zones = {}; sig.forEach(x => zones[x.zone] = (zones[x.zone] || 0) + 1);
  Object.entries(zones).filter(([, n]) => n >= 2).forEach(([z, n]) => out.push(`${z} : ${n} signalements en 14 jours. Allège, et consulte si ça continue.`));
  const ef = avant.filter(x => x.activite === s.activite && doc.seances[x.id] && doc.seances[x.id].effort).slice(-2).map(x => +doc.seances[x.id].effort);
  if (ef.length === 2 && ef.every(x => x >= 8)) out.push(`Effort élevé deux fois de suite (${ef.join(" puis ")}) : version allégée aujourd'hui.`);
  return out;
}

// --- Bilan complet, pour l'écran Progrès et pour l'export ---
export function bilan({ data, doc, programme, aujourdhui }) {
  const params = { ...data.params, ...(doc.reglages.params || {}) }, dateDebut = doc.reglages.dateDebut || data.dateDebut;
  const ts = tentatives(programme, doc);
  const feux = feuxVerts(ts, programme, doc, params, data.echelles, aujourdhui, dateDebut);
  const sig = signalements(programme, doc), ep = episodes(sig, params, aujourdhui), charge = chargeSemaines(programme, doc, dateDebut, aujourdhui);
  const formeJour = derniereForme(programme, doc, aujourdhui, params);
  return { aujourdhui, dateDebut, params, nbTentatives: ts.length, feux, consolides: niveauxConsolides(ts, data.echelles, params), signalements: sig, episodes: ep,
           charge, formeJour, pointsFaibles: pointsFaibles(ts, data.conseils, params, aujourdhui),
           vigilance: vigilance({ programme, doc, params, aujourdhui, formeJour, episodesEnCours: ep.filter(e => !e.fin), charge, feux }),
           meilleures: meilleuresParSemaine(ts, data.echelles, dateDebut) };
}
export function meilleuresParSemaine(ts, echelles, dateDebut) {
  const W = {};
  for (const t of ts.filter(reussi)) { const w = semaineDe(dateDebut, t.date), k = `${t.disc}-${groupeProfil(t.profil)}`;
    const x = W[w] = W[w] || { semaine: w }; if (rang(echelles, t.disc, t.cot) > rang(echelles, t.disc, x[k] || "")) x[k] = t.cot; }
  return Object.values(W).sort((a, b) => a.semaine - b.semaine);
}

// =====================================================================
// Vu du grimpeur : les voies, les projets, les phrases, la projection
// =====================================================================

// --- Par voie : regroupe les tentatives d'une même voie (même identité que « différentes ») ---
export function parVoie(ts) {
  const V = new Map();
  ts.forEach((t, n) => { const id = identite(t, n); const v = V.get(id) || { id, disc: t.disc, cot: t.cot || "", couleur: t.couleur || "", nom: t.nom || "", profil: t.profil || "", salle: t.salle || "", voieId: t.voieId || "", essais: 0, reussies: 0, sec: 0, derniere: "", premiere: "", causes: {}, dernierRes: "" };
    v.essais++; if (t.res === "ok") v.reussies++; if (t.res === "sec") v.sec++; if (t.cause) v.causes[t.cause] = (v.causes[t.cause] || 0) + 1;
    if (!v.premiere || t.date < v.premiere) v.premiere = t.date; if (!v.derniere || t.date >= v.derniere) { v.derniere = t.date; v.dernierRes = t.res; }
    V.set(id, v); });
  return [...V.values()];
}
// Projets : voies tentées, jamais enchaînées, encore en place (si la salle les connaît), de la discipline voulue
export function projets(voies, disc, salle) {
  return voies.filter(v => v.disc === disc && v.essais > 0 && v.reussies === 0 && (!salle || !v.voieId || (salle.voies.find(x => x.id === v.voieId) || {}).statut !== "demontee"))
    .sort((a, b) => b.derniere < a.derniere ? -1 : 1);
}
export const causePrincipale = v => Object.entries(v.causes).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || "";

// --- Feux verts nouvellement atteints, pas encore fêtés ---
export const nouveauxFeux = (feux, feuxVus) => feux.filter(f => f.ok && !f.info && !(feuxVus || {})[f.id]);

// --- Projection : à ce rythme, dans combien de semaines ? (critères de comptage seulement) ---
export function projection(feuxMaintenant, feuxAvant, semaines = 4) {
  const out = {};
  for (const f of feuxMaintenant) { if (f.ok || f.info) continue; const avant = feuxAvant.find(x => x.id === f.id);
    const crit = f.criteres.map((c, i) => ({ ...c, i, avant: avant ? avant.criteres[i].val : 0 })).filter(c => !c.pct && !c.ok && !c.temps);
    if (!crit.length) continue;
    const pire = crit.sort((a, b) => (b.cible - b.val) - (a.cible - a.val))[0], rythme = (pire.val - pire.avant) / semaines;
    out[f.id] = { critere: pire.t, val: pire.val, cible: pire.cible, reste: pire.cible - pire.val, rythme, semaines: rythme > 0 ? Math.ceil((pire.cible - pire.val) / rythme) : null }; }
  return out;
}

// --- Les trois phrases (et la semaine) ---
const pct = x => `${Math.round(x * 100)} %`;
export function phrases({ bilan: B, ts, programme, doc, aujourdhui, echelles, projectionFeux }) {
  const out = [];
  // 0. La semaine en cours
  const lundi = lundiDe(aujourdhui);
  const sem = programme.filter(s => s.date >= lundi && s.date <= aujourdhui && doc.seances[s.id] && doc.seances[s.id].fin), tsSem = ts.filter(t => t.date >= lundi);
  if (sem.length) out.push({ cle: "semaine", texte: `Cette semaine : ${sem.length} séance${sem.length > 1 ? "s" : ""}${tsSem.length ? `, ${tsSem.length} ${tsSem.length > 1 ? "passages" : "passage"}, ${tsSem.filter(reussi).length} réussi${tsSem.filter(reussi).length > 1 ? "s" : ""}` : ""}.` });
  // 1. Le niveau
  for (const disc of ["Voie", "Bloc"]) { const l = ts.filter(t => t.disc === disc); if (!l.length) continue;
    const c = B.consolides[`${disc}-Vertical`], d = B.consolides[`${disc}-Dévers`];
    if (c.niveau) { const det = c.detail.find(x => x.cot === c.niveau); out.push({ cle: "niveau-" + disc, texte: `En ${disc.toLowerCase()}, le ${c.niveau} en vertical est acquis (${det.essais} essais, ${pct(det.taux)} de réussite)${d.niveau ? `, le ${d.niveau} en dévers aussi` : ""}.` }); }
    else { const max = l.filter(reussi).sort((a, b) => rang(echelles, disc, b.cot) - rang(echelles, disc, a.cot))[0];
      out.push({ cle: "niveau-" + disc, texte: `En ${disc.toLowerCase()}, pas encore de niveau consolidé (il faut ${B.params.consolide_essais ?? 5} essais à ${pct(B.params.consolide_taux ?? 0.7)} sur une cotation)${max && max.cot ? ` ; meilleure réussite : ${max.cot}` : ""}.` }); } }
  // 2. Le point faible
  const pf = B.pointsFaibles;
  if (pf.profil) out.push({ cle: "faible", texte: `${pf.profil.profil === "Dévers" || enDevers(pf.profil.profil) ? "Le " + pf.profil.profil.toLowerCase() : "La " + pf.profil.profil.toLowerCase()} reste le point faible : ${pct(pf.profil.taux)} de réussite sur ${pf.profil.essais} essais${pf.cause ? `, et les échecs viennent surtout de « ${pf.cause.cause.toLowerCase()} »` : ""}.` });
  else if (pf.cause) out.push({ cle: "faible", texte: `Les échecs viennent surtout de « ${pf.cause.cause.toLowerCase()} » (${pf.cause.n} fois).` });
  // 3. Le prochain cap
  const prochain = B.feux.find(f => !f.ok && !f.info && projectionFeux[f.id]);
  if (prochain) { const p = projectionFeux[prochain.id];
    out.push({ cle: "cap", texte: `Prochain cap : ${prochain.titre.toLowerCase()} — ${p.critere.toLowerCase()} : ${p.val} sur ${p.cible}${p.semaines ? `, à ce rythme ${p.semaines > 26 ? "dans plus de six mois" : p.semaines === 1 ? "dans une semaine" : `dans ${p.semaines} semaines`}` : p.val > 0 ? ", pas d'avancée sur quatre semaines" : ""}.` }); }
  return out;
}

// --- Bilan étendu : tout ce que les écrans et l'export montrent ---
export function bilanComplet(args) {
  const B = bilan(args), { data, doc, programme, aujourdhui } = args, params = B.params;
  const ts = tentatives(programme, doc), avant = ajouterJours(aujourdhui, -28);
  const feuxAvant = feuxVerts(ts.filter(t => t.date <= avant), programme, doc, params, data.echelles, avant, B.dateDebut);
  const projectionFeux = projection(B.feux, feuxAvant);
  return { ...B, voies: parVoie(ts), projection: projectionFeux, nouveauxFeux: nouveauxFeux(B.feux, doc.feuxVus),
           phrases: phrases({ bilan: B, ts, programme, doc, aujourdhui, echelles: data.echelles, projectionFeux }) };
}
