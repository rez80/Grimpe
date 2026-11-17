// ecrans/progres.js — d'abord trois phrases, ensuite le détail pour les curieux. Rien n'est calculé ici.
import { h, si, lier, pli, info, ico } from "../html.js";
import { court } from "../dates.js";
import { hexDe, salleDe } from "../salles.js";

const FORME = { vert: "Bonne forme", orange: "Forme moyenne", rouge: "Forme basse" };
const barre = (val, max, classe = "") => h`<span class="barre ${classe}"><span style="width:${max ? Math.min(100, val / max * 100) : 0}%"></span></span>`;

export function rendre(ctx) {
  const B = ctx.bilan, { data, doc, state } = ctx;
  let out = h``;
  for (const f of B.nouveauxFeux) out = h`${out}<div class="carte feu-carte"><div><b><span class="feu-pt ok"></span> Feu vert : ${f.titre}</b><br><span class="petit">${f.criteres.map(c => `${c.t} : ${c.val}${c.pct ? " %" : ""}`).join(" · ")}</span></div><button data-act="feuVu" data-id="${f.id}">Vu !</button></div>`;

  // Les phrases
  out = h`${out}<div class="carte phrases carte-liseree">${B.phrases.length ? B.phrases.map(p => h`<p class="${p.cle}">${p.texte}</p>`) : h`<p>Pas encore de quoi dire quelque chose : grimpe, note deux ou trois voies, et reviens.</p>`}
    <div class="ligne-res"><span>Forme</span><b>${B.formeJour ? h`<span class="point ${B.formeJour.forme}"></span>${FORME[B.formeJour.forme]} <span class="petit">(${court(B.formeJour.date)})</span>` : "pas encore notée"}</b></div>
    ${B.vigilance.filter(v => v.niveau !== "vert").map(v => h`<div class="vig ${v.niveau}">${v.texte}</div>`)}</div>`;

  // Projets en cours (toutes salles)
  const proj = B.voies.filter(v => v.essais > 0 && v.reussies === 0 && (v.voieId || v.couleur || v.nom)).sort((a, b) => b.derniere < a.derniere ? -1 : 1).slice(0, 8);
  if (proj.length) out = h`${out}${pli("pg-projets", true, "Projets", () => h`<p class="petit">Essayés, pas encore réussis (✗ sur le mur). Touche un projet pour sa fiche (ajouter un passage, corriger).</p>${proj.map(v => h`<button class="ligne-res ligne-bouton" data-act="${v.voieId ? "projetOuvrir" : ""}" data-id="${v.voieId}" data-salle="${v.salle}"><span><span class="pastille" style="background:${hexDe(doc, v.couleur)}"></span> ${v.disc === "Bloc" ? "Bloc" : "Voie"} ${v.cotSalle || v.cot || "?"}${v.nom ? " · " + v.nom : ""} <span class="petit">${(v.profil || "").toLowerCase()}${(sl => sl ? ` · ${sl.nom}` : "")(ctx.doc.salles.find(x => x.id === v.salle || x.voies.some(y => y.id === v.voieId)))}</span></span><span class="petit"><span class="ce ko">✗</span> ${v.essais} essai${v.essais > 1 ? "s" : ""}${v.premiere && v.premiere !== v.derniere ? ` depuis ${court(v.premiere)}` : v.derniere ? ` · ${court(v.derniere)}` : ""}</span></button>`)}`, { resume: String(proj.length), classe: "carte" })}`;

  // Feux verts avec projection
  out = h`${out}${pli("pg-feux", true, "Feux verts", () => h`${info("feux")}${B.feux.map(f => { const p = B.projection[f.id]; return h`<div class="feu ${f.ok ? "ok" : ""}"><div class="feu-titre">${f.info && !f.ok ? h`<span class="feu-info">${ico("info")}</span>` : h`<span class="feu-pt ${f.ok ? "ok" : ""}"></span>`} ${f.titre}</div>
    ${f.criteres.map(c => h`<div class="crit"><span>${c.t}</span>${barre(c.val, c.cible, c.ok ? "ok" : "")}<b>${c.val}${c.pct ? " %" : ""} / ${c.cible}${c.pct ? " %" : ""}</b></div>`)}
    ${si(p && B.recul, () => h`<p class="petit">${p.semaines ? `À ce rythme : ${p.semaines > 26 ? "plus de six mois" : p.semaines === 1 ? "une semaine" : p.semaines + " semaines"}.` : p.val > 0 ? "Pas d'avancée sur quatre semaines." : ""}</p>`)}</div>`; })}`, { resume: `${B.feux.filter(f => f.ok).length} / ${B.feux.filter(f => !f.info).length}`, classe: "carte" })}`;

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
  // Un projet → sa fiche de voie (historique, ajouter, corriger)
  projetOuvrir: (ctx, d) => { const sl = salleDe(ctx.doc, d.salle) || ctx.doc.salles.find(x => x.voies.some(v => v.id === d.id)); const v = sl && sl.voies.find(x => x.id === d.id);
    if (!v) return ctx.toast("Cette voie n'est plus dans tes salles."); ctx.ouvrirModal({ type: "voie", salleId: sl.id, ...v, chiffre: (v.cotSalle || "")[0] || "" }); },
  signalementSupprimer: (ctx, d) => { ctx.modifierSeance(d.s, "douleur supprimée", sa => { const x = sa.douleur; if (!x) return;
      if (d.quand === "avant") { delete x.avant; delete x.zoneAvant; } else if (d.quand === "après") { delete x.apres; delete x.zone; } else (x.pendant || []).splice(+d.i, 1); });
    ctx.toast("Signalement supprimé", () => ctx.store.annuler()); ctx.rendre(); },
};
