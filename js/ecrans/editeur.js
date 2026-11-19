// ecrans/editeur.js — l'éditeur de séance pour le téléphone : des étapes et des sélecteurs, jamais une grammaire à taper.
// Le texte à marqueurs reste le format de stockage (et le « mode texte » pour qui le préfère).
import { h, si, choix, liste } from "../html.js";
import { lignesDe, contenuDe, analyserLigne, texteDuree } from "../parseur.js";
import { nouvelId, correspondanceCles, remapperSaisie } from "../programme.js";
import { semaineDe, nomJour, duree as dureeTexte } from "../dates.js";

const M = ctx => ctx.state.modal;
const REPOS = [30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 420, 480, 600];
const CHRONOS = [10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 300, 420, 600, 900, 1200, 1800, 2700, 3600];
const FRACTIONS = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360, 420, 480, 600, 900];
const DUREES = [300, 600, 900, 1200, 1500, 1800, 2400, 2700, 3000, 3600, 4500, 5400, 7200];
const GENRES = [["echauffement", "Échauff."], ["facile", "Facile"], ["effort", "Effort"], ["recup", "Récup"], ["securite", "Sécurité"]];
const nature = e => e.type !== "action" ? e.type : e.grimpe ? "grimpe" : e.fractions ? "course" : e.mesure ? "mesure" : "exo";
const NATURES = { version: "Version", routine: "Routine", info: "Consigne", grimpe: "Voies / blocs", exo: "Exercice", course: "Course", mesure: "Mesure" };
const vide = n => ({ version: { type: "version", nom: "Variante" }, routine: { type: "routine", nom: "" }, info: { type: "info", texte: "" },
  grimpe: analyserLigne("3× Voie {voie} {effort}"), exo: analyserLigne("2× « Planche » {chrono 30s}"), course: analyserLigne("6× course lente {fractions 2min/2min}"), mesure: analyserLigne("Planche (s) {mesure planche} {récup}") })[n];

export function ouvrir(ctx, { cible = null, contenu = "", date, activite = "Voie" }) {
  ctx.ouvrirModal({ type: "editeur", cible, date: date || ctx.aujourdhui(), activite, lignes: lignesDe(contenu), texte: false, contenu });
}

export function rendre(ctx) {
  const m = M(ctx), { data } = ctx, routines = [...new Set(data.routines.map(r => r.routine))];
  const pas = (i, champ, valeur, texte, pasMoins, pasPlus) => h`<span class="compteur"><button data-act="edNum" data-i="${i}" data-champ="${champ}" data-pas="${pasMoins}">−</button><span>${texte}</span><button data-act="edNum" data-i="${i}" data-champ="${champ}" data-pas="${pasPlus}">+</button></span>`;
  // Durées : une liste déroulante (plus de 4 choix), la valeur actuelle toujours présente
  const duree = (i, champ, valeur, valeurs, vide) => { const l = [...new Set([...valeurs, ...(valeur ? [+valeur] : [])])].sort((a, b) => a - b);
    return h`<select class="ed-duree" data-act="edDuree" data-i="${i}" data-champ="${champ}" aria-label="${champ}">${vide ? h`<option value="" ${!valeur ? "selected" : ""}>${vide}</option>` : ""}${l.map(v => h`<option value="${v}" ${+valeur === v ? "selected" : ""}>${dureeTexte(v)}</option>`)}</select>`; };
  // Une ligne « libellé · réglage », comme dans l'assistant : tous les réglages alignés, de même largeur
  const R = (label, controle) => h`<div class="ed-champ"><span class="ed-lib">${label}</span><span class="ed-ctrl">${controle}</span></div>`;
  const ligne = (e, i) => { const n = nature(e);
    return h`<div class="ed-ligne carte ${e.type === "version" ? "ed-version" : ""}"><div class="ed-tete"><select data-act="edNature" data-i="${i}" aria-label="Type d'étape">${Object.entries(NATURES).map(([k, l]) => h`<option value="${k}" ${k === n ? "selected" : ""}>${l}</option>`)}</select>
        <span class="ed-outils"><button data-act="edBouger" data-i="${i}" data-pas="-1" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button><button data-act="edBouger" data-i="${i}" data-pas="1" ${i === m.lignes.length - 1 ? "disabled" : ""} aria-label="Descendre">↓</button><button data-act="edSuppr" data-i="${i}" aria-label="Supprimer">✕</button></span></div>
      ${n === "version" ? R("Nom", h`<input type="text" value="${e.nom}" placeholder="ex. Remplacement bloc" data-frappe="edTexte" data-i="${i}" data-champ="nom">`)
      : n === "routine" ? R("Routine", h`<select data-act="edTexte" data-i="${i}" data-champ="nom"><option value="">— choisir —</option>${routines.map(r => h`<option value="${r}" ${r === e.nom ? "selected" : ""}>${r}</option>`)}</select>`)
      : n === "info" ? R("Consigne", h`<input type="text" value="${e.texte}" placeholder="ex. Pieds silencieux" data-frappe="edTexte" data-i="${i}" data-champ="texte">`)
      : h`${R("Combien", pas(i, "n", e.n, `${e.n}×`, -1, 1))}
          ${R("Quoi", h`<input type="text" value="${e.texte}" placeholder="${n === "grimpe" ? "Voie en 5b · « Travail au point »" : n === "course" ? "course lente" : "« Planche »"}" data-frappe="edTexte" data-i="${i}" data-champ="texte">`)}
          ${si(n !== "course", () => R("Exercice", h`<select data-act="edExo" data-i="${i}"><option value="">+ de la bibliothèque…</option>${data.exercices.map(x => h`<option value="${x.nom}">${x.nom}</option>`)}</select>`))}
          ${si(n === "grimpe", () => h`${R("Discipline", choix("edGrimpe", [["Voie", "Voie"], ["Bloc", "Bloc"]], e.grimpe.disc, { data: { i }, classe: "compact" }))}
            ${R("Cotation", h`<select data-act="edCotListe" data-i="${i}"><option value="" ${!e.grimpe.cot ? "selected" : ""}>— sans —</option>${(data.echelles[e.grimpe.disc] || []).map(c => h`<option value="${c}" ${(e.grimpe.cot || "") === c ? "selected" : ""}>${c}</option>`)}</select>`)}
            ${R("Repos", duree(i, "repos", e.repos, REPOS, "par défaut"))}${R("Séries", pas(i, "serie", e.serie, e.serie || "—", -1, 1))}`)}
          ${si(n === "exo", () => h`${R("Chrono", duree(i, "chrono", e.chrono, CHRONOS, "—"))}${R("Par côté", choix("edBoolC", [["", "Non"], ["1", "Oui"]], e.cote ? "1" : "", { data: { i, champ: "cote" }, classe: "compact" }))}${R("Repos", duree(i, "repos", e.repos, REPOS, "par défaut"))}`)}
          ${si(n === "course", () => h`${R("Course", duree(i, "fractions.course", e.fractions.course, FRACTIONS))}${R("Marche", duree(i, "fractions.marche", e.fractions.marche, FRACTIONS))}`)}
          ${si(n === "mesure", () => R("Clé", h`<input type="text" value="${e.mesure}" data-frappe="edTexte" data-i="${i}" data-champ="mesure" placeholder="planche">`))}
          ${R("Genre", h`<select data-act="edGenreListe" data-i="${i}">${GENRES.map(([k, l]) => h`<option value="${k}" ${(e.genre || "") === k ? "selected" : ""}>${l}</option>`)}</select>`)}
          ${R("Durée", duree(i, "duree", e.duree, DUREES, "auto"))}
          ${si(e.erreurs && e.erreurs.length, h`<p class="petit rouge-txt">${e.erreurs.join(" · ")}</p>`)}`}</div>`; };
  return h`<h2>${m.cible ? "Modifier le plan" : "Nouvelle séance"}</h2>
    ${si(!m.cible, () => h`<div class="carte ed-entete">${R("Date", h`<input type="date" data-champ="date" value="${m.date}">`)}${R("Activité", liste("activite", data.listes.Activités || ["Voie", "Bloc", "Maison", "Course"], m.activite, { vide: null }))}</div>`)}
    ${m.texte ? h`<textarea data-champ="contenu" rows="12" class="code">${m.contenu}</textarea><p class="petit"><button class="lien" data-act="ouvrirAide" data-k="syntaxe">Syntaxe</button></p>`
      : h`<h3 class="ed-titre">Étapes</h3><div class="ed-lignes">${m.lignes.map(ligne)}${si(!m.lignes.length, h`<p class="petit">Aucune étape : ajoute-en une ci-dessous.</p>`)}</div>
        <div class="ed-ajout">${R("Ajouter", h`<select data-act="edAjoutListe"><option value="">+ une étape…</option>${Object.entries(NATURES).map(([k, l]) => h`<option value="${k}">${l}</option>`)}</select>`)}</div>`}
    <div class="actions"><button data-act="edMode">${m.texte ? "Formulaire" : "Texte"}</button><button data-act="mFermer">Annuler</button><button class="principal" data-act="edOk">Enregistrer</button></div>`;
}

const L = (ctx, d) => M(ctx).lignes[+d.i];
const poser = (o, chemin, v) => { const p = chemin.split("."); let x = o; for (const k of p.slice(0, -1)) x = x[k]; x[p[p.length - 1]] = v; };
const lire = (o, chemin) => chemin.split(".").reduce((x, k) => (x || {})[k], o);
export const actions = {
  edNature: (ctx, d, el) => { const m = M(ctx), anc = m.lignes[+d.i], neuf = vide(el.value); if (anc.type === "action" && neuf.type === "action") { neuf.texte = anc.texte; neuf.n = anc.n; neuf.genre = anc.genre; } m.lignes[+d.i] = neuf; ctx.rendre(); },
  edTexte: (ctx, d, el) => { const e = L(ctx, d); e[d.champ] = d.champ === "mesure" ? el.value.trim().toLowerCase().replace(/\s+/g, "_") : el.value; if (d.champ === "texte") e.exos = [...e.texte.matchAll(/«\s*(.+?)\s*»/g)].map(x => x[1]); },
  edExo: (ctx, d, el) => { if (!el.value) return; const e = L(ctx, d); e.texte = (e.texte ? e.texte + " · " : "") + `« ${el.value} »`; ctx.rendre(); },
  edNum: (ctx, d) => { const e = L(ctx, d), v = lire(e, d.champ) || 0, mini = d.champ === "n" ? 1 : d.champ.startsWith("fractions.") ? 15 : 0;
    poser(e, d.champ, Math.max(mini, v + +d.pas) || (d.champ === "n" ? 1 : null)); ctx.rendre(); },
  edDuree: (ctx, d, el) => { poser(L(ctx, d), d.champ, el.value === "" ? null : +el.value); ctx.rendre(); },
  edBool: (ctx, d) => { const e = L(ctx, d); e[d.champ] = !e[d.champ]; ctx.rendre(); },
  edGrimpe: (ctx, d) => { const e = L(ctx, d); e.grimpe = { disc: d.valeur, cot: "" }; ctx.rendre(); },
  edCot: (ctx, d) => { const e = L(ctx, d); e.grimpe.cot = d.valeur; ctx.rendre(); },
  edCotListe: (ctx, d, el) => { const e = L(ctx, d); e.grimpe.cot = el.value; ctx.rendre(); },
  edGenreListe: (ctx, d, el) => { const e = L(ctx, d); e.genre = el.value; ctx.rendre(); },
  edBoolC: (ctx, d) => { const e = L(ctx, d); e[d.champ] = d.valeur === "1"; ctx.rendre(); },
  edAjoutListe: (ctx, d, el) => { if (!el.value) return; M(ctx).lignes.push(vide(el.value)); ctx.rendre(); },
  edGenre: (ctx, d) => { const e = L(ctx, d); e.genre = d.valeur; ctx.rendre(); },
  edBouger: (ctx, d) => { const l = M(ctx).lignes, i = +d.i, j = i + +d.pas; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; ctx.rendre(); },
  edSuppr: (ctx, d) => { M(ctx).lignes.splice(+d.i, 1); ctx.rendre(); },
  edAjout: (ctx, d) => { M(ctx).lignes.push(vide(d.n)); ctx.rendre(); },
  edMode: ctx => { const m = M(ctx); if (m.texte) m.lignes = lignesDe(m.contenu); else m.contenu = contenuDe(m.lignes); m.texte = !m.texte; ctx.rendre(); },
  edOk: ctx => { const m = M(ctx); if (!m.cible && !/^\d{4}-\d{2}-\d{2}$/.test(m.date || "")) { ctx.toast("Choisis une date."); return; }
    const contenu = m.texte ? m.contenu : contenuDe(m.lignes), debut = ctx.doc.reglages.dateDebut || ctx.data.dateDebut;
    if (m.cible) { const map = correspondanceCles(ctx.seance(m.cible).contenu, contenu);          // les saisies déjà faites suivent leur ligne
      ctx.modifier("plan modifié", d => { d.ops.push({ id: nouvelId("o"), op: "set", cible: m.cible, contenu }); remapperSaisie(d.seances[m.cible], map); }); }
    else { const id = nouvelId("l"), sem = semaineDe(debut, m.date); ctx.modifier("séance créée", d => { d.ops.push({ id: nouvelId("o"), op: "set", cible: id, semaine: sem, jour: nomJour(m.date), activite: m.activite, phase: "Séance créée", contenu }); if (sem < 1) d.ops.push({ id: nouvelId("o"), op: "date", cible: id, date: m.date }); }); ctx.state.seanceId = id; }
    ctx.fermerModal(); ctx.ouvrir("seance"); },
};
