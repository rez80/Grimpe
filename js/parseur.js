// parseur.js — la grammaire d'une séance, écrite une seule fois.
//
//   ## Nom                       début d'une version (les lignes avant le premier ## sont communes)
//   > Nom de routine             routine à cocher (onglet Routines)
//   ! texte                      consigne, sans case
//   3× texte {marqueurs}         action à faire 3 fois (sans « 3× » : une fois)
//
// Marqueurs d'une action, entre accolades, n'importe où dans la ligne, dans n'importe quel ordre :
//   {voie 5b} {bloc 5} {voie}    la ligne se note voie par voie (cotation proposée facultative)
//   {repos 4min} {repos 90s}     repos entre deux passages
//   {chrono 30s} {chrono 25min}  bouton chrono de cette durée
//   {fractions 2min/2min}        minuteur course / marche, répété N fois
//   {durée 15min}                durée prévue de l'étape (sinon estimée)
//   {série 4}                    un résultat par bloc, 4 par passage (circuit)
//   {effort} {facile} {récup} {échauffement}   type de l'étape (couleur) ; sinon « facile »
//   {feu 5c}                     rappel du feu vert correspondant
//   {côté}                       exercice à faire de chaque côté (le chrono compte double)
//   {mesure planche}             l'étape est une mesure : un champ de saisie s'affiche (clé « planche »), enregistrée dans les mesures de la semaine
// Les « Noms d'exercice » entre guillemets français sont des liens vers la fiche.
// Rien n'est deviné d'après le texte libre : ce qui n'est pas entre accolades est de la prose.

const GENRES = { effort: "effort", facile: "facile", "récup": "recup", recup: "recup", "échauffement": "echauffement", echauffement: "echauffement", "sécurité": "securite", securite: "securite" };

export function secondes(txt) {                 // « 4min », « 4 min », « 90 s », « 1h », « 1 h 30 » → secondes
  const t = String(txt).trim().toLowerCase();
  const h = t.match(/^(\d+)\s*h\s*(\d+)?$/); if (h) return +h[1] * 3600 + (+h[2] || 0) * 60;
  const m = t.match(/^(\d+(?:[.,]\d+)?)\s*(min|mn|m)$/); if (m) return Math.round(+m[1].replace(",", ".") * 60);
  const s = t.match(/^(\d+)\s*s(ec)?$/); if (s) return +s[1];
  return null;
}
export const texteDuree = sec => sec == null ? "" : sec % 60 === 0 ? `${sec / 60}min` : `${sec}s`;

const MARQUEUR = /\{([^{}]*)\}/g;

export function analyserLigne(brut) {
  const l = brut.trim();
  if (!l) return null;
  if (l.startsWith("##")) return { type: "version", nom: l.slice(2).trim() };
  if (l.startsWith(">")) return { type: "routine", nom: l.slice(1).trim() };
  if (l.startsWith("!")) return { type: "info", texte: l.slice(1).trim() };
  const a = { type: "action", texte: "", n: 1, repos: null, chrono: null, fractions: null, duree: null, serie: 0, genre: null, grimpe: null, feu: null, cote: false, mesure: null, exos: [], erreurs: [] };
  let reste = l;
  const n = reste.match(/^(\d+)\s*[×x]\s*/i);
  if (n) { a.n = +n[1]; reste = reste.slice(n[0].length); }
  reste = reste.replace(MARQUEUR, (tout, corps) => {
    const [cle, ...args] = corps.trim().split(/\s+/); const arg = args.join(" "); const k = cle.toLowerCase();
    if (k === "voie" || k === "bloc") a.grimpe = { disc: k === "voie" ? "Voie" : "Bloc", cot: arg };
    else if (k === "repos") a.repos = secondes(arg);
    else if (k === "chrono") a.chrono = secondes(arg);
    else if (k === "durée" || k === "duree") a.duree = secondes(arg);
    else if (k === "fractions") { const [c, m] = arg.split("/"); a.fractions = { course: secondes(c), marche: secondes(m) }; }
    else if (k === "série" || k === "serie") a.serie = +arg || 0;
    else if (k === "feu") a.feu = arg;
    else if (k === "côté" || k === "cote") a.cote = true;
    else if (k === "mesure") a.mesure = arg.trim().toLowerCase().replace(/\s+/g, "_") || "mesure";
    else if (GENRES[k]) a.genre = GENRES[k];
    else a.erreurs.push(`marqueur inconnu « ${corps.trim()} »`);
    return "";
  });
  a.texte = reste.replace(/\s{2,}/g, " ").replace(/\s+·\s*$/, "").trim();
  a.exos = [...a.texte.matchAll(/«\s*(.+?)\s*»/g)].map(m => m[1]);
  if (!a.genre) a.genre = "facile";
  return a;
}

// Contenu complet → { communes, versions: [{nom, lignes}] } puis étapes d'une version
export function decouper(contenu) {
  const communes = [], versions = [];
  for (const brut of String(contenu || "").split("\n")) {
    const e = analyserLigne(brut); if (!e) continue;
    if (e.type === "version") versions.push({ nom: e.nom, lignes: [] });
    else (versions.length ? versions[versions.length - 1].lignes : communes).push(e);
  }
  return { communes, versions };
}
export const versionsDe = contenu => decouper(contenu).versions.map(v => v.nom);
export function etapesDe(contenu, version = 0) {
  const { communes, versions } = decouper(contenu);
  const v = versions[version] || versions[0];
  return [...communes, ...(v ? v.lignes : [])];
}
// Clé d'une étape dans les saisies : index + version (les versions ne partagent que les lignes communes)
export const cleEtape = (version, i, nbCommunes) => i < nbCommunes ? `c${i}` : `v${version || 0}-${i}`;

// Genre d'une routine (couleur) : d'après son nom déclaré dans les données, sinon échauffement
export const genreRoutine = (nom, routines) => (routines.find(r => r.routine === nom) || {}).genre || "echauffement";

// Titre court d'une action : ce qui précède le premier « · », sans guillemets
export const titreAction = e => e.texte.split(" · ")[0].replace(/«\s*|\s*»/g, "");

// --- Sérialisation : l'inverse d'analyserLigne, pour l'éditeur structuré ---
const GENRE_TXT = { effort: "effort", facile: "facile", recup: "récup", echauffement: "échauffement", securite: "sécurité" };
export function texteDe(e) {
  if (e.type === "version") return `## ${e.nom}`;
  if (e.type === "routine") return `> ${e.nom}`;
  if (e.type === "info") return `! ${e.texte}`;
  const m = [];
  if (e.grimpe) m.push(`{${e.grimpe.disc === "Bloc" ? "bloc" : "voie"}${e.grimpe.cot ? " " + e.grimpe.cot : ""}}`);
  if (e.repos) m.push(`{repos ${texteDuree(e.repos)}}`);
  if (e.chrono) m.push(`{chrono ${texteDuree(e.chrono)}}`);
  if (e.fractions) m.push(`{fractions ${texteDuree(e.fractions.course)}/${texteDuree(e.fractions.marche)}}`);
  if (e.duree) m.push(`{durée ${texteDuree(e.duree)}}`);
  if (e.serie) m.push(`{série ${e.serie}}`);
  if (e.feu) m.push(`{feu ${e.feu}}`);
  if (e.cote) m.push("{côté}");
  if (e.mesure) m.push(`{mesure ${e.mesure}}`);
  if (e.genre && e.genre !== "facile") m.push(`{${GENRE_TXT[e.genre] || e.genre}}`);
  return `${e.n > 1 ? e.n + "× " : ""}${(e.texte || "").trim()}${m.length ? " " + m.join(" ") : ""}`.trim();
}
// Toutes les lignes d'un contenu, versions comprises, à plat (pour l'éditeur) ; et l'inverse
export const lignesDe = contenu => String(contenu || "").split("\n").map(analyserLigne).filter(Boolean);
export const contenuDe = lignes => lignes.map(texteDe).join("\n");
