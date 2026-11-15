// ecrans/programme.js — le programme semaine par semaine, la semaine dépliée, les outils de semaine.
import { h, si, classes } from "../html.js";
import { etatSeance, etapesSeance, dureeSeance } from "../programme.js";
import { semaineDe, dateSeance, ajouterJours, jourMois, court, hm, JOURS, nomJour } from "../dates.js";
import { reussi } from "../analyse.js";
import * as editeur from "./editeur.js";

const ICONE = { faite: "✓", abilan: "✓", sautee: "–", encours: "▶", aujourdhui: "●", passee: "·", avenir: "" };

export function rendre(ctx) {
  const P = ctx.programme, { state, doc, data } = ctx, auj = ctx.aujourdhui(), debut = doc.reglages.dateDebut || data.dateDebut;
  const semaines = [...new Set(P.map(s => s.semaine))].sort((a, b) => a - b), wNow = semaineDe(debut, auj);
  if (!semaines.includes(state.semaineVue)) state.semaineVue = semaines.includes(wNow) ? wNow : semaines[0];
  const phases = []; for (const w of semaines) { const ph = (P.find(s => s.semaine === w) || {}).phase || ""; const bloc = ph.split(" · ")[0]; if (!phases.length || phases[phases.length - 1].bloc !== bloc) phases.push({ bloc, semaines: [] }); phases[phases.length - 1].semaines.push(w); }
  let out = h`<div class="barre-prog"><button class="petit-btn" data-act="semaineAujourdhui">Aujourd'hui</button><button class="petit-btn" data-act="creationOuvrir">+ Séance</button><button class="petit-btn" data-act="progres">Progrès ›</button></div>`;
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

function semaineDetail(ctx, w, sem, auj) {
  const { doc, data } = ctx, debut = doc.reglages.dateDebut || data.dateDebut, lundi = dateSeance(debut, w, "Lundi");
  const jours = JOURS.map((j, i) => { const d = ajouterJours(lundi, i); return { j, d, seances: ctx.programme.filter(s => s.date === d) }; });
  const mesures = doc.mesures[w];
  return h`<div class="jours">${jours.map(x => h`<div class="jour ${x.d === auj ? "auj" : ""}"><div class="jour-nom">${x.j.slice(0, 3)}<br><span class="petit">${x.d.slice(8, 10)}</span></div>
      ${x.seances.map(s => { const e = etatSeance(s, ctx.saisie(s.id), auj); return h`<button class="pastille-seance etat-${e}" data-act="ouvrirSeance" data-id="${s.id}" data-activite="${s.activite}" aria-label="${s.activite}">${ICONE[e] || s.activite[0]}</button>`; })}</div>`)}</div>
    ${sem.map(s => { const sa = ctx.saisie(s.id), e = etatSeance(s, sa, auj), t = sa.tentatives || [], et = etapesSeance(s, sa);
      return h`<button class="carte-seance etat-${e}" data-act="ouvrirSeance" data-id="${s.id}" data-activite="${s.activite}">
        <span class="cs-gauche"><b>${s.activite}</b><span class="petit">${court(s.date)}${s.dateFixee ? " (déplacée)" : ""} · ≈ ${hm(dureeSeance(s, et, data, doc.reglages))}</span></span>
        <span class="cs-droite">${e === "faite" ? h`✓ ${sa.effort ? `effort ${sa.effort}` : ""}${t.length ? ` · ${t.filter(reussi).length}/${t.length}` : ""}` : e === "abilan" ? "✓ bilan ?" : e === "sautee" ? "sautée" : e === "encours" ? "▶ en cours" : e === "passee" ? "passée" : e === "aujourdhui" ? "aujourd'hui" : ""}</span></button>`; })}
    <div class="outils-semaine"><button class="petit-btn" data-act="mesuresOuvrir" data-w="${w}">📏 Mesures${mesures ? " ✓" : ""}</button><button class="petit-btn" data-act="pauseOuvrir" data-w="${w}">⏸ Pause avant</button></div>`;
}

export const actions = {
  semaine: (ctx, d) => { ctx.state.semaineVue = ctx.state.semaineVue === +d.w ? null : +d.w; ctx.rendre(); },
  semaineAujourdhui: ctx => { ctx.state.semaineVue = semaineDe(ctx.doc.reglages.dateDebut || ctx.data.dateDebut, ctx.aujourdhui()); ctx.rendre(true); },
  ouvrirSeance: (ctx, d) => ctx.ouvrir("seance", { seanceId: d.id }),
  progres: ctx => ctx.ouvrir("progres"),
  creationOuvrir: ctx => editeur.ouvrir(ctx, { date: ctx.aujourdhui(), activite: "Voie", contenu: "" }),
  mesuresOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "mesures", semaine: +d.w, ...(ctx.doc.mesures[+d.w] || {}) }),
  pauseOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "pause", depuis: +d.w, n: 1 }),
};
