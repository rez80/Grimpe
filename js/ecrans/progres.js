// ecrans/progres.js — d'abord un tableau de bord (4 tuiles, et la douleur récente), une ligne de conseil, ensuite le détail. Rien n'est calculé ici.
import { h, si, lier, pli, info, ico, forcerOuvert } from "../html.js";
import { court, semaineDe, ecartJours, hm } from "../dates.js";
import { etapesSeance, dureeSeance, etatSeance } from "../programme.js";
import { dureeMinutes } from "../analyse.js";
import { hexDe, salleDe } from "../salles.js";

const FORME = { vert: "Bonne forme", orange: "Forme moyenne", rouge: "Forme basse" };
const barre = (val, max, classe = "") => h`<span class="barre ${classe}"><span style="width:${max ? Math.min(100, val / max * 100) : 0}%"></span></span>`;

export function rendre(ctx) {
  const B = ctx.bilan, { data, doc, state } = ctx;
  let out = h``;
  for (const f of B.nouveauxFeux) out = h`${out}<div class="carte feu-carte"><div><b><span class="feu-pt ok"></span> Feu vert : ${f.titre}</b><br><span class="petit">${f.criteres.map(c => `${c.t} : ${c.val}${c.pct ? " %" : ""}`).join(" · ")}</span></div><button data-act="feuVu" data-id="${f.id}">Vu !</button></div>`;

  // Douleur récente (épisode en cours, ou moins de 14 jours) : un bandeau rouge au-dessus de tout ; sinon rien
  const recente = B.episodes.filter(e => !e.fin || ecartJours(e.dernier, B.aujourdhui) <= 14).sort((a, b) => b.dernier < a.dernier ? -1 : 1)[0];
  if (recente) { const j = ecartJours(recente.dernier, B.aujourdhui);
    out = h`${out}<button class="bandeau-douleur" data-act="pgOuvrir" data-cle="pg-douleurs">${ico("alerte")} <span><b>Douleur : ${recente.zone} ${recente.max}/10</b> · ${j === 0 ? "aujourd'hui" : j === 1 ? "hier" : `il y a ${j} jours`}${recente.fin ? "" : " · en cours"}</span><span class="bande-go">›</span></button>`; }

  // Le tableau de bord : 4 tuiles (un appui ouvre la section détaillée)
  const ech = data.echelles, wNow = semaineDe(B.dateDebut, B.aujourdhui);
  const fleche = disc => { const m = B.meilleures.filter(x => x[`${disc}-Vertical`]); if (m.length < 2) return ""; const r = x => ech[disc].indexOf(String(x[`${disc}-Vertical`]).replace(/\+$/, ""));
    const d = r(m[m.length - 1]) - Math.max(...m.slice(0, -1).map(r)); return d > 0 ? "↑" : ""; };
  const niv = ["Voie", "Bloc"].map(disc => { const c = Object.values(B.consolides).find(x => x.disc === disc && x.groupe === "Vertical"); return [disc, c && c.niveau]; });
  const feuxP = B.feux.filter(f => !f.info), feuxOk = feuxP.filter(f => f.ok).length;
  const chS = B.charge.semaines, cur = (chS.find(x => x.semaine === wNow) || {}).charge || 0, prev = chS.filter(x => x.semaine < wNow).slice(-4), moy = prev.length ? prev.reduce((t, x) => t + x.charge, 0) / prev.length : 0;
  // Escalade cette semaine : les heures de grimpe (voie, bloc, extérieur) faites et prévues ; course, maison et autres sports à part
  const grimpe = x => ["Voie", "Bloc", "Escalade extérieur"].includes(x.activite);
  const semPrevues = ctx.programme.filter(x => x.semaine === wNow && !x.bonus && grimpe(x)), faitesSem = semPrevues.filter(x => ctx.saisie(x.id).fin).length;
  const minPrevues = Math.round(semPrevues.reduce((t, x) => t + dureeSeance(x, etapesSeance(x, ctx.saisie(x.id)), data, doc.reglages), 0) / 60);
  const minFaites = Math.round(ctx.programme.filter(x => x.semaine === wNow && grimpe(x) && ctx.saisie(x.id).fin).reduce((t, x) => t + (dureeMinutes(ctx.saisie(x.id)) || 0), 0));
  const rapport = moy ? cur / moy : null, nbProj = B.voies.filter(v => v.essais > 0 && v.reussies === 0 && (v.voieId || v.couleur || v.nom)).length;
  out = h`${out}<div class="tuiles-bord">
    <button class="tuile-bord" data-act="pgOuvrir" data-cle="pg-niveau" style="--t:var(--voie)"><span class="tb-titre">Niveau</span><span class="tb-val">${niv.map(([d, n]) => h`<span class="tb-niv"><span class="petit">${d}</span> <b>${n || "—"}</b>${n && fleche(d) ? h` <span class="tb-up">${fleche(d)}</span>` : ""}</span>`)}</span></button>
    <button class="tuile-bord" data-act="pgOuvrir" data-cle="pg-feux" style="--t:#2E9E6B"><span class="tb-titre">Feux verts</span><span class="tb-val"><b class="tb-grand">${feuxOk}</b> <span class="petit">/ ${feuxP.length}</span></span><span class="jauge"><i style="width:${feuxP.length ? 100 * feuxOk / feuxP.length : 0}%"></i></span></button>
    <button class="tuile-bord" data-act="pgOuvrir" data-cle="pg-charge" style="--t:#7A5BB5"><span class="tb-titre">Escalade cette semaine</span><span class="tb-val"><b class="tb-grand">${hm(minFaites * 60)}</b> <span class="petit">sur ≈ ${hm(minPrevues * 60)}</span></span><span class="jauge"><i style="width:${minPrevues ? Math.min(100, 100 * minFaites / minPrevues) : 0}%"></i></span><span class="petit">${faitesSem}/${semPrevues.length} séance${semPrevues.length > 1 ? "s" : ""} · heures de grimpe, hors course et autres sports</span></button>
    <button class="tuile-bord" data-act="pgOuvrir" data-cle="pg-projets" style="--t:var(--rouge)"><span class="tb-titre">Projets</span><span class="tb-val"><span class="tb-ko">✗</span> <b class="tb-grand">${nbProj}</b></span><span class="petit">essayés, pas encore réussis</span></button>
  </div>`;

  // Le conseil : une carte, avec l'avancement vers le prochain cap et un accès direct ; la forme et la vigilance sur leur propre ligne
  const conseil = B.phrases.find(p => /^(cap|faible|aisance)/.test(p.cle)) || B.phrases[0], SECTION = { cap: "pg-feux", faible: "pg-travailler", aisance: "pg-niveau", niveau: "pg-niveau", semaine: "pg-charge" };
  const feuCap = conseil && conseil.cle === "cap" ? B.feux.find(f => !f.ok && !f.info) : null, critCap = feuCap ? feuCap.criteres.filter(c => !c.ok && !c.coche).sort((a, b) => a.val / (a.cible || 1) - b.val / (b.cible || 1))[0] : null;
  // Un bouton seulement s'il mène ailleurs : la prochaine séance dure (celle des essais sur l'objectif)
  const auj = ctx.aujourdhui(), prochaineDure = ctx.programme.find(x => x.date >= auj && /« Projet »/.test(x.contenu) && !["faite", "abilan", "sautee"].includes(etatSeance(x, ctx.saisie(x.id), auj)));
  // Forme basse ou moyenne et un autre sport soutenu au programme cette semaine : le conseil le dit
  const soutenu = ctx.programme.find(x => x.semaine === wNow && x.date >= auj && x.activite === "Autre sport" && /intensité soutenue/.test(x.contenu) && !ctx.saisie(x.id).fin);
  const alerteForme = B.formeJour && B.formeJour.forme !== "vert" && soutenu ? `Forme ${B.formeJour.forme === "rouge" ? "basse" : "moyenne"} : passe l'autre sport soutenu de ${soutenu.jour.toLowerCase()} en facile, ou reporte-le.` : "";
  out = h`${out}<div class="carte carte-conseil"><div class="cc-tete">${ico("ampoule")}<b>Conseil</b></div>
    ${conseil ? h`<p>${conseil.texte}</p>` : h`<p>Pas encore de quoi dire quelque chose : grimpe, note deux ou trois voies, et reviens.</p>`}
    ${si(critCap, () => h`<span class="jauge cc-jauge"><i style="width:${Math.min(100, 100 * critCap.val / (critCap.cible || 1))}%"></i></span>`)}
    ${si(alerteForme, () => h`<p class="cc-forme">${alerteForme}</p>`)}
    ${si(prochaineDure, () => h`<button class="petit-btn" data-act="ouvrirSeance" data-id="${prochaineDure.id}">Prochaine séance dure : ${prochaineDure.jour.toLowerCase()} ${court(prochaineDure.date)} ›</button>`)}</div>
    <div class="carte compacte ligne-forme forme-${B.formeJour ? B.formeJour.forme : "aucune"}"><div class="ligne-res"><span>Forme</span><b>${B.formeJour ? h`<span class="point ${B.formeJour.forme}"></span>${FORME[B.formeJour.forme]} <span class="petit">(${court(B.formeJour.date)})</span>` : h`<span class="petit">pas encore notée (au début d'une séance)</span>`}</b></div>
    ${B.vigilance.filter(v => v.niveau !== "vert").map(v => h`<div class="vig ${v.niveau}">${v.texte}</div>`)}</div>`;

  // Projets en cours (toutes salles)
  const proj = B.voies.filter(v => v.essais > 0 && v.reussies === 0 && (v.voieId || v.couleur || v.nom)).sort((a, b) => b.derniere < a.derniere ? -1 : 1).slice(0, 8);
  if (proj.length) out = h`${out}${pli("pg-projets", true, "Projets", () => h`<p class="petit">Essayés, pas encore réussis (✗ sur le mur). Touche un projet pour sa fiche (ajouter un passage, corriger).</p>${proj.map(v => h`<button class="ligne-res ligne-bouton" data-act="${v.voieId ? "projetOuvrir" : ""}" data-id="${v.voieId}" data-salle="${v.salle}"><span><span class="pastille" style="background:${hexDe(doc, v.couleur)}"></span> ${v.disc === "Bloc" ? "Bloc" : "Voie"} ${v.cotSalle || v.cot || "?"}${v.nom ? " · " + v.nom : ""} <span class="petit">${(v.profil || "").toLowerCase()}${(sl => sl ? ` · ${sl.nom}` : "")(ctx.doc.salles.find(x => x.id === v.salle || x.voies.some(y => y.id === v.voieId)))}</span></span><span class="petit"><span class="ce ko">✗</span> ${v.essais} essai${v.essais > 1 ? "s" : ""}${v.premiere && v.premiere !== v.derniere ? ` depuis ${court(v.premiere)}` : v.derniere ? ` · ${court(v.derniere)}` : ""}</span></button>`)}`, { resume: String(proj.length), classe: "carte" })}`;

  // Feux verts avec projection
  out = h`${out}${pli("pg-feux", true, B.bloc ? `Feux verts · ${B.bloc.nom}${B.bloc.titre ? " " + B.bloc.titre : ""}` : "Feux verts", () => h`${info("feux")}${B.feux.map(f => { const p = B.projection[f.id]; return h`<div class="feu ${f.ok ? "ok" : ""}"><div class="feu-titre">${f.info && !f.ok ? h`<span class="feu-info">${ico("info")}</span>` : h`<span class="feu-pt ${f.ok ? "ok" : ""}"></span>`} ${f.titre}</div>
    ${f.criteres.map(c => c.coche ? h`<div class="crit crit-coche"><span>${c.t}</span><button class="case-feu ${c.ok ? "ok" : ""}" data-act="feuCoche" data-bloc="${f.bloc}" data-cle="${c.coche}" aria-pressed="${c.ok ? "true" : "false"}">${c.ok ? "✓ Fait" : "À cocher"}</button></div>`
      : c.detail ? h`<div class="crit"><span>${c.t}</span>${barre(c.val, c.cible, c.ok ? "ok" : "")}<b>${c.detail}</b></div>`
      : h`<div class="crit"><span>${c.t}</span>${barre(c.val, c.cible, c.ok ? "ok" : "")}<b>${c.val}${c.pct ? " %" : ""} / ${c.cible}${c.pct ? " %" : ""}</b></div>`)}
    ${si(p && B.recul, () => h`<p class="petit">${p.semaines ? `À ce rythme : ${p.semaines > 26 ? "plus de six mois" : p.semaines === 1 ? "une semaine" : p.semaines + " semaines"}.` : p.val > 0 ? "Pas d'avancée sur quatre semaines." : ""}</p>`)}</div>`; })}`, { resume: `${B.feux.filter(f => f.ok && !f.info).length} / ${B.feux.filter(f => !f.info).length}`, classe: "carte" })}`;

  out = h`${out}${pli("pg-niveau", false, "Niveau consolidé", () => h`${info("niveau")}<p class="petit">≥ ${Math.round(B.params.consolide_taux * 100)} % de réussite sur ≥ ${B.params.consolide_essais} essais.</p>
    <div class="grille-niv">${Object.values(B.consolides).map(c => h`<div class="niv"><span class="petit">${c.disc} · ${c.groupe}</span>${c.niveau ? h`<span class="niv-tag niv-cot niv-${c.disc === "Bloc" ? "bloc" : "voie"}">${c.niveau}</span>` : h`<b>—</b>`}</div>`)}</div>
    ${pli("pg-niveau-detail", false, "Détail par cotation", () => Object.values(B.consolides).filter(c => c.detail.length).map(c => h`<p class="petit"><b>${c.disc} · ${c.groupe}</b></p>${c.detail.map(d => h`<div class="crit"><span>${d.cot}</span>${barre(d.taux, 1, d.taux >= B.params.consolide_taux ? "ok" : "")}<b>${Math.round(d.taux * 100)} % · ${d.essais}</b></div>`)}`))}`, { resume: Object.values(B.consolides).filter(c => c.niveau).map(c => `${c.disc}${c.groupe === "Dévers" ? " dévers" : ""} ${c.niveau}`).join(" · "), classe: "carte" })}`;

  const pf = B.pointsFaibles;
  if (pf.profil || pf.cause || pf.carac) out = h`${out}${pli("pg-travailler", false, "À travailler", () => h`<p class="petit">${B.params.faible_semaines ?? 8} dernières semaines.</p>
    ${si(pf.profil, h`<p><b>${pf.profil && pf.profil.profil}</b> : ${pf.profil && Math.round(pf.profil.taux * 100)} % de réussite sur ${pf.profil && pf.profil.essais} essais.${pf.profil && pf.profil.conseil ? h` <span class="petit">${pf.profil.conseil.pourquoi}</span><br>${lier(pf.profil.conseil.exercices, data.exercices)}` : ""}</p>`)}
    ${si(pf.carac, () => h`<p><b>${pf.carac.carac}</b> : ${Math.round(pf.carac.taux * 100)} % de réussite sur ${pf.carac.essais} essais — la caractéristique la moins réussie.${pf.carac.conseil ? h` <span class="petit">${pf.carac.conseil.pourquoi}</span><br>${lier(pf.carac.conseil.exercices, data.exercices)}` : ""}</p>
      ${si((pf.caracs || []).length > 1, () => h`<p class="petit">Par caractéristique : ${pf.caracs.map(c => `${c.carac} ${Math.round(c.taux * 100)} % (${c.essais})`).join(" · ")}</p>`)}`)}
    ${si(pf.cause, h`<p>Cause d'échec la plus fréquente : <b>${pf.cause && pf.cause.cause}</b> (${pf.cause && pf.cause.n} fois).${pf.cause && pf.cause.conseil ? h` <span class="petit">${pf.cause.conseil.pourquoi}</span><br>${lier(pf.cause.conseil.exercices, data.exercices)}` : ""}</p>`)}`, { resume: [pf.profil && pf.profil.profil, pf.cause && pf.cause.cause].filter(Boolean).join(" · "), classe: "carte" })}`;

  const ch = B.charge, max = Math.max(1, ...ch.semaines.map(w => w.charge));
  out = h`${out}${pli("pg-charge", false, "Charge par semaine", () => h`${info("charge")}<p class="petit">Minutes × effort.</p>
    ${ch.semaines.length ? h`<div class="histo">${ch.semaines.map(w => h`<div class="col" title="S${w.semaine}"><span class="col-barre" style="height:${w.charge / max * 100}%"></span><span class="petit">S${w.semaine}</span></div>`)}</div>
      <p class="petit">4 dernières semaines : ${ch.recentes} · 4 précédentes : ${ch.precedentes}${ch.precedentes ? ` · rapport ${(ch.recentes / ch.precedentes).toFixed(2)}` : ""}</p>` : h`<p class="petit">Aucune séance terminée.</p>`}`, { resume: ch.precedentes ? `rapport ${(ch.recentes / ch.precedentes).toFixed(2)}` : ch.semaines.length ? `${ch.semaines.length} sem.` : "", classe: "carte" })}`;

  if (B.meilleures.length) out = h`${out}${pli("pg-meilleures", false, "Meilleure cotation réussie", () => h`<table class="tableau"><tr><th>Sem.</th><th>Voie vert.</th><th>Voie dév.</th><th>Bloc vert.</th><th>Bloc dév.</th></tr>
    ${B.meilleures.map(w => h`<tr><td>${w.semaine}</td><td>${w["Voie-Vertical"] || ""}</td><td>${w["Voie-Dévers"] || ""}</td><td>${w["Bloc-Vertical"] || ""}</td><td>${w["Bloc-Dévers"] || ""}</td></tr>`)}</table>`, { classe: "carte", resume: (() => { const d = B.meilleures[B.meilleures.length - 1] || {}; return [d["Voie-Vertical"] && `voie ${d["Voie-Vertical"]}`, d["Bloc-Vertical"] && `bloc ${d["Bloc-Vertical"]}`].filter(Boolean).join(" · "); })() })}`;

  const enCours = B.episodes.filter(e => !e.fin).length;
  out = h`${out}${pli("pg-douleurs", false, "Douleurs", () => h`${B.episodes.length ? B.episodes.slice().reverse().map(e => h`<div class="ligne-res"><span>${e.zone} <span class="petit">${court(e.debut)}${e.fin ? " → " + court(e.fin) : ""}</span></span><b class="${e.fin ? "" : "rouge-txt"}">${e.fin ? "terminé" : "en cours"} · max ${e.max}/10</b></div>`) : h`<p class="petit">Aucune douleur signalée.</p>`}
    ${si(B.signalements.length, () => pli("pg-signalements", false, "Signalements (corriger une erreur)", () => B.signalements.slice().reverse().map(x => h`<div class="ligne-res"><span>${court(x.date)} · ${x.zone} <span class="petit">${x.quand}</span></span><span><b>${x.niveau}/10</b> <button class="hv-suppr" data-act="signalementSupprimer" data-s="${x.seanceId}" data-quand="${x.quand}" data-i="${x.i ?? ""}" aria-label="Supprimer ce signalement">✕</button></span></div>`), { resume: String(B.signalements.length) }))}`, { resume: enCours ? `${enCours} en cours` : B.episodes.length ? "aucune en cours" : "", classe: "carte" })}`;

  const mes = Object.entries(doc.mesures).filter(([, m]) => Object.keys(m).length).sort((a, b) => +a[0] - +b[0]);
  if (mes.length) { const cles = [...new Set(mes.flatMap(([, m]) => Object.keys(m)))].filter(k => k !== "notes");
    out = h`${out}${pli("pg-mesures", false, "Mesures", () => h`${info("mesures", "Ce que mesurent ces tests")}<table class="tableau"><tr><th>Sem.</th>${cles.map(k => h`<th>${k}</th>`)}</tr>${mes.map(([w, m]) => h`<tr><td>${w}</td>${cles.map(k => h`<td>${m[k] ?? ""}</td>`)}</tr>`)}</table>`, { classe: "carte", resume: `${mes.length} semaine${mes.length > 1 ? "s" : ""}` })}`; }
  return { html: out, titre: h`<b>Progrès</b>` };
}
export const actions = {
  feuCoche: (ctx, d) => ctx.modifier("feu coché", x => { const b = (x.blocs || []).find(y => y.id === d.bloc); if (!b) return; b.coches = b.coches || {}; if (b.coches[d.cle]) delete b.coches[d.cle]; else b.coches[d.cle] = true; }),
  // Un projet → sa fiche de voie (historique, ajouter, corriger)
  projetOuvrir: (ctx, d) => { const sl = salleDe(ctx.doc, d.salle) || ctx.doc.salles.find(x => x.voies.some(v => v.id === d.id)); const v = sl && sl.voies.find(x => x.id === d.id);
    if (!v) return ctx.toast("Cette voie n'est plus dans tes salles."); ctx.ouvrirModal({ type: "voie", salleId: sl.id, ...v, chiffre: (v.cotSalle || "")[0] || "" }); },
  // Une tuile du tableau de bord : ouvre sa section et s'y place
  pgOuvrir: (ctx, d) => { forcerOuvert(d.cle); ctx.rendre(); const t = document.querySelector(`#ecran [data-act=replier][data-cle="${d.cle}"]`); if (t) ctx.montrer(t.closest(".pli-bloc") || t); },
  signalementSupprimer: (ctx, d) => { ctx.modifierSeance(d.s, "douleur supprimée", sa => { const x = sa.douleur; if (!x) return;
      if (d.quand === "avant") { delete x.avant; delete x.zoneAvant; } else if (d.quand === "après") { delete x.apres; delete x.zone; } else (x.pendant || []).splice(+d.i, 1); });
    ctx.toast("Signalement supprimé", () => ctx.store.annuler()); ctx.rendre(); },
};
