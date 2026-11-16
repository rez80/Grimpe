// ecrans/programme.js — le programme semaine par semaine, la semaine dépliée, les outils de semaine.
import { h, si, classes } from "../html.js";
import { etatSeance, etapesSeance, dureeSeance, activiteAffichee } from "../programme.js";
import { semaineDe, dateSeance, ajouterJours, jourMois, court, hm, JOURS, nomJour, jourSemaine } from "../dates.js";
import { reussi } from "../analyse.js";
import * as editeur from "./editeur.js";
import { carteHier } from "./seance.js";

const ICONE = { faite: "✓", abilan: "✓", sautee: "–", encours: "▸", aujourdhui: "●", passee: "·", avenir: "" };

export function rendre(ctx) {
  const P = ctx.programme, { state, doc, data } = ctx, auj = ctx.aujourdhui(), debut = doc.reglages.dateDebut || data.dateDebut;
  const semaines = [...new Set(P.map(s => s.semaine))].sort((a, b) => a - b), wNow = semaineDe(debut, auj);
  if (state.semaineVue !== null && !semaines.includes(state.semaineVue)) state.semaineVue = semaines.includes(wNow) ? wNow : semaines[0];   // null = tout replié
  const phases = []; for (const w of semaines) { const ph = (P.find(s => s.semaine === w) || {}).phase || ""; const bloc = ph.split(" · ")[0]; if (!phases.length || phases[phases.length - 1].bloc !== bloc) phases.push({ bloc, semaines: [] }); phases[phases.length - 1].semaines.push(w); }
  let out = h`${carteRestaurer(ctx)}${carteHier(ctx)}${carteAujourdhui(ctx, auj)}<div class="barre-prog"><button class="petit-btn" data-act="semaineAujourdhui">Cette semaine</button><button class="petit-btn btn-ajout" data-act="creationOuvrir">+ Séance</button><button class="petit-btn" data-act="progres">Progrès ›</button></div>`;
  for (const ph of phases) {
    out = h`${out}<h3 class="bloc-titre">${ph.bloc || "Programme"}</h3>`;
    for (const w of ph.semaines) {
      const sem = P.filter(s => s.semaine === w), faites = sem.filter(s => ctx.saisie(s.id).fin).length, phase = (sem[0] || {}).phase || "";
      const ouverte = state.semaineVue === w;
      out = h`${out}<div class="semaine ${classes(ouverte && "ouverte", w === wNow && "courante")}">
        <button class="semaine-tete" data-act="semaine" data-w="${w}"><span><b>Semaine ${w}</b> <span class="petit">${jourMois(dateSeance(debut, w, "Lundi"))} → ${jourMois(dateSeance(debut, w, "Dimanche"))}</span></span><span class="petit">${phase.replace(/^[^·]*·\s*/, "")} · ${faites}/${sem.length}</span></button>
        ${si(ouverte, () => semaineDetail(ctx, w, sem, auj))}</div>`;
    }
  }
  return { html: out, titre: h`<b>Programme</b>` };
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

// La carte du haut : la séance du jour (un appui pour l'ouvrir), sinon la prochaine
function carteAujourdhui(ctx, auj) {
  const P = ctx.programme, du = P.filter(s => s.date === auj && etatSeance(s, ctx.saisie(s.id), auj) !== "sautee");
  const l = du.length ? du : P.filter(s => s.date > auj && etatSeance(s, ctx.saisie(s.id), auj) !== "sautee").slice(0, 1);
  if (!l.length) return h`<div class="carte carte-auj"><p class="petit">Plus de séance prévue au programme.</p></div>`;
  return h`<div class="carte carte-auj"><p class="petit">${du.length ? "Aujourd'hui" : "Prochaine séance"}</p>${l.map(s => { const sa = ctx.saisie(s.id), e = etatSeance(s, sa, auj), et = etapesSeance(s, sa);
    return h`<button class="auj-seance" data-act="ouvrirSeance" data-id="${s.id}" data-activite="${activiteAffichee(s, sa)}"><span><b>${activiteAffichee(s, sa)}</b><br><span class="petit">${du.length ? "" : court(s.date) + " · "}≈ ${hm(dureeSeance(s, et, ctx.data, ctx.doc.reglages))}${e === "faite" || e === "abilan" ? " · ✓ faite" : e === "encours" ? " · en cours" : ""}</span></span><span class="auj-go" aria-hidden="true">›</span></button>`; })}</div>`;
}

function semaineDetail(ctx, w, sem, auj) {
  const { doc, data } = ctx, debut = doc.reglages.dateDebut || data.dateDebut, lundi = dateSeance(debut, w, "Lundi");
  const jours = JOURS.map((j, i) => { const d = ajouterJours(lundi, i); return { j, d, seances: ctx.programme.filter(s => s.date === d) }; });
  const mesures = doc.mesures[w] && Object.keys(doc.mesures[w]).length, wNow = semaineDe(debut, auj);
  // À faire (semaine en cours) : les séances à régler et les mesures, sans reproche
  const aFaire = [];
  if (w === wNow) {
    ctx.programme.filter(s => s.date < auj && s.date >= ajouterJours(lundi, -7) && ["abilan", "encours", "passee"].includes(etatSeance(s, ctx.saisie(s.id), auj)))
      .forEach(s => aFaire.push(h`<button class="item" data-act="ouvrirSeance" data-id="${s.id}"><span>${court(s.date)} · ${activiteAffichee(s, ctx.saisie(s.id))}</span><span class="petit">${etatSeance(s, ctx.saisie(s.id), auj) === "passee" ? "faite ? sautée ?" : "bilan"} ›</span></button>`));
    const j = jourSemaine(auj), sansMesures = x => !(doc.mesures[x] && Object.keys(doc.mesures[x]).length);
    if (j >= 5 && sansMesures(w)) aFaire.push(h`<button class="item" data-act="mesuresOuvrir" data-w="${w}"><span>Mesures de la semaine</span><span class="petit">week-end ›</span></button>`);
    if (j === 0 && w > 1 && sansMesures(w - 1)) aFaire.push(h`<button class="item" data-act="mesuresOuvrir" data-w="${w - 1}"><span>Mesures de la semaine ${w - 1}</span><span class="petit">si tu les as ›</span></button>`);
  }
  // Bilan de la semaine (dès qu'une séance est faite)
  const faites = sem.filter(s => ctx.saisie(s.id).fin), ts = faites.flatMap(s => ctx.saisie(s.id).tentatives || []), efforts = faites.map(s => ctx.saisie(s.id).effort).filter(x => x != null);
  const bilanSem = faites.length ? `${faites.length} séance${faites.length > 1 ? "s" : ""} faite${faites.length > 1 ? "s" : ""}${ts.length ? ` · ${ts.length} passage${ts.length > 1 ? "s" : ""}, ${ts.filter(reussi).length} réussi${ts.filter(reussi).length > 1 ? "s" : ""}` : ""}${efforts.length ? ` · effort moyen ${(efforts.reduce((a, b) => a + b, 0) / efforts.length).toFixed(1).replace(".", ",")}` : ""}` : "";
  return h`${si(bilanSem, h`<p class="bilan-sem">${bilanSem}</p>`)}${si(aFaire.length, () => h`<div class="a-faire"><b>À faire</b><div class="liste">${aFaire}</div></div>`)}<div class="jours">${jours.map(x => h`<div class="jour ${x.d === auj ? "auj" : ""}"><div class="jour-nom">${x.j.slice(0, 3)}<br><span class="petit">${x.d.slice(8, 10)}</span></div>
      ${x.seances.map(s => { const e = etatSeance(s, ctx.saisie(s.id), auj); const a = activiteAffichee(s, ctx.saisie(s.id)); return h`<button class="pastille-seance etat-${e}" data-act="ouvrirSeance" data-appui="seanceMenu" data-id="${s.id}" data-activite="${a}" aria-label="${a}">${ICONE[e] || a[0]}</button>`; })}</div>`)}</div>
    ${sem.map(s => { const sa = ctx.saisie(s.id), e = etatSeance(s, sa, auj), t = sa.tentatives || [], et = etapesSeance(s, sa);
      const a = activiteAffichee(s, sa);
      return h`<div class="carte-seance-cadre"><button class="carte-seance etat-${e}" data-act="ouvrirSeance" data-appui="seanceMenu" data-id="${s.id}" data-activite="${a}">
        <span class="cs-gauche"><b>${a}</b><span class="petit">${court(s.date)}${s.dateFixee ? " (déplacée)" : ""} · ≈ ${hm(dureeSeance(s, et, data, doc.reglages))}</span></span>
        <span class="cs-droite">${e === "faite" ? h`✓ ${sa.effort ? `effort ${sa.effort}` : ""}${t.length ? ` · ${t.filter(reussi).length}/${t.length}` : ""}` : e === "abilan" ? "✓ bilan ?" : e === "sautee" ? "sautée" : e === "encours" ? "▸ en cours" : e === "passee" ? "passée" : e === "aujourdhui" ? "aujourd'hui" : ""}</span></button><button class="cs-menu" data-act="seanceMenu" data-id="${s.id}" aria-label="Options de la séance">⋯</button></div>`; })}
    <div class="outils-semaine"><button class="petit-btn" data-act="mesuresOuvrir" data-w="${w}">📏 Mesures${mesures ? " ✓" : ""}</button><button class="petit-btn" data-act="pauseOuvrir" data-w="${w}">⏸ Faire une pause</button><button class="petit-btn" data-act="copieSemaineOuvrir" data-w="${w}">Copier · répéter</button></div>`;
}

export function menuEcran() { return { titre: "Programme", items: [{ label: "+ Séance", act: "creationOuvrir" }, { label: "Passages hors séance (sans voie connue)", act: "ouvrirVue", data: { vue: "historique" } }, { label: "Aller à cette semaine", act: "semaineAujourdhui" }] }; }

export const actions = {
  semaine: (ctx, d) => { ctx.state.semaineVue = ctx.state.semaineVue === +d.w ? null : +d.w; ctx.rendre();
    if (ctx.state.semaineVue === +d.w) { const t = document.querySelector(`#ecran [data-act=semaine][data-w="${d.w}"]`); if (t) ctx.montrer(t.parentElement); } },
  semaineAujourdhui: ctx => { ctx.state.semaineVue = semaineDe(ctx.doc.reglages.dateDebut || ctx.data.dateDebut, ctx.aujourdhui()); ctx.rendre(true); },
  ouvrirSeance: (ctx, d) => ctx.ouvrir("seance", { seanceId: d.id, origine: "programme" }),          // la flèche ‹ ramènera ici
  copieSemaineOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "copieSemaine", w: +d.w, mode: "repeter", dest: +d.w + 1, n: 1 }),
  progres: ctx => ctx.ouvrir("progres"),
  departVide: ctx => { try { localStorage.setItem(CLE_VIDE, "1"); } catch { /* ignore */ } ctx.rendre(); },
  seanceMenu: (ctx, d) => { ctx.state.seanceId = d.id; ctx.ouvrirModal({ type: "menu", seanceId: d.id }); },
  passageHorsSeance: ctx => ctx.ouvrirModal({ type: "passageAncien", date: ctx.aujourdhui(), dateInconnue: false, disc: "Voie", cot: "", chiffre: "", profil: "Vertical", res: "", n: 1, couleur: "", nom: "", salle: "" }),
  creationOuvrir: ctx => editeur.ouvrir(ctx, { date: ctx.aujourdhui(), activite: "Voie", contenu: "" }),
  mesuresOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "mesures", semaine: +d.w, ...(ctx.doc.mesures[+d.w] || {}) }),
  pauseOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "pause", depuis: +d.w, n: 1 }),
};
