// ecrans/editeur.js — l'éditeur de séance pour le téléphone : des étapes et des sélecteurs, jamais une grammaire à taper.
// Le texte à marqueurs reste le format de stockage (et le « mode texte » pour qui le préfère).
import { h, si, choix } from "../html.js";
import { lignesDe, contenuDe, analyserLigne, texteDuree } from "../parseur.js";
import { nouvelId } from "../programme.js";
import { semaineDe, nomJour } from "../dates.js";

const M = ctx => ctx.state.modal;
const GENRES = [["echauffement", "Échauff."], ["facile", "Facile"], ["effort", "Effort"], ["recup", "Récup"], ["securite", "Sécurité"]];
const nature = e => e.type !== "action" ? e.type : e.grimpe ? "grimpe" : e.fractions ? "course" : e.mesure ? "mesure" : "exo";
const NATURES = { version: "Version", routine: "Routine", info: "Consigne", grimpe: "Voies / blocs", exo: "Exercice", course: "Course", mesure: "Mesure" };
const vide = n => ({ version: { type: "version", nom: "Variante" }, routine: { type: "routine", nom: "" }, info: { type: "info", texte: "" },
  grimpe: analyserLigne("3× Voie {voie} {effort}"), exo: analyserLigne("2× « Gainage » {chrono 30s}"), course: analyserLigne("6× course lente {fractions 2min/2min}"), mesure: analyserLigne("Planche (s) {mesure planche} {récup}") })[n];

export function ouvrir(ctx, { cible = null, contenu = "", date, activite = "Voie" }) {
  ctx.ouvrirModal({ type: "editeur", cible, date: date || ctx.aujourdhui(), activite, lignes: lignesDe(contenu), texte: false, contenu });
}

export function rendre(ctx) {
  const m = M(ctx), { data } = ctx, routines = [...new Set(data.routines.map(r => r.routine))];
  const pas = (i, champ, valeur, texte, pasMoins, pasPlus) => h`<span class="compteur"><button data-act="edNum" data-i="${i}" data-champ="${champ}" data-pas="${pasMoins}">−</button><span>${texte}</span><button data-act="edNum" data-i="${i}" data-champ="${champ}" data-pas="${pasPlus}">+</button></span>`;
  const ligne = (e, i) => { const n = nature(e);
    return h`<div class="ed-ligne ${e.type === "version" ? "ed-version" : ""}"><div class="ed-tete"><select data-act="edNature" data-i="${i}">${Object.entries(NATURES).map(([k, l]) => h`<option value="${k}" ${k === n ? "selected" : ""}>${l}</option>`)}</select>
        <span class="ed-outils"><button data-act="edBouger" data-i="${i}" data-pas="-1" ${i === 0 ? "disabled" : ""}>↑</button><button data-act="edBouger" data-i="${i}" data-pas="1" ${i === m.lignes.length - 1 ? "disabled" : ""}>↓</button><button data-act="edSuppr" data-i="${i}">✕</button></span></div>
      ${n === "version" ? h`<input type="text" value="${e.nom}" placeholder="Nom de la variante (ex. Remplacement bloc)" data-act="edTexte" data-i="${i}" data-champ="nom">`
      : n === "routine" ? h`<select data-act="edTexte" data-i="${i}" data-champ="nom"><option value="">— choisir —</option>${routines.map(r => h`<option value="${r}" ${r === e.nom ? "selected" : ""}>${r}</option>`)}</select>`
      : n === "info" ? h`<input type="text" value="${e.texte}" placeholder="Consigne" data-act="edTexte" data-i="${i}" data-champ="texte">`
      : h`<div class="ed-champs">
          <div class="ed-rangee">${pas(i, "n", e.n, `${e.n}×`, -1, 1)}<input type="text" class="ed-texte" value="${e.texte}" placeholder="${n === "grimpe" ? "Voie en 5b · « Travail au point »" : n === "course" ? "course lente" : "« Gainage »"}" data-act="edTexte" data-i="${i}" data-champ="texte"></div>
          ${si(n !== "course", h`<div class="ed-rangee"><select data-act="edExo" data-i="${i}"><option value="">+ un exercice de la bibliothèque…</option>${data.exercices.map(x => h`<option value="${x.nom}">${x.nom}</option>`)}</select></div>`)}
          ${si(n === "grimpe", () => h`<div class="ed-rangee">${choix("edGrimpe", [["Voie", "Voie"], ["Bloc", "Bloc"]], e.grimpe.disc, { data: { i }, classe: "compact" })}<div class="choix compact">${["", ...(data.echelles[e.grimpe.disc] || []).slice(2, 12)].map(c => h`<button data-act="edCot" data-i="${i}" data-valeur="${c}" class="${(e.grimpe.cot || "") === c ? "choisi" : ""}">${c || "—"}</button>`)}</div></div>
            <div class="ed-rangee"><span class="petit">Repos</span>${pas(i, "repos", e.repos, e.repos ? texteDuree(e.repos) : "défaut", -30, 30)}<span class="petit">Série</span>${pas(i, "serie", e.serie, e.serie || "—", -1, 1)}</div>`)}
          ${si(n === "exo", () => h`<div class="ed-rangee"><span class="petit">Chrono</span>${pas(i, "chrono", e.chrono, e.chrono ? texteDuree(e.chrono) : "—", -15, 15)}<button data-act="edBool" data-i="${i}" data-champ="cote" class="${e.cote ? "choisi" : ""}">par côté</button><span class="petit">Repos</span>${pas(i, "repos", e.repos, e.repos ? texteDuree(e.repos) : "défaut", -30, 30)}</div>`)}
          ${si(n === "course", () => h`<div class="ed-rangee"><span class="petit">Course</span>${pas(i, "fractions.course", e.fractions.course, texteDuree(e.fractions.course), -30, 30)}<span class="petit">Marche</span>${pas(i, "fractions.marche", e.fractions.marche, texteDuree(e.fractions.marche), -30, 30)}</div>`)}
          ${si(n === "mesure", h`<div class="ed-rangee"><span class="petit">Clé</span><input type="text" value="${e.mesure}" data-act="edTexte" data-i="${i}" data-champ="mesure" placeholder="planche"></div>`)}
          <div class="ed-rangee">${choix("edGenre", GENRES, e.genre, { data: { i }, classe: "compact" })}<span class="petit">Durée</span>${pas(i, "duree", e.duree, e.duree ? texteDuree(e.duree) : "auto", -300, 300)}</div>
          ${si(e.erreurs && e.erreurs.length, h`<p class="petit rouge-txt">${e.erreurs.join(" · ")}</p>`)}
        </div>`}</div>`; };
  return h`<h2>${m.cible ? "Modifier le plan" : "Nouvelle séance"}</h2>
    ${si(!m.cible, h`<div class="ed-rangee"><input type="date" data-champ="date" value="${m.date}">${choix("mChamp", data.listes.Activités || ["Voie", "Bloc", "Maison", "Course"], m.activite, { data: { champ: "activite" }, classe: "compact" })}</div>`)}
    ${m.texte ? h`<textarea data-champ="contenu" rows="12" class="code">${m.contenu}</textarea><p class="petit"><button class="lien" data-act="ouvrirAide" data-k="syntaxe">Syntaxe</button></p>`
      : h`<div class="ed-lignes">${m.lignes.map(ligne)}${si(!m.lignes.length, h`<p class="petit">Aucune étape. Ajoute-en une ci-dessous.</p>`)}</div>
        <div class="choix compact ed-ajout">${Object.entries(NATURES).map(([k, l]) => h`<button data-act="edAjout" data-n="${k}">+ ${l}</button>`)}</div>`}
    <div class="actions"><button data-act="edMode">${m.texte ? "Formulaire" : "Texte"}</button><button data-act="mFermer">Annuler</button><button class="principal" data-act="edOk">Enregistrer</button></div>`;
}

const L = (ctx, d) => M(ctx).lignes[+d.i];
const poser = (o, chemin, v) => { const p = chemin.split("."); let x = o; for (const k of p.slice(0, -1)) x = x[k]; x[p[p.length - 1]] = v; };
const lire = (o, chemin) => chemin.split(".").reduce((x, k) => (x || {})[k], o);
export const actions = {
  edNature: (ctx, d, el) => { const m = M(ctx), anc = m.lignes[+d.i], neuf = vide(el.value); if (anc.type === "action" && neuf.type === "action") { neuf.texte = anc.texte; neuf.n = anc.n; neuf.genre = anc.genre; } m.lignes[+d.i] = neuf; ctx.rendre(); },
  edTexte: (ctx, d, el) => { const e = L(ctx, d); e[d.champ] = d.champ === "mesure" ? el.value.trim().toLowerCase().replace(/\s+/g, "_") : el.value; if (d.champ === "texte") e.exos = [...e.texte.matchAll(/«\s*(.+?)\s*»/g)].map(x => x[1]); },
  edExo: (ctx, d, el) => { if (!el.value) return; const e = L(ctx, d); e.texte = (e.texte ? e.texte + " · " : "") + `« ${el.value} »`; ctx.rendre(); },
  edNum: (ctx, d) => { const e = L(ctx, d), v = lire(e, d.champ) || 0, mini = d.champ === "n" ? 1 : 0; poser(e, d.champ, Math.max(mini, v + +d.pas) || (d.champ === "n" ? 1 : null)); ctx.rendre(); },
  edBool: (ctx, d) => { const e = L(ctx, d); e[d.champ] = !e[d.champ]; ctx.rendre(); },
  edGrimpe: (ctx, d) => { const e = L(ctx, d); e.grimpe = { disc: d.valeur, cot: "" }; ctx.rendre(); },
  edCot: (ctx, d) => { const e = L(ctx, d); e.grimpe.cot = d.valeur; ctx.rendre(); },
  edGenre: (ctx, d) => { const e = L(ctx, d); e.genre = d.valeur; ctx.rendre(); },
  edBouger: (ctx, d) => { const l = M(ctx).lignes, i = +d.i, j = i + +d.pas; if (j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; ctx.rendre(); },
  edSuppr: (ctx, d) => { M(ctx).lignes.splice(+d.i, 1); ctx.rendre(); },
  edAjout: (ctx, d) => { M(ctx).lignes.push(vide(d.n)); ctx.rendre(); },
  edMode: ctx => { const m = M(ctx); if (m.texte) m.lignes = lignesDe(m.contenu); else m.contenu = contenuDe(m.lignes); m.texte = !m.texte; ctx.rendre(); },
  edOk: ctx => { const m = M(ctx), contenu = m.texte ? m.contenu : contenuDe(m.lignes), debut = ctx.doc.reglages.dateDebut || ctx.data.dateDebut;
    if (m.cible) ctx.modifier("plan modifié", d => { d.ops.push({ id: nouvelId("o"), op: "set", cible: m.cible, contenu }); });
    else { const id = nouvelId("l"), sem = semaineDe(debut, m.date); ctx.modifier("séance créée", d => { d.ops.push({ id: nouvelId("o"), op: "set", cible: id, semaine: sem, jour: nomJour(m.date), activite: m.activite, phase: "Séance créée", contenu }); if (sem < 1) d.ops.push({ id: nouvelId("o"), op: "date", cible: id, date: m.date }); }); ctx.state.seanceId = id; }
    ctx.fermerModal(); ctx.ouvrir("seance"); },
};
