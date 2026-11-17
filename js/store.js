// store.js — un seul document, versionné, avec migrations numérotées et annulation.
//
// Le document est la seule chose stockée. La sauvegarde, l'export, l'import, l'annulation
// et les migrations portent tous sur cet objet unique. Stockage : IndexedDB ; localStorage
// en secours si IndexedDB est indisponible (navigation privée, vieux navigateur).
//
//   const store = await ouvrirStore();                 charge (ou crée) le document
//   store.doc                                          lecture
//   store.modifier("libellé", doc => { ... })          modification + sauvegarde + instantané pour « Annuler »
//   store.modifier("libellé", fn, { annulable: false })  idem sans instantané (gestes techniques : pause, export…)
//   store.annuler()                                    revient à l'instantané précédent (vrai si fait)
//   store.remplacer(doc)                               import d'une sauvegarde (migrée au passage)
//   store.abonner(fn)                                  fn(doc, libellé) après chaque changement

export const VERSION_DOC = 6;

export const documentVide = () => ({
  version: VERSION_DOC,
  programmeId: null,                 // identifiant du programme (data.js) auquel les saisies appartiennent
  reglages: { dateDebut: "", repos: { Voie: 300, Bloc: 180, Maison: 90, Course: 0 }, son: true, reposAuto: false, salleParDefaut: {}, ecranAllume: true, grand: false,
              raccourciRepos: "",            // nom d'un Raccourci iOS qui lance le minuteur natif (facultatif)
              sync: { owner: "", repo: "", chemin: "grimpe/grimpe.json", auto: true },   // dépôt GitHub privé ; le jeton n'est PAS dans le document
              params: {} },
  seances: {},                       // id → saisie (voir LISEZMOI « Le document »)
  ops: [],                           // modifications du programme faites dans l'app
  blocs: [], exos: [],                         // blocs construits dans l'app (assistant) : leurs séances, leur objectif, leurs feux verts
  mesures: {},                       // semaine → mesures
  competences: {},                   // bloc → bilan
  salles: [],                        // { id, nom, type, couleurs: [], cotation: { Voie: { mode, liste }, Bloc: {...} }, secteurs: [ { id, nom, profil } ],
                                     //   voies: [ { id, disc, cot, cotSalle, couleur, nom, profil, secteurId, ordre, statut, ouverte, demontee } ] }
  passagesAnciens: [],               // tentatives faites sans l'app : { id, date, disc, cot, profil, res, couleur, nom, salle }
  feuxVus: {},                       // feu vert → date à laquelle la carte « feu vert ! » a été vue
  favoris: [],
  dernierExport: null, derniereSync: null,
});

// Migrations : de la version n à n+1. Ajouter une entrée à chaque changement de schéma, ne jamais en retirer.
export const MIGRATIONS = {
  // 1 → 2 : plus de comptabilité d'étapes ni de modes de suivi ; salles avec façon de coter et secteurs
  1: doc => {
    for (const sa of Object.values(doc.seances)) { if (sa.focus) sa.curseur = sa.focus; delete sa.focus; delete sa.etapes; delete sa.mode; }
    delete doc.reglages.modes;
    for (const s of doc.salles || []) { s.cotation = s.cotation || { Voie: { mode: "standard", liste: [] }, Bloc: { mode: "standard", liste: [] } }; s.secteurs = s.secteurs || [];
      (s.voies || []).forEach((v, i) => { v.secteurId = v.secteurId || null; v.ordre = v.ordre ?? i; if (v.secteur && !v.secteurId) { let sec = s.secteurs.find(x => x.nom === v.secteur); if (!sec) { sec = { id: "sec-" + i, nom: v.secteur, profil: "" }; s.secteurs.push(sec); } v.secteurId = sec.id; } delete v.secteur; }); }
    doc.feuxVus = doc.feuxVus || {};
  },
  // 2 → 3 : les niveaux d'une salle sont du texte (« 6 », pas 6) ; on retrouve l'équivalent perdu dans la cotation de l'app
  // 3 → 4 : les blocs construits dans l'app (assistant « Construire un bloc »)
  3: doc => { doc.blocs = doc.blocs || []; },
  4: doc => { doc.exos = doc.exos || []; },
  // 8.20 : un exercice ajouté aux séances voie était aussi recopié avant « ## Voie » ; ces blocs sont régénérés au démarrage (app.js)
  5: doc => { for (const b of doc.blocs || []) if (b.plan && b.plan.exos && Object.values(b.plan.exos.ajouts || {}).some(l => l && l.length)) b.aRegenerer = true; },
  2: doc => {
    const txt = x => x === null || x === undefined ? "" : String(x), parId = {};
    for (const s of doc.salles || []) {
      for (const disc of ["Voie", "Bloc"]) { const c = (s.cotation || {})[disc]; if (c && c.liste) c.liste.forEach(x => { x.salle = txt(x.salle); x.app = txt(x.app); }); }
      for (const v of s.voies || []) { v.cotSalle = txt(v.cotSalle);
        const c = (s.cotation || {})[v.disc] || { mode: "standard", liste: [] };
        if (!v.cot) v.cot = c.mode === "standard" ? v.cotSalle : c.mode === "liste" ? ((c.liste.find(x => x.salle === v.cotSalle) || {}).app || "") : c.mode === "couleurs" ? ((c.liste.find(x => x.salle === v.couleur) || {}).app || "") : "";
        parId[v.id] = v; } }
    const reparer = t => { if (t.cotSalle !== undefined) t.cotSalle = txt(t.cotSalle); const v = t.voieId && parId[t.voieId]; if (v && !t.cot && v.cot) t.cot = v.cot; };
    for (const sa of Object.values(doc.seances || {})) (sa.tentatives || []).forEach(reparer);
    (doc.passagesAnciens || []).forEach(reparer);
  },
};
export function migrer(doc) {
  const d = { ...documentVide(), ...doc };
  d.reglages = { ...documentVide().reglages, ...(doc.reglages || {}) };
  for (let v = d.version || 0; v < VERSION_DOC; v++) { if (MIGRATIONS[v]) MIGRATIONS[v](d); d.version = v + 1; }
  if (d.version > VERSION_DOC) throw new Error(`Document version ${d.version} : cette version de l'app (document ${VERSION_DOC}) est trop ancienne.`);
  return d;
}

// --- Adaptateurs de stockage ---
export const memoire = () => { let v = null; return { async lire() { return v; }, async ecrire(x) { v = x; } }; };
const local = (cle = "grimpe-doc") => ({
  async lire() { const t = localStorage.getItem(cle); return t ? JSON.parse(t) : null; },
  async ecrire(d) { localStorage.setItem(cle, JSON.stringify(d)); } });
function idb(nom = "grimpe") {
  const ouvrir = () => new Promise((ok, ko) => { const r = indexedDB.open(nom, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("docs"); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
  const req = (mode, f) => ouvrir().then(db => new Promise((ok, ko) => { const tx = db.transaction("docs", mode), q = f(tx.objectStore("docs"));
    q.onsuccess = () => ok(q.result); q.onerror = () => ko(q.error); tx.oncomplete = () => db.close(); }));
  return { async lire() { return (await req("readonly", s => s.get("doc"))) || null; },
           async ecrire(d) { await req("readwrite", s => s.put(d, "doc")); } };
}
export async function adaptateurParDefaut() {
  if (typeof indexedDB !== "undefined") { try { const a = idb(); await a.lire(); return a; } catch { /* secours */ } }
  if (typeof localStorage !== "undefined") return local();
  return memoire();
}

export async function ouvrirStore(adaptateur, { instantanes = 30 } = {}) {
  const ad = adaptateur || await adaptateurParDefaut();
  let doc = migrer((await ad.lire()) || documentVide());
  const pile = [], abonnes = [];
  let chaine = Promise.resolve();
  const sauver = () => { chaine = chaine.then(() => ad.ecrire(doc)).catch(e => console.error("Sauvegarde impossible", e)); return chaine; };
  const prevenir = l => abonnes.forEach(f => f(doc, l));
  const store = {
    get doc() { return doc; },
    modifier(libelle, fn, { annulable = true } = {}) {
      if (annulable) { pile.push({ libelle, avant: JSON.stringify(doc) }); if (pile.length > instantanes) pile.shift(); }
      const copie = JSON.parse(JSON.stringify(doc)); fn(copie); doc = copie;
      sauver(); prevenir(libelle); return doc;
    },
    get annulable() { return pile.length ? pile[pile.length - 1].libelle : null; },
    annuler() { const p = pile.pop(); if (!p) return false; doc = JSON.parse(p.avant); sauver(); prevenir("annulation"); return true; },
    remplacer(nouveau) { pile.length = 0; doc = migrer(nouveau); sauver(); prevenir("import"); return doc; },
    reinitialiser() { pile.length = 0; doc = documentVide(); sauver(); prevenir("réinitialisation"); },
    abonner(f) { abonnes.push(f); return () => abonnes.splice(abonnes.indexOf(f), 1); },
    attendre: () => chaine,
  };
  return store;
}
