// ecrans/plus.js — l'onglet Plus et ses sous-écrans : sauvegarde (fichier et GitHub), salles, passages hors séance, calendrier, bibliothèque, réglages, aide.
import { h, si, lier, pli, brut, forcerOuvert } from "../html.js";
import { construireExport, nomFichier, partager, lireFichier, verifierImport, copierTexte, lireTexte, tailleKo } from "../export.js";
import { reussi, tentatives as toutesTentatives } from "../analyse.js";
import { lireJeton, ecrireJeton, configValide, creerSync } from "../sync.js";
import { fondSalle, hexDe } from "../salles.js";
import { court, mmss } from "../dates.js";
import { RES_LABEL } from "./seance.js";

export function rendre(ctx) {
  switch (ctx.state.vue) {
    case "sauvegarde": return sauvegarde(ctx);
    case "biblio": return biblio(ctx);
    case "salles": return salles(ctx);
    case "historique": return historique(ctx);
    case "calendrier": return calendrier(ctx);
    case "reglages": return reglages(ctx);
    case "aide": return aide(ctx);
    default: return menu(ctx);
  }
}

function menu(ctx) {
  const { doc, data } = ctx, sync = doc.derniereSync, dernier = doc.dernierExport, jours = dernier ? Math.floor((Date.now() - new Date(dernier)) / 864e5) : null;
  const etatSauvegarde = sync && sync.ok && configValide(doc.reglages.sync) ? `GitHub · ${court(sync.quand.slice(0, 10))}` : sync && !sync.ok ? "GitHub en erreur" : dernier ? `export il y a ${jours} j` : "jamais sauvegardé";
  const alerte = !(sync && sync.ok && (Date.now() - new Date(sync.quand)) < 8 * 864e5) && (jours === null || jours > 7);
  return { titre: h`<b>Plus</b>`, html: h`<div class="menu-plus">
    <button class="tuile ${alerte ? "attention" : ""}" data-act="ouvrirVue" data-vue="sauvegarde"><span class="ico">⬆</span><span><b>Sauvegarde</b><br><span class="petit">${etatSauvegarde}</span></span></button>
    <button class="tuile" data-act="ouvrirVue" data-vue="salles"><span class="ico">🧗</span><span><b>Salles</b><br><span class="petit">${doc.salles.length} salle${doc.salles.length > 1 ? "s" : ""} · ${doc.salles.reduce((n, s) => n + s.voies.filter(v => v.statut !== "demontee").length, 0)} voies en place</span></span></button>
    <button class="tuile" data-act="ouvrirVue" data-vue="calendrier"><span class="ico">📅</span><span><b>Calendrier</b><br><span class="petit">le programme dans l'iPhone</span></span></button>
    <button class="tuile" data-act="ouvrirVue" data-vue="biblio"><span class="ico">📖</span><span><b>Bibliothèque</b><br><span class="petit">${data.exercices.length} exercices · ${new Set(data.routines.map(r => r.routine)).size} routines</span></span></button>
    <button class="tuile" data-act="ouvrirVue" data-vue="reglages"><span class="ico">⚙</span><span><b>Réglages</b><br><span class="petit">repos, affichage, minuteur</span></span></button>
    <button class="tuile" data-act="ouvrirVue" data-vue="aide"><span class="ico">?</span><span><b>Aide</b><br><span class="petit">principe, syntaxe, données</span></span></button>
    </div><p class="petit centre">Annuler le dernier geste : ⋯ en haut, sur chaque écran.</p><p class="petit centre">Grimpe ${ctx.APP_VERSION} · programme du ${data.dateDebut} généré le ${data.genereLe} · document v${doc.version}</p>` };
}

function sauvegarde(ctx) {
  const { doc } = ctx, n = Object.values(doc.seances).filter(s => s.fin).length, cfg = doc.reglages.sync || {}, jeton = lireJeton(), sync = doc.derniereSync;
  return { titre: h`<b>Sauvegarde</b>`, html: h`<div class="carte compacte"><p><b>État</b> · ${n} séance${n > 1 ? "s" : ""} faite${n > 1 ? "s" : ""} sur ce téléphone</p><p class="petit">GitHub : ${sync ? (sync.ok ? `dernier envoi ${new Date(sync.quand).toLocaleString("fr-BE")} ✓` : `échec le ${new Date(sync.quand).toLocaleString("fr-BE")}`) : "jamais envoyé"} · Fichier : ${doc.dernierExport ? `exporté le ${new Date(doc.dernierExport).toLocaleString("fr-BE")}` : "jamais exporté"}</p></div>
    ${pli("sv-github", false, "Automatique · GitHub", () => h`<p class="petit">Remplis les quatre champs puis « Enregistrer et tester ». Après chaque séance, l'app pousse son document dans un dépôt <b>privé</b> à toi : rien à installer, l'historique git garde chaque version, et l'outil PC le lit directement (<code>grimpe.py rapport --github</code>). Le jeton reste sur ce téléphone, jamais dans le document ni dans les exports.</p>
      <label class="champ">Dépôt (propriétaire / nom)</label><div class="ed-rangee"><input type="text" value="${cfg.owner || ""}" placeholder="ton-pseudo" data-frappe="syncChamp" data-cle="owner" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off"><input type="text" value="${cfg.repo || ""}" placeholder="grimpe-donnees" data-frappe="syncChamp" data-cle="repo" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off"></div>
      <label class="champ">Chemin du fichier</label><input type="text" value="${cfg.chemin || "grimpe/grimpe.json"}" data-frappe="syncChamp" data-cle="chemin" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off">
      <label class="champ">Jeton (fine-grained, « Contents : Read and write » sur ce seul dépôt)</label><input type="text" class="secret" value="${jeton}" placeholder="github_pat_…" data-frappe="syncJeton" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off">
      <div class="ligne-reg"><span>Pousser après chaque séance</span><button class="bascule ${cfg.auto !== false ? "on" : ""}" data-act="syncAuto" aria-label="Automatique"></button></div>
      <p class="petit">${sync ? (sync.ok ? `Dernier envoi : ${new Date(sync.quand).toLocaleString("fr-BE")} ✓` : `Échec le ${new Date(sync.quand).toLocaleString("fr-BE")} : ${sync.erreur}`) : "Jamais envoyé."}</p>
      <div class="actions"><button data-act="syncRecuperer">⬇ Récupérer</button><button class="principal" data-act="syncPousser">⬆ Enregistrer et tester</button></div>`, { classe: "carte", resume: sync ? (sync.ok ? "✓ " + new Date(sync.quand).toLocaleDateString("fr-BE") : "échec") : "non configurée" })}
    ${pli("sv-fichier", false, "Fichier", () => h`<p class="petit">Le même document en JSON : ${n} séance${n > 1 ? "s" : ""}, réglages, salles, bilan calculé. Sauvegarde et entrée de l'outil PC (<code>grimpe.py rapport fichier.json</code>).</p>
      <button class="gros principal" data-act="exporter">⬆ Exporter le fichier</button>
      <button class="gros contour" data-act="copierDonnees">⧉ Copier les données <span class="petit">(à coller dans Notes ou un mail)</span></button>
      <p class="petit">Taille de la sauvegarde : ${tailleKo(construireExport({ data: ctx.data, doc, programme: ctx.programme, bilan: ctx.bilan }))} ko. Dans Mail, vérifie que la pièce jointe « grimpe-….json » est bien là avant d'envoyer.</p>
      <p class="petit">${doc.dernierExport ? `Dernier export : ${new Date(doc.dernierExport).toLocaleString("fr-BE")}` : "Jamais exporté."}</p>
      <label class="gros contour fichier">Restaurer depuis un fichier…<input type="file" accept=".json,.txt,application/json,text/plain" data-act="importFichier"></label>
      <button class="gros contour" data-act="collerOuvrir">Restaurer en collant le texte…</button>`, { classe: "carte", resume: doc.dernierExport ? "export " + new Date(doc.dernierExport).toLocaleDateString("fr-BE") : "" })}
    ${pli("sv-effacer", false, "Tout effacer", () => h`<p class="petit">Efface toutes les saisies, salles et réglages de ce téléphone.</p><button class="gros contour danger" data-act="reinitTout">Effacer toutes les données</button>`, { classe: "carte" })}` };
}

function biblio(ctx) {
  const { data, state } = ctx, r = state.filtre.biblio || "";
  const routines = [...new Set(data.routines.map(x => x.routine))];
  return { titre: h`<b>Bibliothèque</b>`, html: h`<input type="search" class="recherche" placeholder="Rechercher un exercice…" value="${r}" data-frappe="biblioRecherche" aria-label="Rechercher">
    <div id="biblio-liste">${listeBiblio(ctx, r)}</div>
    <h2 class="section">Routines</h2>${routines.map(n => pli(`routine-${n}`, false, n, () => h`<ol class="routine">${data.routines.filter(x => x.routine === n).map(x => h`<li><b>${x.etape}</b>${x.duree ? h` <span class="petit">${mmss(x.duree)}</span>` : ""}<div class="petit">${lier(x.quoi, data.exercices)}</div></li>`)}</ol>`, { resume: mmss(data.routines.filter(x => x.routine === n).reduce((t, x) => t + x.duree, 0)) }))}` };
}
const sansAccent = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function listeBiblio(ctx, recherche) {
  const { data, doc } = ctx, q = sansAccent(recherche).trim(), tous = data.exercices.map((x, k) => ({ ...x, k }));
  const item = x => h`<button class="item" data-act="ficheExo" data-k="${x.k}"><span>${doc.favoris.includes(x.nom) ? "★ " : ""}${x.nom}</span><span class="petit">${q ? x.categorie : ""}${x.niveau ? (q ? " · " : "") + x.niveau : ""}</span></button>`;
  if (q) { const l = tous.filter(x => sansAccent([x.nom, x.categorie, x.description, x.consignes].join(" ")).includes(q)); return l.length ? h`<div class="liste">${l.map(item)}</div>` : h`<p class="petit">Aucun exercice pour « ${recherche} ».</p>`; }
  const favs = tous.filter(x => doc.favoris.includes(x.nom)), cats = [...new Set(tous.map(x => x.categorie))];
  return h`${si(favs.length, () => pli("biblio-favoris", true, "★ Favoris", () => h`<div class="liste">${favs.map(item)}</div>`, { resume: String(favs.length) }))}
    ${cats.map(c => { const l = tous.filter(x => x.categorie === c); return pli(`biblio-${c}`, false, c, () => h`<div class="liste">${l.map(item)}</div>`, { resume: String(l.length) }); })}`;
}

function salles(ctx) {
  const { doc } = ctx, ts = toutesTentatives(ctx.programme, doc);
  return { titre: h`<b>Salles</b>`, html: h`<div class="cartes-salles">${doc.salles.map(s => { const v = s.voies.filter(x => x.statut !== "demontee"), cs = [...new Set(v.map(x => x.couleur).filter(Boolean))];
      const derniere = ts.filter(t => t.salle === s.id && t.date).map(t => t.date).sort().pop(), nv = v.filter(x => x.disc === "Voie").length, nb = v.filter(x => x.disc === "Bloc").length;
      return h`<div class="carte-salle" style="background:${fondSalle(doc, s)}"><button class="cs-corps" data-act="salleOuvrir" data-id="${s.id}"><b>${s.nom}</b>
        <span class="cs-infos">${s.type === "Bloc et voie" ? "Bloc et voie" : s.type === "Bloc" ? "Bloc" : "Voie"} · ${[s.type !== "Bloc" ? `${nv} voie${nv > 1 ? "s" : ""}` : "", s.type !== "Voie" ? `${nb} bloc${nb > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ")}</span></button>
        <button class="item-edit" data-act="salleEditer" data-id="${s.id}" aria-label="Modifier la salle">✎</button></div>`; })}</div>
    ${si(!doc.salles.length, h`<p class="petit">Une salle, c'est ta mémoire des voies : couleur, niveau, secteur, et ton historique sur chacune. Pendant une séance, tu touches la voie au lieu de remplir une fiche.</p>`)}
    <button class="gros contour" data-act="salleNouvelle">+ Nouvelle salle</button>` };
}

function historique(ctx) {
  const { doc } = ctx, l = doc.passagesAnciens.filter(p => !p.voieId).sort((a, b) => (a.date || "0") < (b.date || "0") ? 1 : -1), dates = [...new Set(l.map(p => p.date || ""))];
  return { titre: h`<b>Passages hors séance</b>`, html: h`<p class="petit">Ce que tu as grimpé sans séance dans l'app et sans voie de salle connue (avant le programme, en extérieur…). Pour une voie d'une salle : sa fiche › Historique › + Ajouter. Sans date, un passage compte dans les niveaux, les feux verts et les projets, pas dans la charge ni dans le bilan de la semaine.</p>
    <button class="gros contour" data-act="passageAncienOuvrir">+ Passage hors séance</button>
    ${dates.map(d => h`<div class="carte compacte"><b>${d ? court(d) : "Date inconnue"}</b>${l.filter(p => (p.date || "") === d).map(p => h`<div class="ligne-res"><span><span class="pastille" style="background:${hexDe(doc, p.couleur)}"></span> ${p.disc} ${p.cot || "?"}${p.nom ? " · " + p.nom : ""} <span class="petit">${(p.profil || "").toLowerCase()}</span></span><span><span class="res res-${p.res}">${RES_LABEL[p.res]}</span> <button class="lien" data-act="passageAncienSuppr" data-id="${p.id}">✕</button></span></div>`)}</div>`)}` };
}

function calendrier(ctx) {
  const base = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, ""), http = base.startsWith("http") ? base : "", webcal = http ? http.replace(/^https?:/, "webcal:") + "programme.ics" : "";
  return { titre: h`<b>Calendrier</b>`, html: h`<div class="carte"><h2>Le programme dans ton calendrier</h2>
    <p>L'outil PC écrit <code>programme.ics</code> à côté de <code>data.js</code> à chaque génération : une séance = un événement, avec le plan en description. Abonne-toi une fois : pauses, déplacements et nouvelles séances suivent à la régénération suivante, et les rappels viennent du calendrier de l'iPhone, ce qu'une app web ne sait pas faire seule.</p>
    ${webcal ? h`<p><a class="bouton" href="${webcal}">📅 S'abonner (webcal)</a></p><p class="petit">Si le lien ne s'ouvre pas : Réglages iOS › Calendrier › Comptes › Ajouter › Autre › Abonnement, avec l'adresse <code>${http}programme.ics</code>.</p>` : h`<p class="petit">L'adresse d'abonnement apparaîtra ici quand l'app sera servie depuis GitHub Pages.</p>`}
    <p class="petit">Heures et durées par défaut : 18 h, 90 min en salle, 30 min à la maison, 45 min de course ; modifiables dans Paramètres de Programme.xlsx (<code>heure_voie</code>, <code>duree_voie</code>…). Les alarmes d'un calendrier abonné sont désactivées par défaut sur iPhone : dans le compte de l'abonnement, décoche « Supprimer les alarmes ».</p></div>` };
}

function reglages(ctx) {
  const { doc, data } = ctx, r = doc.reglages, acts = data.listes.Activités || ["Voie", "Bloc", "Maison", "Course"];
  const bascule = (cle, label, aide) => h`<div class="ligne-reg"><span>${label}${aide ? h`<br><span class="petit">${aide}</span>` : ""}</span><button class="bascule ${r[cle] ? "on" : ""}" data-act="reglageBool" data-cle="${cle}" aria-label="${label}"></button></div>`;
  return { titre: h`<b>Réglages</b>`, html: h`${pli("reg-affichage", false, "Affichage", () => h`${bascule("grand", "Grand affichage", "texte et boutons plus grands")}${bascule("ecranAllume", "Écran allumé pendant la séance", "le minuteur le garde allumé de toute façon")}`, { classe: "carte", resume: r.grand ? "grand affichage" : "" })}
    ${pli("reg-repos", false, "Repos par défaut", () => h`<p class="petit">Utilisé quand la ligne n'indique pas de repos.</p>
    ${acts.filter(a => a !== "Repos").map(a => h`<div class="ligne-reg"><span>${a}</span><span class="compteur"><button data-act="reglageRepos" data-a="${a}" data-pas="-30">−</button><span>${mmss((r.repos || {})[a] ?? 0)}</span><button data-act="reglageRepos" data-a="${a}" data-pas="30">+</button></span></div>`)}
    ${bascule("reposAuto", "Repos automatique", "lance le repos dès qu'un passage est noté")}`, { classe: "carte" })}
    ${pli("reg-minuteur", false, "Minuteur", () => h`${bascule("son", "Sons", "quand l'app est à l'écran ; écran verrouillé, une app web ne sonne pas")}
      <label class="champ">Minuteur natif de l'iPhone via un Raccourci <span class="petit">(facultatif)</span></label><input type="text" value="${r.raccourciRepos || ""}" placeholder="Nom du raccourci, ex. Repos" data-act="reglageRaccourci">
      <p class="petit">Crée dans Raccourcis un raccourci nommé ainsi : « Obtenir les nombres dans l'entrée » → « Démarrer le minuteur » (secondes). Un bouton 🔔 iPhone apparaît à côté du repos ; il sonne même écran verrouillé, mais quitte l'app une seconde.</p>`, { classe: "carte", resume: r.son ? "sons" : "sans son" })}
    ${pli("reg-programme", false, "Programme", () => h`<div class="ligne-reg"><span>Date de début<br><span class="petit">un lundi · ${data.dateDebut} dans Programme.xlsx</span></span><input type="date" value="${r.dateDebut || data.dateDebut}" data-act="reglageDate"></div>`, { classe: "carte", resume: court(r.dateDebut || data.dateDebut) })}` };
}

function textesAide(ctx) {
  const S = {
    seance: h`<p><b>Commencer.</b> ▸ Commencer lance la séance : pas de questionnaire. Choisis d'abord la variante si la séance en a (Voie / Remplacement bloc…).</p>
      <p><b>Pendant.</b> La carte « Maintenant » montre l'étape en cours, ses minuteurs, et <b>✓ Fait · suivant</b>, qui coche l'étape et passe à la suivante. Dans le plan, chaque étape a sa case ✓ ; une étape répétée (3× gainage) a des ronds : un rond = un passage. Rien n'est obligatoire : l'app avance d'elle-même vers la prochaine étape pas encore faite. « J'en suis là » (dans une étape dépliée) déplace le repère.</p>
      <p><b>Voies et blocs.</b> « Salle : … › » choisit la salle du jour (ou « Salle inconnue ») ; par défaut, la dernière salle choisie, en voie comme en bloc. « + Noter un passage » : en haut « + Nouvelle voie » et « Sans voie précise » ; dessous, les voies de la salle, filtrées par couleur et cotation (cibles et voies d'aujourd'hui d'abord). Touche une voie : ✓, sec ou ✗ (la cause se choisit dans la liste). Après ✓, « Comment ? » (À vue · Flash · 2ᵉ · 3ᵉ…) donne le style et le nombre d'essais d'un seul choix ; puis la date du premier essai et l'aisance — ou ferme simplement. « Tes cibles » : ★ à essayer et projets, en un appui. « Aujourd'hui » : tes passages regroupés par voie ; touche un résultat pour le corriger, « + encore » pour la même voie.</p>
      <p><b>Consignes.</b> Une ligne « Consignes › » sous le bandeau, avant, pendant et après la séance (« Pas de consigne » s'il n'y en a pas). « Détail de l'étape › » est dans la carte Maintenant.</p>
      <p><b>Voie déjà faite, sans la chercher.</b> Les rangées ✓ / sec / ✗ par cotation : un appui = un passage sur une <b>voie déjà faite</b> (il ne gonfle pas le nombre de voies différentes). Pour une nouvelle voie : « Nouvelle voie » dans le message, ou la case tout en haut de la fenêtre du passage.</p>
      <p><b>Fin.</b> ■ Fin de séance : effort, douleur après, et, si tu n'as rien noté, « en gros » ce que tu as grimpé. Les heures se corrigent sous « Heures, notes ».</p>
      <p><b>Naviguer.</b> Glisse vers la gauche ou la droite pour passer à la séance suivante ou précédente (pas pendant une séance en cours). Ouverte depuis le programme, la flèche « ‹ Programme » t'y ramène.</p>`,
    programme: h`<p><b>Aujourd'hui.</b> L'app s'ouvre ici ; la carte du haut ouvre la séance du jour en un appui (ou la prochaine). Une séance en cours s'ouvre directement.</p>
      <p>Les semaines par bloc ; touche une semaine pour ses jours et ses séances. La semaine en cours montre un encadré <b>À faire</b> (séances à régler, mesures du week-end) et, dès qu'une séance est faite, son bilan.</p>
      <p><b>Outils d'une semaine.</b> 📏 Mesures (ⓘ pour les tests) · ⏸ Faire une pause : repousse la semaine et les suivantes de 1 à 4 semaines, la fenêtre montre les nouvelles dates · Copier · répéter (une semaine commencée n'est jamais écrasée).</p>
      <p><b>Une séance.</b> ⋯ à droite de chaque séance (ou dans l'en-tête d'une séance ouverte) : bilan, modifier le plan (les saisies suivent leur ligne), déplacer, copier vers une autre date, sautée ; une séance que tu as créée ou copiée peut être supprimée.</p>
      <p><b>Passages hors séance</b> (⋯ du Programme) : ce que tu as grimpé sans séance et sans voie de salle connue. Pour une voie d'une salle, passe par sa fiche › Historique.</p>`,
    progres: h`<p>En haut, quelques phrases : la semaine, le niveau acquis, le point faible, le prochain cap. « À ce rythme… » n'apparaît qu'après 4 semaines de programme, quand il y a de quoi estimer.</p>
      <p>Dessous, en sections repliables (l'app retient ce que tu as ouvert) : les projets, les feux verts, le niveau consolidé, à travailler, la charge, les douleurs (et les signalements, pour supprimer une erreur), les mesures. ⓘ explique chaque calcul. Toucher un projet ouvre la fiche de la voie.</p>`,
    salles: h`<p><b>Une salle</b> garde ses voies par secteur, leur couleur, leur niveau et ton historique sur chacune. Façon de coter : comme l'app, ses propres niveaux, par couleurs, ou aucune.</p>
      <p><b>Le mur.</b> En haut, toujours visible : Tout / Voies / Blocs, + Voie, Sélectionner. Les secteurs sont repliés avec un résumé (nombre, couleurs, cotations) ; touche-les pour les ouvrir, l'app s'en souvient. Touche une voie pour sa fiche. + Secteur est dans la barre : il demande combien de secteurs et les crée d'un coup (1, 2, 3… à renommer). L'inclinaison d'un secteur se calcule d'après ses voies. « Inventaire rapide » (⋯) crée d'un coup les voies d'une salle, niveau par niveau. Pour déplacer une voie : ⋮⋮ puis lâche-la sur une voie, un secteur ouvert ou le nom d'un secteur replié. ⋯ : plusieurs voies d'un coup, démontées, modifier la salle. Un secteur rééquipé : ✎ › Renouveler.</p>
      <p><b>Couleurs.</b> 12 couleurs de base ; appui long sur une couleur pour ses nuances.</p>
      <p><b>Inclinaison et caractéristiques.</b> L'inclinaison (dalle, vertical, léger dévers, dévers, surplomb, fort dévers, toit) est un seul choix ; les caractéristiques (arête, traversée, dièdre, fissure, volumes, réglettes, bacs, pinces, plats, dynamique, compression) se cumulent, dans la fiche de la voie. Le mur se filtre par caractéristique ; Progrès › À travailler dit laquelle tu réussis le moins.</p>
      <p><b>Historique d'une voie.</b> Ouvert dans sa fiche : chaque passage avec ✕ pour le supprimer tout de suite. « + Ajouter » : une réussite (date, aisance, essais), ou des échecs sur plusieurs dates d'un coup (une date par essai, « Date inconnue » possible). Sans date, un passage compte dans les niveaux, les projets et les feux verts, pas dans la charge.</p>`,
    principe: h`<p>Le programme est écrit dans <b>Programme.xlsx</b> et transformé en <code>data.js</code> par <code>outil/grimpe.py app</code>. L'app sert à faire les séances : elle ne demande rien pendant, et calcule tout après (feux verts, forme, niveaux, projets). Sur PC, <code>grimpe.py rapport</code> met ce bilan en page dans <b>Suivi.xlsx</b> et reporte dans Programme.xlsx les séances modifiées ici.</p>
      <p><b>Une séance.</b> Voir l'onglet « Séance » de cette aide.</p>
      <p><b>Couleurs.</b> <span class="genre-txt echauffement">échauffement</span> · <span class="genre-txt securite">sécurité</span> · <span class="genre-txt facile">facile</span> · <span class="genre-txt effort">effort</span> · <span class="genre-txt recup">récupération</span>.</p>
      <p><b>Le lendemain.</b> Une séance oubliée ou laissée ouverte revient en une carte en haut du Programme : faite → bilan, sautée, plus tard. Jamais de point d'exclamation.</p>`,
    syntaxe: h`<p>Une ligne par étape. Tout ce qui n'est pas entre accolades est de la prose : rien n'est deviné. Dans l'app, l'éditeur de plan écrit ces lignes pour toi.</p>
      <pre class="code">## Nom de version
> Échauffement voie
! Consigne, sans case à cocher
3× Voie en 5b · « Travail au point » {voie 5b} {repos 4min} {effort}
2× « Gainage » {chrono 30s} {côté}
6× course lente {fractions 2min/2min}
Planche (s) {mesure planche}</pre>
      <table class="tableau"><tr><td>{voie 5b} {bloc 5} {voie}</td><td>étape de grimpe, cotation visée</td></tr><tr><td>{repos 4min}</td><td>repos entre passages</td></tr><tr><td>{chrono 30s}</td><td>bouton chrono</td></tr><tr><td>{fractions 2min/2min}</td><td>course / marche, répété N fois</td></tr><tr><td>{durée 15min}</td><td>durée prévue (sinon estimée)</td></tr><tr><td>{série 4}</td><td>circuit : 4 blocs par passage</td></tr><tr><td>{effort} {facile} {récup} {échauffement}</td><td>couleur de l'étape</td></tr><tr><td>{feu 5c}</td><td>rappel du feu vert</td></tr><tr><td>{côté}</td><td>chrono pour chaque côté</td></tr><tr><td>{mesure planche}</td><td>champ de mesure dans le plan</td></tr></table>
      <p>« Nom d'exercice » entre guillemets français → lien vers sa fiche.</p>`,
    donnees: h`<p><b>Où sont mes données ?</b> Sur ce téléphone, dans un seul document. Avec la sauvegarde GitHub activée, une copie part dans ton dépôt privé après chaque séance ; sinon, exporte de temps en temps. Si tu supprimes l'app sans copie, tout est perdu.</p>
      <p><b>Salles.</b> Une salle garde ses voies par secteur, leur couleur, leur niveau (dans son système à elle : comme l'app, ses propres niveaux, par couleurs, ou aucun) et ton historique dessus. Quand la salle rouvre un secteur, « Renouveler » passe ses voies en démontées sans rien effacer.</p>
      <p><b>Modifier le programme.</b> ⋯ › Modifier le plan, Déplacer, ou + Séance dans Programme. Chaque modification est une opération datée ; l'outil PC la reporte dans Programme.xlsx au prochain rapport.</p>
      <p><b>Annuler.</b> ⋯ en haut, sur chaque écran : les 30 derniers gestes. Une suppression propose aussi « Annuler » quelques secondes.</p>`,
  };
  return S;
}
const SECTIONS_AIDE = [["seance", "Séance"], ["programme", "Programme"], ["progres", "Progrès"], ["salles", "Salles"], ["principe", "Principe"], ["syntaxe", "Syntaxe"], ["donnees", "Données"]];
// Aide : comme la Bibliothèque — une recherche, puis des sections repliables ; le « ? » d'un écran met sa section en tête, ouverte
function aide(ctx) {
  const r = ctx.state.filtre.aideRecherche || "";
  return { titre: h`<b>Aide</b>`, html: h`<input type="search" class="recherche" placeholder="Rechercher dans l'aide…" value="${r}" data-frappe="aideRecherche" aria-label="Rechercher"><div id="aide-liste">${listeAide(ctx, r)}</div>` };
}
function listeAide(ctx, recherche) {
  const S = textesAide(ctx), q = sansAccent(recherche).trim(), k = ctx.state.filtre.aide;
  if (q) { const res = SECTIONS_AIDE.map(([c, l]) => [l, (String(S[c]).match(/<(p|li)>[\s\S]*?<\/\1>/g) || []).filter(x => sansAccent(x.replace(/<[^>]+>/g, "")).includes(q))]).filter(([, l]) => l.length);
    return res.length ? res.map(([l, ps]) => h`<div class="carte aide"><h2>${l}</h2>${brut(ps.join(""))}</div>`) : h`<p class="petit">Rien pour « ${recherche} ».</p>`; }
  const ordre = k ? [...SECTIONS_AIDE.filter(x => x[0] === k), ...SECTIONS_AIDE.filter(x => x[0] !== k)] : SECTIONS_AIDE;
  return ordre.map(([c, l]) => pli(`aide-${c}`, false, l, () => h`<div class="aide">${S[c]}</div>`, { classe: "carte" }));
}

// Relit les champs tels qu'affichés (au cas où une frappe n'aurait pas encore été enregistrée) et les enregistre
function relireChamps(ctx) {
  const champs = [...document.querySelectorAll("[data-frappe=syncChamp]")].reduce((o, el) => ({ ...o, [el.dataset.cle]: el.value.trim() }), {});
  if (Object.keys(champs).length) ctx.modifier("réglage sync", x => { x.reglages.sync = { ...(x.reglages.sync || {}), ...champs }; }, { annulable: false });
  const j = document.querySelector("[data-frappe=syncJeton]"); if (j) ecrireJeton(j.value.replace(/\s+/g, ""));
}
const manqueSync = ctx => { const c = ctx.doc.reglages.sync || {}; return !c.owner ? "Indique ton pseudo GitHub (propriétaire)." : !c.repo ? "Indique le nom du dépôt." : !c.chemin ? "Indique le chemin du fichier." : !lireJeton() ? "Colle le jeton (github_pat_…)." : ""; };
const cotationVide = () => ({ Voie: { mode: "standard", liste: [] }, Bloc: { mode: "standard", liste: [] } });
export const actions = {
  ouvrirVue: (ctx, d) => ctx.ouvrir(d.vue),
  ouvrirAide: (ctx, d) => { ctx.state.filtre.aide = d.k; forcerOuvert(`aide-${d.k}`); if (ctx.state.vue !== "aide") ctx.ouvrir("aide"); else ctx.rendre(); },
  aideRecherche: (ctx, d, el) => { ctx.state.filtre.aideRecherche = el.value; const z = document.getElementById("aide-liste"); if (z) z.innerHTML = String(listeAide(ctx, el.value)); },
  exporter: async ctx => { const ex = construireExport({ data: ctx.data, doc: ctx.doc, programme: ctx.programme, bilan: ctx.bilan });
    if (await partager(ex, nomFichier(ctx.aujourdhui()))) { ctx.modifier("export", d => { d.dernierExport = new Date().toISOString(); }, { annulable: false }); ctx.toast("Export partagé"); } ctx.rendre(); },
  copierDonnees: async ctx => { const ex = construireExport({ data: ctx.data, doc: ctx.doc, programme: ctx.programme, bilan: ctx.bilan });
    if (await copierTexte(ex)) { ctx.modifier("export", d => { d.dernierExport = new Date().toISOString(); }, { annulable: false }); ctx.toast(`Données copiées (${tailleKo(ex)} ko) : colle-les dans Notes ou un mail`); }
    else ctx.toast("La copie n'a pas marché : utilise « Exporter le fichier »"); ctx.rendre(); },
  copierOuExporter: ctx => { forcerOuvert("sv-fichier"); ctx.ouvrir("sauvegarde"); },
  collerOuvrir: ctx => ctx.ouvrirModal({ type: "coller", texte: "" }),
  importFichier: async (ctx, d, el) => { const f = el.files && el.files[0]; if (!f) return;
    try { const obj = await lireFichier(f), v = verifierImport(obj, ctx.data); ctx.ouvrirModal({ type: "import", ...v, source: "fichier" }); } catch (e) { alert(e.message); } el.value = ""; },
  reinitTout: ctx => { if (!confirm("Effacer TOUTES les données de l'app sur ce téléphone ?") || !confirm("Vraiment ? As-tu une sauvegarde ?")) return; ctx.store.reinitialiser(); ctx.state.seanceId = null; ctx.ouvrir("seance"); },
  // Ces champs s'enregistrent à chaque frappe et ne redessinent jamais l'écran (sinon le champ suivant disparaît sous le doigt)
  syncChamp: (ctx, d, el) => { ctx.modifier("réglage sync", x => { x.reglages.sync = { ...(x.reglages.sync || {}), [d.cle]: el.value.trim() }; }, { annulable: false }); },
  syncJeton: (ctx, d, el) => { ecrireJeton(el.value.replace(/\s+/g, "")); },
  syncAuto: ctx => { ctx.modifier("réglage sync", x => { x.reglages.sync = { ...(x.reglages.sync || {}), auto: x.reglages.sync.auto === false }; }, { annulable: false }); ctx.rendre(); },
  syncPousser: async ctx => { relireChamps(ctx); const manque = manqueSync(ctx); if (manque) { ctx.toast(manque); return; } ctx.toast("Envoi vers GitHub…"); await ctx.synchroniser("manuel", true); ctx.rendre(); },
  syncRecuperer: async ctx => { relireChamps(ctx); const manque = manqueSync(ctx); if (manque) { ctx.toast(manque); return; } try { const s = creerSync({ config: ctx.doc.reglages.sync, jeton: lireJeton() }), lu = await s.lire(); if (!lu) return ctx.toast("Rien sur GitHub pour l'instant.");
      const v = verifierImport(lu.contenu, ctx.data); ctx.ouvrirModal({ type: "import", ...v, source: "GitHub" }); } catch (e) { alert(e.message); } },
  filtreCat: (ctx, d) => { ctx.state.filtre.cat = d.valeur; ctx.rendre(); },
  // Recherche : seule la liste est redessinée, le champ garde le clavier
  biblioRecherche: (ctx, d, el) => { ctx.state.filtre.biblio = el.value; const z = document.getElementById("biblio-liste"); if (z) z.innerHTML = String(listeBiblio(ctx, el.value)); },
  filtreDemontees: ctx => { ctx.state.filtre.demontees = !ctx.state.filtre.demontees; ctx.rendre(); },
  salleOuvrir: (ctx, d) => ctx.ouvrir("salle", { salleId: d.id }),
  salleNouvelle: ctx => ctx.ouvrirModal({ type: "salle", nom: "", typeSalle: "Bloc et voie", cotation: cotationVide(), noms: [] }),
  salleEditer: (ctx, d) => { const s = ctx.doc.salles.find(x => x.id === ((d && d.id) || ctx.state.salleId)); ctx.ouvrirModal({ type: "salle", id: s.id, nom: s.nom, typeSalle: s.type, cotation: JSON.parse(JSON.stringify(s.cotation || cotationVide())) }); },
  passageAncienOuvrir: ctx => ctx.ouvrirModal({ type: "passageAncien", date: ctx.aujourdhui(), dateInconnue: false, disc: "Voie", cot: "", chiffre: "", profil: "Vertical", res: "", n: 1, couleur: "", nom: "", salle: "" }),
  passageAncienSuppr: (ctx, d) => { ctx.modifier("passage hors séance supprimé", x => { x.passagesAnciens = x.passagesAnciens.filter(p => p.id !== d.id); }); ctx.toast("Passage supprimé", () => ctx.store.annuler()); ctx.rendre(); },
  reglageBool: (ctx, d) => { ctx.modifier("réglage", x => { x.reglages[d.cle] = !x.reglages[d.cle]; }, { annulable: false }); if (d.cle === "son") ctx.minuteur.configurer({ son: ctx.doc.reglages.son }); if (d.cle === "grand") document.documentElement.classList.toggle("grand", ctx.doc.reglages.grand); ctx.rendre(); },
  reglageRepos: (ctx, d) => { ctx.modifier("réglage", x => { x.reglages.repos = x.reglages.repos || {}; x.reglages.repos[d.a] = Math.max(0, (x.reglages.repos[d.a] ?? 0) + +d.pas); }, { annulable: false }); ctx.rendre(); },
  reglageRaccourci: (ctx, d, el) => { ctx.modifier("réglage", x => { x.reglages.raccourciRepos = el.value.trim(); }, { annulable: false }); },
  reglageDate: (ctx, d, el) => { if (!el.value) return; ctx.modifier("date de début", x => { x.reglages.dateDebut = el.value === ctx.data.dateDebut ? "" : el.value; }); ctx.toast("Date de début modifiée"); ctx.rendre(); },
};
