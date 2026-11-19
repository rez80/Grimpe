// ecrans/programme.js — le programme semaine par semaine, la semaine dépliée, les outils de semaine.
import { h, si, classes, ico, pli, forcerOuvert, liste } from "../html.js";
import { etatSeance, etapesSeance, dureeSeance, activiteAffichee, nomSeance } from "../programme.js";
import { semaineDe, dateSeance, ajouterJours, jourMois, court, hm, JOURS, nomJour, jourSemaine } from "../dates.js";
import { reussi } from "../analyse.js";
import { feuxBloc, finBloc } from "../blocs.js";
import * as editeur from "./editeur.js";
import { carteHier } from "./seance.js";

// Repères d'état, les mêmes partout : ✓ faite, ✗ sautée, ● en cours (ou aujourd'hui), ○ à venir, ? passée sans nouvelles
const ICONE = { faite: "✓", abilan: "✓", sautee: "✗", encours: "●", aujourdhui: "●", passee: "?", avenir: "" };

export function rendre(ctx) {
  const P = ctx.programme, { state, doc, data } = ctx, auj = ctx.aujourdhui(), debut = doc.reglages.dateDebut || data.dateDebut;
  const semaines = [...new Set(P.map(s => s.semaine))].sort((a, b) => a - b), wNow = semaineDe(debut, auj);
  if (state.semaineVue !== null && !semaines.includes(state.semaineVue)) state.semaineVue = semaines.includes(wNow) ? wNow : semaines[0];   // null = tout replié
  const phases = []; for (const w of semaines) { const s0 = P.find(s => s.semaine === w && s.bloc) || P.find(s => s.semaine === w) || {}; const bloc = (s0.phase || "").split(" · ")[0], id = s0.bloc || "";
    if (!phases.length || phases[phases.length - 1].bloc !== bloc || phases[phases.length - 1].id !== id) phases.push({ bloc, id, semaines: [] }); phases[phases.length - 1].semaines.push(w); }
  // Un bout du programme de départ qui porte le même nom qu'un bloc construit (ex. semaine 1 avant B1) : à part, « Avant le bloc »
  for (const ph of phases) ph.avant = !ph.id && phases.some(x => x.id && x.bloc === ph.bloc);
  const proch = prochaineSeance(ctx, auj);
  let out = h`<div class="barre-prog"><button class="petit-btn btn-ajout" data-act="semaineAujourdhui">Cette semaine</button>${proch ? h`<button class="petit-btn btn-ajout btn-prochaine" data-act="ouvrirSeance" data-id="${proch.id}">Prochaine séance <span class="petit">${court(proch.date)} · ${nomSeance(proch, ctx.saisie(proch.id))}</span></button>` : ""}</div>${carteRestaurer(ctx)}${carteModele(ctx, wNow)}${carteBilanBloc(ctx, wNow)}${carteHier(ctx)}${carteAujourdhui(ctx, auj)}`;   // la barre d'abord : toujours en haut
  // Les blocs (B1, B2…) : une carte par bloc, son état se voit (en cours : ouvert, bord ocre ; terminé : atténué ; à venir : pointillés).
  // Dedans, une ligne par semaine, avec la phase en pastille de couleur (mêmes couleurs que l'assistant).
  for (const ph of phases) {
    const construit = ph.id ? (doc.blocs || []).find(x => x.id === ph.id) : ph.avant ? null : (doc.blocs || []).filter(x => x.nom === ph.bloc).pop(), semB = P.filter(s => ph.semaines.includes(s.semaine) && !s.bonus), faitesB = semB.filter(s => ctx.saisie(s.id).fin).length;
    const fin = ph.semaines[ph.semaines.length - 1], etat = ph.semaines.includes(wNow) ? "en-cours" : fin < wNow ? "termine" : "avenir";
    const nomB = ph.avant ? "Avant le bloc" : (ph.bloc || "Programme").replace(/^B(\d+)$/, "Bloc $1"), pct = semB.length ? Math.round(100 * faitesB / semB.length) : 0;
    let resume = h`<span class="jauge-mini"><i style="width:${pct}%"></i></span> ${faitesB}/${semB.length}`;
    if (etat === "termine") { const F = construit ? feuxBloc(construit, { programme: P, doc, aujourdhui: dateSeance(debut, fin, "Dimanche"), dateDebut: debut }).filter(f => !f.info) : [];
      resume = h`<span class="petit">${ph.avant ? "passé" : "terminé"} · ${F.length ? `feux ${F.filter(f => f.ok).length}/${F.length}` : `${faitesB}/${semB.length}`}</span>`; }
    if (etat === "avenir") resume = h`<span class="petit">à venir · ${jourMois(dateSeance(debut, ph.semaines[0], "Lundi"))}</span>`;
    const sous = h`${ph.semaines[0] === fin ? `semaine ${fin}` : `semaines ${ph.semaines[0]} → ${fin}`}${construit && construit.plan && construit.plan.objectif ? ` · objectif ${construit.plan.objectif.disc.toLowerCase()} ${construit.plan.objectif.cot}` : ""}`;
    out = h`${out}${pli(`prog-bloc-${ph.id || (ph.avant ? "avant-" : "") + (ph.bloc || "p")}${etat === "termine" ? "-fini" : ""}`, etat === "en-cours", h`<span class="bloc-nom">${nomB}${construit ? ` · ${construit.titre}` : ""}</span><span class="bloc-sous petit">${sous}</span>`, () => contenuBloc(ph, construit), { resume, classe: `carte bloc-prog bloc-${etat}` })}`;
  }
  function contenuBloc(ph, construit) { let o = h``;
    for (const w of ph.semaines) {
      const sem = P.filter(s => s.semaine === w), principales = sem.filter(s => !s.bonus), faites = principales.filter(s => ctx.saisie(s.id).fin).length, phase = (sem[0] || {}).phase || "", ph2 = phaseDe(phase);
      const ouverte = state.semaineVue === w;
      o = h`${o}<div class="semaine ${classes(ouverte && "ouverte", w === wNow && "courante")}">
        <button class="semaine-tete" data-act="semaine" data-w="${w}"><span><b>Semaine ${w}</b> <span class="petit">${w === wNow ? "cette semaine" : `dès le ${jourMois(dateSeance(debut, w, "Lundi"))}`}</span></span><span class="sem-droite">${ph2.nom ? h`<span class="chip-phase ph-${ph2.type}">${ph2.nom}</span>` : ""}<span class="petit">${faites}/${principales.length}</span></span></button>
        ${si(ouverte, () => semaineDetail(ctx, w, sem, auj))}</div>`;
    }
    return o; }
  return { html: out, titre: h`<b>Programme</b>` };
}

// La phase d'une semaine : son nom court (« Construction », « Consolider le 5b ») et son type (pour la couleur de la pastille)
const TYPES_PHASE = [["decharge", /décharge/i], ["realisation", /réalisation/i], ["respiration", /respiration/i], ["construction", /construction/i], ["base", /\bbase\b/i]];
export function phaseDe(label) { const nom = String(label || "").replace(/^[^·]*·\s*/, "").replace(/^S\d+(-\d+)?\s+/, "").trim(); return { nom, type: (TYPES_PHASE.find(([, re]) => re.test(nom)) || ["autre"])[0] }; }

// Fin d'un bloc construit : son bilan (feux, séances, niveau avant / après) et « Construire le bloc suivant », pendant 2 semaines
function carteBilanBloc(ctx, wNow) {
  const { doc, data } = ctx, debut = doc.reglages.dateDebut || data.dateDebut, B = ctx.bilan;
  const vu = id => { try { return !!localStorage.getItem(`grimpe-bilan-bloc-${id}`); } catch { return false; } };
  return (doc.blocs || []).filter(b => finBloc(b) < wNow && wNow <= finBloc(b) + 2 && !vu(b.id)).map(b => {
    const fin = dateSeance(debut, finBloc(b), "Dimanche"), F = feuxBloc(b, { programme: ctx.programme, doc, aujourdhui: fin, dateDebut: debut }).filter(f => !f.info);
    const S = ctx.programme.filter(s => s.bloc === b.id && !s.bonus), faites = S.filter(s => ctx.saisie(s.id).fin).length, disc = (b.plan && b.plan.objectif && b.plan.objectif.disc) || "Bloc";
    const avant = b.plan && b.plan.depart ? b.plan.depart[disc] : "", apres = (B.consolides[`${disc}-Vertical`] || {}).niveau || "—";
    return h`<div class="carte carte-bilan-bloc"><div class="cc-tete">${ico("cible")}<b>${b.nom} · ${b.titre} : terminé</b></div>
      <div class="ligne-res"><span>Séances faites</span><b>${faites}/${S.length}</b></div>
      <div class="ligne-res"><span>Niveau consolidé en ${disc.toLowerCase()}</span><b>${avant || "—"} → ${apres}</b></div>
      ${F.map(f => h`<div class="ligne-res"><span>${f.titre}</span><b class="${f.ok ? "ok" : ""}">${f.ok ? "✓ atteint" : "pas encore"}</b></div>`)}
      <div class="ed-rangee"><button class="principal" data-act="assistantOuvrir" data-suite="${b.id}">Construire le bloc suivant</button><button data-act="bilanBlocVu" data-id="${b.id}">Plus tard</button></div></div>`; });
}

// App vide (nouvelle installation, téléphone changé…) : proposer tout de suite de restaurer une sauvegarde
const CLE_VIDE = "grimpe-depart-vide-vu";
function carteRestaurer(ctx) {
  const d = ctx.doc, vide = !Object.keys(d.seances || {}).length && !(d.salles || []).length && !(d.passagesAnciens || []).length;
  let vu = false; try { vu = !!localStorage.getItem(CLE_VIDE); } catch { /* ignore */ }
  if (!vide || vu) return "";
  return h`<div class="carte carte-restaurer"><b>Tu avais déjà des données ?</b><p class="petit">Restaure-les depuis une sauvegarde (fichier, texte copié, ou GitHub).</p>
    <div class="ed-rangee"><button class="principal" data-act="copierOuExporter">Restaurer…</button><button data-act="departVide">Non, je commence</button></div></div>`;
}

// Le bloc 1 refait ensemble (modèle « Le 5 en bloc ») : proposé une fois, jusqu'à ce qu'il soit créé ou écarté
const CLE_MODELE = "grimpe-modele-cinq-bloc-vu";
function carteModele(ctx, wNow) {
  let vu = false; try { vu = !!localStorage.getItem(CLE_MODELE); } catch { /* ignore */ }
  if (vu || wNow > 8 || (ctx.doc.blocs || []).some(b => b.plan && b.plan.modele === "cinq-bloc")) return "";
  return h`<div class="carte carte-modele"><b>Ton bloc 1 refait est prêt</b><p class="petit">« Le 5 en bloc » remplace les semaines 2 à 8 : objectif bloc 5 consolidé, dévers facile, hauteur en voie. Les séances déjà faites restent.</p>
    <div class="ed-rangee"><button class="principal" data-act="assistantOuvrir" data-modele="cinq-bloc" data-recap="1">Voir et créer</button><button data-act="modeleEcarter">Plus tard</button></div></div>`;
}

// La prochaine séance à faire : après aujourd'hui, pas encore commencée ni faite ni sautée (une séance faite en avance n'y est plus)
export function prochaineSeance(ctx, auj) {
  return ctx.programme.find(s => { const sa = ctx.saisie(s.id); return s.date > auj && !s.bonus && !sa.debut && !sa.fin && etatSeance(s, sa, auj) !== "sautee" && !(sa.dateReelle && sa.dateReelle <= auj); }) || null;
}
// La carte du haut : seulement les séances du jour (prévues aujourd'hui, ou faites aujourd'hui en avance) ; la suivante est un bouton à côté de « Cette semaine »
function carteAujourdhui(ctx, auj) {
  const P = ctx.programme, ok = s => etatSeance(s, ctx.saisie(s.id), auj) !== "sautee";
  const du = P.filter(s => ((ctx.saisie(s.id).dateReelle || s.date) === auj) && ok(s));
  if (!du.length) return "";
  return h`<div class="carte carte-auj"><p class="petit">Aujourd'hui</p>${du.map(s => { const sa = ctx.saisie(s.id), e = etatSeance(s, sa, auj), et = etapesSeance(s, sa);
    const fait = e === "faite" || e === "abilan", reel = sa.debut && sa.fin ? Math.round(((sa.duree != null ? sa.duree * 60 : (sa.fin - sa.debut - (sa.pauseTotale || 0)) / 1000))) : null;
    return h`<button class="auj-seance" data-act="ouvrirSeance" data-id="${s.id}" data-activite="${activiteAffichee(s, sa)}"><span><b>${nomSeance(s, sa)}</b>${s.bonus ? h` <span class="tag-bonus">bonus</span>` : ""}<br><span class="petit">${s.date === auj ? "" : `prévue ${court(s.date)} · `}${fait && reel != null ? `✓ faite en ${hm(reel)}` : `≈ ${hm(dureeSeance(s, et, ctx.data, ctx.doc.reglages))}${fait ? " · ✓ faite" : e === "encours" ? " · en cours" : ""}`}</span></span><span class="auj-go" aria-hidden="true">›</span></button>`; })}</div>`;
}

function semaineDetail(ctx, w, sem, auj) {
  const { doc, data } = ctx, debut = doc.reglages.dateDebut || data.dateDebut, lundi = dateSeance(debut, w, "Lundi");
  const jours = JOURS.map((j, i) => { const d = ajouterJours(lundi, i); return { j, d, seances: ctx.programme.filter(s => s.date === d) }; });
  const mesures = doc.mesures[w] && Object.keys(doc.mesures[w]).length, wNow = semaineDe(debut, auj);
  // À faire (semaine en cours) : les séances à régler et les mesures, sans reproche
  const aFaire = [];
  if (w === wNow) {
    ctx.programme.filter(s => s.date < auj && s.date >= ajouterJours(lundi, -7) && (s.bonus ? ["abilan", "encours"] : ["abilan", "encours", "passee"]).includes(etatSeance(s, ctx.saisie(s.id), auj)))
      .forEach(s => aFaire.push(h`<button class="item" data-act="ouvrirSeance" data-id="${s.id}"><span>${court(s.date)} · ${nomSeance(s, ctx.saisie(s.id))}</span><span class="petit">${etatSeance(s, ctx.saisie(s.id), auj) === "passee" ? "faite ? sautée ?" : "bilan"} ›</span></button>`));
    const j = jourSemaine(auj), sansMesures = x => !(doc.mesures[x] && Object.keys(doc.mesures[x]).length);
    if (j >= 5 && sansMesures(w)) aFaire.push(h`<button class="item" data-act="mesuresOuvrir" data-w="${w}"><span>Mesures de la semaine</span><span class="petit">week-end ›</span></button>`);
    if (j === 0 && w > 1 && sansMesures(w - 1)) aFaire.push(h`<button class="item" data-act="mesuresOuvrir" data-w="${w - 1}"><span>Mesures de la semaine ${w - 1}</span><span class="petit">si tu les as ›</span></button>`);
  }
  // Bilan de la semaine (dès qu'une séance est faite)
  const faites = sem.filter(s => ctx.saisie(s.id).fin), ts = faites.flatMap(s => ctx.saisie(s.id).tentatives || []), efforts = faites.map(s => ctx.saisie(s.id).effort).filter(x => x != null);
  const bilanSem = faites.length ? `${faites.length} séance${faites.length > 1 ? "s" : ""} faite${faites.length > 1 ? "s" : ""}${ts.length ? ` · ${ts.length} passage${ts.length > 1 ? "s" : ""}, ${ts.filter(reussi).length} réussi${ts.filter(reussi).length > 1 ? "s" : ""}` : ""}${efforts.length ? ` · effort moyen ${(efforts.reduce((a, b) => a + b, 0) / efforts.length).toFixed(1).replace(".", ",")}` : ""}` : "";
  // Passages hors séance de la semaine : une ligne, qu'on touche pour les voir
  const dim = ajouterJours(lundi, 6), hors = (doc.passagesAnciens || []).filter(p => p.date && p.date >= lundi && p.date <= dim);
  const ligneHors = hors.length ? h`<button class="item ligne-hors" data-act="ouvrirVue" data-vue="historique"><span>Hors séance · ${hors.length} passage${hors.length > 1 ? "s" : ""}${(n => n ? ` · ${n} réussi${n > 1 ? "s" : ""}` : "")(hors.filter(p => p.res === "ok").length)}</span><span class="petit">voir ›</span></button>` : "";
  return h`${si(bilanSem, h`<p class="bilan-sem">${bilanSem}</p>`)}${ligneHors}${si(aFaire.length, () => h`<div class="a-faire"><b>À faire</b><div class="liste">${aFaire}</div></div>`)}<div class="jours">${jours.map(x => h`<div class="jour ${x.d === auj ? "auj" : ""}"><div class="jour-nom">${x.j.slice(0, 3)}<br><span class="petit">${x.d.slice(8, 10)}</span></div>
      ${x.seances.map(s => { const e = etatSeance(s, ctx.saisie(s.id), auj); const a = activiteAffichee(s, ctx.saisie(s.id)); return h`<button class="pastille-seance etat-${e}" data-act="ouvrirSeance" data-appui="seanceMenu" data-id="${s.id}" data-activite="${a}" aria-label="${nomSeance(s, ctx.saisie(s.id))}">${ICONE[e] || a[0]}</button>`; })}</div>`)}</div>
    ${sem.map(s => { const sa = ctx.saisie(s.id), e = etatSeance(s, sa, auj), t = sa.tentatives || [], et = etapesSeance(s, sa);
      const a = activiteAffichee(s, sa);
      return h`<div class="carte-seance-cadre"><button class="carte-seance etat-${e}" data-act="ouvrirSeance" data-appui="seanceMenu" data-id="${s.id}" data-activite="${a}">
        <span class="cs-gauche"><b>${nomSeance(s, sa)}${s.bonus ? h` <span class="tag-bonus">bonus</span>` : ""}</b><span class="petit">${court(s.date)}${s.dateFixee ? " (déplacée)" : ""} · ≈ ${hm(dureeSeance(s, et, data, doc.reglages))}</span></span>
        <span class="cs-droite">${e === "faite" ? h`✓ ${sa.effort ? `effort ${sa.effort}` : ""}${t.length ? ` · ${t.filter(reussi).length}/${t.length}` : ""}` : e === "abilan" ? "✓ bilan ?" : e === "sautee" ? "✗ sautée" : e === "encours" ? "● en cours" : e === "passee" ? "? passée" : e === "aujourdhui" ? "aujourd'hui" : ""}</span></button><button class="cs-menu" data-act="seanceMenu" data-id="${s.id}" aria-label="Options de la séance">⋯</button></div>`; })}
`;
}

export function menuEcran(ctx) { const carte = !!document.querySelector("#ecran .carte-modele [data-act=assistantOuvrir], #ecran .carte-bilan-bloc [data-act=assistantOuvrir]");   // pas de doublon avec la page
  return { titre: "Programme", items: [{ label: "+ Séance", act: "creationOuvrir" }, { label: "Hors séance…", act: "ouvrirVue", data: { vue: "historique" } },
    { label: "Modifier une semaine…", act: "semaineModifOuvrir" }, ...((ctx.doc.blocs || []).length ? [{ label: "Modifier un bloc…", act: "blocModifOuvrir" }] : []), ...(carte ? [] : [{ label: "+ Nouveau bloc (assistant)", act: "assistantOuvrir" }])] }; }

// Options › « Modifier une semaine… » / « Modifier un bloc… » : choisir dans des listes, puis l'action
const groupeDe = (ctx, w) => { const s = ctx.programme.find(x => x.semaine === w && x.bloc); return s ? s.bloc : ""; };
const semainesDe = (ctx, g) => [...new Set(ctx.programme.map(s => s.semaine))].sort((a, b) => a - b).filter(w => groupeDe(ctx, w) === g);
const nomGroupe = (ctx, g) => { const b = (ctx.doc.blocs || []).find(x => x.id === g); return b ? `${b.nom.replace(/^B(\d+)$/, "Bloc $1")}${b.titre ? ` · ${b.titre}` : ""}` : "Programme de départ"; };
function fenetreSemaine(ctx, M = ctx.state.modal) {
  const debut = ctx.doc.reglages.dateDebut || ctx.data.dateDebut, wNow = semaineDe(debut, ctx.aujourdhui()), ouverte = ctx.state.semaineVue;
  const groupes = [...new Set([...ctx.programme].sort((a, b) => a.semaine - b.semaine).map(s => groupeDe(ctx, s.semaine)))];
  const libW = w => { const s = ctx.programme.find(x => x.semaine === w), ph = phaseDe((s || {}).phase || "").nom; return `Semaine ${w} · dès le ${jourMois(dateSeance(debut, w, "Lundi"))}${ph ? ` · ${ph}` : ""}${w === wNow ? " · cette semaine" : ""}`; };
  const mes = ctx.doc.mesures[M.w] && Object.keys(ctx.doc.mesures[M.w]).length;
  return h`<h2>Modifier une semaine</h2>
    <div class="choix compact">${h`<button data-act="semModifAller" data-w="${wNow}" class="${M.w === wNow ? "choisi" : ""}">Cette semaine</button>`}${si(ouverte && ouverte !== wNow, h`<button data-act="semModifAller" data-w="${ouverte}" class="${M.w === ouverte ? "choisi" : ""}">Semaine ouverte (${ouverte})</button>`)}</div>
    ${liste("g", groupes.map(g => [g, nomGroupe(ctx, g)]), M.g, { act: "semModifChoix", vide: null, label: "Bloc" })}
    ${liste("w", semainesDe(ctx, M.g).map(w => [String(w), libW(w)]), String(M.w), { act: "semModifChoix", vide: null, label: "Semaine" })}
    <div class="actions-colonne"><button class="gros contour" data-act="mesuresOuvrir" data-w="${M.w}">${ico("regle")} Mesures${mes ? " ✓" : ""}</button><button class="gros contour" data-act="pauseOuvrir" data-w="${M.w}">${ico("pause")} Faire une pause</button><button class="gros contour" data-act="copieSemaineOuvrir" data-w="${M.w}">Copier · répéter</button></div>
    <div class="actions"><button data-act="mFermer">Fermer</button></div>`;
}
function fenetreBloc(ctx, M = ctx.state.modal) {
  const B = ctx.doc.blocs || [];
  return h`<h2>Modifier un bloc</h2>${liste("id", B.map(b => [b.id, `${nomGroupe(ctx, b.id)} · semaines ${b.debut} → ${b.debut + (b.nb || 8) - 1}`]), M.id, { act: "blocModifChoix", vide: null, label: "Bloc" })}
    <div class="actions-colonne"><button class="gros contour" data-act="assistantOuvrir" data-bloc="${M.id}">${ico("crayon")} Modifier (assistant)</button><button class="gros contour danger" data-act="blocRetirer" data-id="${M.id}">Retirer ce bloc</button></div>
    <div class="actions"><button data-act="mFermer">Fermer</button></div>`;
}
export const actions = {
  semaineModifOuvrir: ctx => { const debut = ctx.doc.reglages.dateDebut || ctx.data.dateDebut, w = ctx.state.semaineVue || semaineDe(debut, ctx.aujourdhui()), ws = [...new Set(ctx.programme.map(s => s.semaine))];
    const w2 = ws.includes(w) ? w : Math.min(...ws); ctx.ouvrirModal({ type: "externe", rendu: fenetreSemaine, w: w2, g: groupeDe(ctx, w2) }); },
  semModifAller: (ctx, d) => { const m = ctx.state.modal; m.w = +d.w; m.g = groupeDe(ctx, m.w); ctx.rendre(); },
  semModifChoix: (ctx, d, el) => { const m = ctx.state.modal; if (d.champ === "g") { m.g = el.value; m.w = semainesDe(ctx, m.g)[0]; } else m.w = +el.value; ctx.rendre(); },
  blocModifOuvrir: ctx => { const debut = ctx.doc.reglages.dateDebut || ctx.data.dateDebut, wNow = semaineDe(debut, ctx.aujourdhui()), B = ctx.doc.blocs || [];
    const b = B.find(x => wNow >= x.debut && wNow < x.debut + (x.nb || 8)) || B[B.length - 1]; if (!b) return; ctx.ouvrirModal({ type: "externe", rendu: fenetreBloc, id: b.id }); },
  blocModifChoix: (ctx, d, el) => { ctx.state.modal.id = el.value; ctx.rendre(); },
  semaine: (ctx, d) => { ctx.state.semaineVue = ctx.state.semaineVue === +d.w ? null : +d.w; ctx.rendre();
    if (ctx.state.semaineVue === +d.w) { const t = document.querySelector(`#ecran [data-act=semaine][data-w="${d.w}"]`); if (t) ctx.montrer(t.parentElement); } },
  // « Cette semaine » : ouvre le bloc qui la contient (même si un autre bloc est déplié), déplie la semaine et l'amène à l'écran
  semaineAujourdhui: ctx => { const w = semaineDe(ctx.doc.reglages.dateDebut || ctx.data.dateDebut, ctx.aujourdhui()), s = ctx.programme.find(x => x.semaine === w && x.bloc) || ctx.programme.find(x => x.semaine === w);
    const nb = s ? (s.phase || "").split(" · ")[0] : "", avant = s && !s.bloc && (ctx.doc.blocs || []).some(x => x.nom === nb);
    ctx.state.semaineVue = w; if (s) forcerOuvert(`prog-bloc-${s.bloc || (avant ? "avant-" : "") + (nb || "p")}`); ctx.rendre();
    const t = document.querySelector(`#ecran [data-act=semaine][data-w="${w}"]`); if (t) { const haut = (document.getElementById("entete").offsetHeight || 52) + (document.querySelector(".barre-prog") || {}).offsetHeight + 12;
      window.scrollTo({ top: Math.max(0, window.scrollY + t.getBoundingClientRect().top - haut), behavior: "smooth" }); } },
  ouvrirSeance: (ctx, d) => ctx.ouvrir("seance", { seanceId: d.id, origine: "programme" }),          // la flèche ‹ ramènera ici
  copieSemaineOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "copieSemaine", w: +d.w, mode: "repeter", dest: +d.w + 1, n: 1 }),
  progres: ctx => ctx.ouvrir("progres"),
  modeleEcarter: ctx => { try { localStorage.setItem(CLE_MODELE, "1"); } catch { /* ignore */ } ctx.rendre(); ctx.toast("Retrouve-le dans Options › + Nouveau bloc"); },
  blocRetirer: (ctx, d) => { const b = (ctx.doc.blocs || []).find(x => x.id === d.id); if (!b) return;
    ctx.modifier(`bloc ${b.nom} retiré`, x => { x.blocs = x.blocs.filter(y => y.id !== d.id); }); ctx.toast(`${b.nom} · ${b.titre} retiré : le programme d'avant revient`, () => ctx.agir("annuler")); },
  bilanBlocVu: (ctx, d) => { try { localStorage.setItem(`grimpe-bilan-bloc-${d.id}`, "1"); } catch { /* ignore */ } ctx.rendre(); },
  departVide: ctx => { try { localStorage.setItem(CLE_VIDE, "1"); } catch { /* ignore */ } ctx.rendre(); },
  seanceMenu: (ctx, d) => { ctx.state.seanceId = d.id; ctx.ouvrirModal({ type: "menu", seanceId: d.id }); },
  passageHorsSeance: ctx => ctx.ouvrirModal({ type: "passageAncien", date: ctx.aujourdhui(), dateInconnue: false, disc: "Voie", cot: "", chiffre: "", profil: "Vertical", res: "", n: 1, couleur: "", nom: "", salle: "" }),
  creationOuvrir: ctx => editeur.ouvrir(ctx, { date: ctx.aujourdhui(), activite: "Voie", contenu: "" }),
  mesuresOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "mesures", semaine: +d.w, ...(ctx.doc.mesures[+d.w] || {}) }),
  pauseOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "pause", depuis: +d.w, n: 1 }),
};
