// blocs.js — les blocs construits dans l'app (assistant « Construire un bloc »).
//
// Un bloc enregistré dans le document (doc.blocs) :
//   { id, nom: "B1", titre: "Le 5 en bloc", debut: 2, nb: 7, remplace: true,
//     seances: [{ semaine, jour, activite, phase, contenu, bonus }],
//     feux: [{ id, titre, role: "objectif" | "secondaire" | "garde", criteres: [{ type, disc, cot, profil, min, max, semaines, label }] }],
//     coches: { "<feu>-<n>": true }, plan: { …les réponses de l'assistant, pour le rouvrir } }
// « debut » et « semaine » sont des numéros de semaine du programme (1 = semaine de la date de début).
// Un bloc qui « remplace » cache les séances du programme de base sur ses semaines (sauf celles déjà faites).
// Ce module est léger : il est chargé au démarrage (programme effectif, feux verts du bloc en cours).

import { tentatives, avecEssaisDeclares, reussi, differentes, baseCot, enDevers, dateDe } from "./analyse.js";
import { dateSeance, ajouterJours, semaineDe } from "./dates.js";

export const blocsDe = doc => doc.blocs || [];
export const finBloc = b => b.debut + b.nb - 1;

// Programme effectif : on retire les séances de base que le bloc remplace (pas celles déjà faites), puis on ajoute les siennes
export function appliquerBlocs(P, doc) {
  const retirees = new Set();
  for (const b of blocsDe(doc)) {
    const gardees = new Set();                // séances de base déjà faites sur les semaines du bloc : elles restent, et la séance du bloc du même jour n'est pas ajoutée
    if (b.remplace) P = P.filter(s => { if (s.libre || s.bloc || s.semaine < b.debut || s.semaine > finBloc(b)) return true;
      const sa = doc.seances[s.id]; if (sa && (sa.fin || sa.debut || (sa.tentatives || []).length)) { gardees.add(`${s.semaine}|${s.jour}|${s.activite}`); return true; }
      retirees.add(s.id); return false; });
    b.seances.forEach(x => { if (gardees.has(`${x.semaine}|${x.jour}|${x.activite}`)) return;
      P.push({ id: idSeanceBloc(b, x), semaine: x.semaine, jour: x.jour, activite: x.activite, phase: x.phase, contenu: x.contenu, bonus: !!x.bonus, bloc: b.id, libre: false, modifie: false }); });
  }
  return { P, retirees };
}
// Identifiant stable d'une séance de bloc (semaine, jour, activité) : un bloc reconstruit garde les saisies déjà faites
export const idSeanceBloc = (b, x) => x.cle ? `b-${b.id}-${x.cle}` : `b-${b.id}-${x.semaine}-${String(x.jour).slice(0, 3).toLowerCase()}-${String(x.activite).slice(0, 4).toLowerCase()}`;

// Le bloc de la semaine w (le plus récent qui la couvre)
export const blocDeSemaine = (doc, w) => blocsDe(doc).filter(b => w >= b.debut && w <= finBloc(b)).pop() || null;

// Libellé d'un critère, construit à partir de ses réglages
export function libelleCritere(c) {
  const quoi = (c.disc === "Voie" ? "voie" : "bloc"), dev = c.profil === "devers" ? " en dévers" : c.profil === "vertical" ? " en vertical" : "";
  switch (c.type) {
    case "essais": return `Essais en ${quoi} ${c.cot}${dev}`;
    case "taux": return `Réussite en ${quoi} ${c.cot}${dev}`;
    case "differents": return `${c.disc === "Voie" ? "Voies" : "Blocs"} ${c.cot} différent${c.disc === "Voie" ? "e" : ""}s réussi${c.disc === "Voie" ? "e" : ""}s${dev}`;
    case "douleur": return `Douleur max sur ${c.semaines || 4} semaines`;
    case "seances": return "Séances du bloc faites (en %)";
    case "coche": return c.label || "À cocher";
    default: return c.label || c.type;
  }
}

// Les feux verts d'un bloc, au même format que les feux de base : { id, titre, ok, criteres: [{ t, val, cible, pct, ok }] }
export function feuxBloc(b, { programme, doc, aujourdhui, dateDebut }) {
  const depuis = dateSeance(dateDebut, b.debut, "Lundi");
  const ts = avecEssaisDeclares(tentatives(programme, doc)).filter(t => t.date && t.date >= depuis && t.date <= aujourdhui);
  const filtre = c => ts.filter(t => t.disc === c.disc && baseCot(t.cot) === String(c.cot) && (c.profil === "devers" ? enDevers(t.profil) : c.profil === "vertical" ? !enDevers(t.profil) : true));
  const douleurMax = semaines => { const limite = ajouterJours(aujourdhui, -7 * (semaines || 4)); let m = 0;
    for (const s of programme) { const ds = dateDe(s, doc); if (ds < limite || ds > aujourdhui) continue; const d = (doc.seances[s.id] || {}).douleur || {};
      m = Math.max(m, +d.avant || 0, +d.apres || 0, ...(d.pendant || []).map(x => +x.niveau || 0)); }
    return m; };
  const crit = (c, val, cible, pct = false) => ({ t: c.label || libelleCritere(c), val, cible, pct, ok: val >= cible });
  return (b.feux || []).map(f => {
    const criteres = f.criteres.map((c, n) => {
      const l = c.type === "essais" || c.type === "taux" || c.type === "differents" ? filtre(c) : [];
      switch (c.type) {
        case "essais": return crit(c, l.length, c.min ?? 10);
        case "taux": return crit(c, l.length ? Math.round(100 * l.filter(reussi).length / l.length) : 0, c.min ?? 70, true);
        case "differents": return crit(c, differentes(l.filter(reussi)), c.min ?? 5);
        case "douleur": { const m = douleurMax(c.semaines); return { ...crit(c, m <= (c.max ?? 2) ? 1 : 0, 1), t: `${c.label || libelleCritere(c)} ≤ ${c.max ?? 2}/10`, detail: `max ${m}/10` }; }
        case "seances": { const du = programme.filter(s => s.bloc === b.id && !s.bonus && dateDe(s, doc) <= aujourdhui), faites = du.filter(s => doc.seances[s.id] && doc.seances[s.id].fin).length;
          return crit(c, du.length ? Math.round(100 * faites / du.length) : 0, c.min ?? 80, true); }
        case "coche": return { ...crit(c, (b.coches || {})[`${f.id}-${n}`] ? 1 : 0, 1), coche: `${f.id}-${n}` };
        default: return crit(c, 0, 1);
      }
    });
    return { id: `${b.id}:${f.id}`, titre: f.titre, role: f.role, bloc: b.id, info: f.role === "garde", criteres, ok: criteres.length > 0 && criteres.every(c => c.ok) };
  });
}

// Le bloc en cours (celui de la semaine d'aujourd'hui), ou null
export const blocEnCours = (doc, dateDebut, aujourdhui) => blocDeSemaine(doc, semaineDe(dateDebut, aujourdhui));
