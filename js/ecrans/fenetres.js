// ecrans/fenetres.js — les fenêtres du bas. L'état de la fenêtre est ctx.state.modal (M) ; les champs « data-champ » l'écrivent à la frappe.
import { h, si, choix, echelle, brut, ico, pictoProfil as dessinProfil, ligneChoix, forcerOuvert, info, liste, listeMulti, lier } from "../html.js";
import { COULEUR_ROUTINES, GENRES_ROUTINE, etiquetteNiveau, couleurCategorie, FAMILLES, NOMS_FAMILLES } from "./plus.js";
import { ficheDe } from "../bibliotheque.js";
import { INFOS } from "../infos.js";
import { discipline, etapesSeance, nouvelId, idsAPauser, opsCopieSeance, opsCopieSemaine, activiteAffichee, nomSeance } from "../programme.js";
import { RES_LABEL, resLabel, choixResultat, refPassage, ajouterTentative, cleRattachement, fenetreNoter, actions as ACTIONS_SEANCE } from "./seance.js";
import { court, semaineDe, nomJour, ajouterJours, mmss, duree as dureeTexte } from "../dates.js";
import { verifierImport, lireTexte } from "../export.js";
import { cotesSalleProches, salleDe, couleursDe, hexDe, texteSur, cotationDe, cotApp, nouvelleVoie, voieExistante, tentativeDe, libelleVoie, secteurDe, renouveler, profilHabituel, inclinaisonSecteur, categorieInclinaison, FONDS_SALLE, fondSalle, ranger, PALETTE, CARACTERISTIQUES, salleParDefautPour, retenirSalle, sallesPour, passagesDe, supprimerVoies, dupliquerVoie, deplacerVoieSalle, deplacerSecteur, supprimerSecteur, supprimerSalle, renommerCouleur, supprimerCouleur, voiesDeCouleur, cotSalleDe, deuxCot } from "../salles.js";
import { parVoie, tentatives as toutesTentatives, causePrincipale, essaisPrecedents, essaisAvantReussite, dejaReussie, AISANCES } from "../analyse.js";
import * as editeur from "./editeur.js";

export const PROFILS = ["Dalle", "Vertical", "Léger dévers", "Dévers", "Surplomb", "Fort dévers", "Toit"];      // l'inclinaison ; arête, traversée… sont des caractéristiques
const STYLES = ["À vue", "Flash", "Après travail"];
const CAUSES = ["Lecture", "Pieds", "Placement ou gainage", "Force", "Endurance", "Peur"];
const MESURES = [["planche", "Planche (s)"], ["course", "Course continue (min)"], ["tractions", "Tractions"], ["genou", "Genou contre le mur (cm)"], ["squat", "Squat profond (s)"], ["notes", "Notes"]];
export const choixProfil = (act, actuel) => h`<div class="choix profils">${PROFILS.map(p => h`<button data-act="${act}" data-valeur="${p}" class="${actuel === p ? "choisi" : ""}">${dessinProfil(p)}${p}</button>`)}</div>`;
// Palette : 12 couleurs de base (+ couleurs propres de la salle) ; appui long sur une base → ses nuances (voir app.js, « nuancier »)
export const pastilles = (ctx, act, actuel, salle, data = {}) => { const attrs = brut(Object.entries(data).map(([k, v]) => `data-${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" "));
  return h`<div class="pastilles">${PALETTE.map(b => { const n = b.nuances.find(x => x[0] === actuel), hex = n ? n[1] : b.hex;
      return h`<button data-act="${act}" data-valeur="${n ? n[0] : b.nom}" ${attrs} data-base="${b.nom}" class="pastille ${n ? "choisi" : ""} ${b.nuances.length > 1 ? "a-nuances" : ""}" style="background:${hex}" aria-label="${n ? n[0] : b.nom}" title="${n ? n[0] : b.nom}"></button>`; })}
    ${((salle && salle.couleurs) || []).map(c => h`<button data-act="${act}" data-valeur="${c.nom}" ${attrs} class="pastille ${actuel === c.nom ? "choisi" : ""}" style="background:${c.hex}" aria-label="${c.nom}" title="${c.nom}"></button>`)}</div>
    ${actuel ? h`<p class="petit nom-couleur">${actuel}</p>` : h`<p class="petit nom-couleur">Appui long sur une couleur : ses nuances.</p>`}`; };
const actionsBas = (ok = "Enregistrer", actOk = "mOk", desactive = false) => h`<div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="${actOk}" ${desactive ? "disabled" : ""}>${ok}</button></div>`;
// Sélecteur de cotation : chiffre puis lettre ; un deuxième appui efface
export function selecteurCot(ctx, disc, actuel, champ = "cot") {
  const liste = ctx.data.echelles[disc] || [], M = ctx.state.modal, chiffre = M.chiffre || (actuel ? actuel[0] : "");
  const chiffres = [...new Set(liste.map(c => c[0]))];
  return h`<div class="choix compact">${chiffres.map(c => h`<button data-act="mChiffre" data-valeur="${c}" data-champ="${champ}" class="${chiffre === c ? "choisi" : ""}">${c}</button>`)}</div>
    ${si(chiffre, h`<div class="choix compact">${liste.filter(c => c[0] === chiffre).map(c => h`<button data-act="mCot" data-valeur="${c}" data-champ="${champ}" class="${actuel === c ? "choisi" : ""}">${c}</button>`)}</div>`)}`;
}
// « Noter un passage » sans voie précise : l'échelle de la salle du jour si elle a la sienne (avec l'équivalent app), sinon l'échelle officielle
function cotationResultat(ctx, M, disc) {
  const salle = salleDe(ctx.doc, M.salleEch || M.salle), c = cotationDe(salle, disc), propre = salle && c.mode === "liste" && c.liste.length && !M.officielle;
  const choisi = M.cot || M.cotSalle ? h`<p class="petit">Cotation : <b>${deuxCot(salle, disc, M.cotSalle, M.cot)}</b> · <button class="lien" data-act="mCotSalle" data-valeur="">sans cotation</button></p>` : "";
  if (propre) return h`<label class="champ">Cotation (${salle.nom}) <span class="petit">· ≈ échelle de l'app · facultatif</span></label>${choix("mCotSalle", c.liste.map(x => [x.salle, x.app ? `${x.salle} · ≈ ${x.app}` : String(x.salle)]), M.cotSalle, { classe: "compact" })}${choisi}
    <button class="lien" data-act="mBool" data-k="officielle">Plutôt l'échelle officielle ›</button>`;
  return h`<label class="champ">Cotation <span class="petit">(facultatif)</span></label>${selecteurCot(ctx, disc, M.cot)}${choisi}${salle && c.mode === "liste" && c.liste.length ? h`<button class="lien" data-act="mBool" data-k="officielle">‹ L'échelle de ${salle.nom}</button>` : ""}`;
}
// Cotation selon la façon de coter de la salle
function cotationSalle(ctx, salle, disc, M) {
  const c = cotationDe(salle, disc);
  // « Niveau inconnu » partout : la voie s'enregistre quand même (« ? »), on complète plus tard depuis sa fiche
  const inconnu = h`<button class="lien ${!M.cotSalle ? "choisi-lien" : ""}" data-act="mCot" data-valeur="" data-champ="cotSalle">${!M.cotSalle ? "✓ " : ""}Niveau inconnu</button>`;
  if (c.mode === "standard") return h`<label class="champ">Cotation</label>${selecteurCot(ctx, disc, M.cotSalle, "cotSalle")}${inconnu}`;
  if (c.mode === "liste") return h`<label class="champ">Niveau (${salle.nom}) <span class="petit">· ≈ échelle de l'app</span></label>${choix("mChamp", c.liste.map(x => [x.salle, x.app ? `${x.salle} · ≈ ${x.app}` : String(x.salle)]), M.cotSalle, { data: { champ: "cotSalle" }, classe: "compact" })}${inconnu}`;
  if (c.mode === "couleurs") return h`<p class="petit">Dans cette salle, la couleur donne le niveau${M.couleur ? ` : ${M.couleur} ${cotApp(salle, disc, "", M.couleur) ? "≈ " + cotApp(salle, disc, "", M.couleur) : "(équivalent inconnu)"}` : ""}.</p>`;
  return h`<p class="petit">Salle sans cotation.</p>`;
}

// Après une réussite : « Comment ? » réunit le style et le nombre d'essais (À vue · Flash = 1er essai ; 2ᵉ… = après travail),
// puis la date du premier essai (dès le 2ᵉ) et l'aisance. Si les échecs sont notés, l'essai est présélectionné.
const COMMENT = [["avue", "À vue"], ["flash", "Flash"], ["2", "2ᵉ"], ["3", "3ᵉ"], ["4", "4ᵉ"], ["5+", "5ᵉ+"], ["inconnu", "Inconnu"]];
// La valeur « Comment ? » d'un passage : choisie, sinon déduite de ce qui est déjà noté (style, essais) ou de l'historique
export const commentDe = (m, calc = 0) => m.comment !== undefined && m.comment !== null ? m.comment
  : m.style === "À vue" && (!m.essaisAvant || m.essaisAvant === "1") && m.essaisAvant ? "avue" : m.style === "Flash" ? "flash"
  : m.essaisAvant && m.essaisAvant !== "1" ? m.essaisAvant : calc ? (calc + 1 >= 5 ? "5+" : String(calc + 1)) : "";
function champsReussite(ctx, M) {
  const ref = M.refTentative || (M.date ? { date: M.date, t: Date.now() } : null), tous = M.voieId ? toutesTentatives(ctx.programme, ctx.doc) : [];
  const calc = M.voieId ? essaisPrecedents(tous, M.voieId, ref) : 0, deja = M.voieId ? dejaReussie(tous, M.voieId, ref) : null;
  const aisance = h`<label class="champ">Aisance</label>${choix("mBascVal", Object.entries(AISANCES), M.aisance || "", { data: { champ: "aisance" } })}`;
  if (deja !== null) return h`<p class="petit">Déjà réussie ${deja ? "le " + court(deja) : "avant"} : c'est une répétition.</p>${aisance}`;
  const c = commentDe(M, calc), deduit = M.comment === undefined && calc && c;
  return h`<label class="champ">Comment ? ${deduit ? h`<span class="petit">· ${c}ᵉ essai d'après tes passages</span>` : ""}</label>${choix("mBascVal", COMMENT, c, { data: { champ: "comment" }, classe: "compact" })}
    <p class="petit">À vue : 1er essai sans rien savoir · Flash : 1er essai avec des infos · 2ᵉ et plus : après travail.</p>
    ${si(c && !["avue", "flash", "inconnu"].includes(c), () => ligneChoix(M, "premier", "Premier essai le", M.premierEssai === "inconnue" ? "date inconnue" : M.premierEssai ? court(M.premierEssai) : "facultatif", () => h`<div class="ed-rangee"><input type="date" data-champ="premierEssai" value="${M.premierEssai && M.premierEssai !== "inconnue" ? M.premierEssai : ""}"><button data-act="mBascVal" data-champ="premierEssai" data-valeur="inconnue" class="${M.premierEssai === "inconnue" ? "choisi" : ""}">Date inconnue</button></div>`))}
    ${aisance}`;
}
// Ce qu'on enregistre : style et essais viennent de « Comment ? » (calculé si non touché)
const champsTentative = (m, ctx) => {
  const ref = m.refTentative || (m.date ? { date: m.date, t: Date.now() } : null), tous = ctx && m.voieId ? toutesTentatives(ctx.programme, ctx.doc) : [];
  if (m.voieId && dejaReussie(tous, m.voieId, ref) !== null) return { aisance: m.aisance || undefined };          // répétition : seulement l'aisance
  const c = commentDe(m, m.voieId ? essaisPrecedents(tous, m.voieId, ref) : 0);
  const style = c === "avue" ? "À vue" : c === "flash" ? "Flash" : c && c !== "inconnu" ? "Après travail" : m.style || undefined;
  const essaisAvant = c === "avue" || c === "flash" ? "1" : c || undefined;
  return { aisance: m.aisance || undefined, style, essaisAvant, premierEssai: essaisAvant && !["1", "inconnu"].includes(essaisAvant) ? m.premierEssai || undefined : undefined }; };

const reussiT = t => t.res === "ok";
// Champs toujours en texte, même s'ils ressemblent à un nombre (niveaux de salle, cotations, identifiants)
// La forme du jour notée au bilan (mêmes valeurs que les boutons du début de séance)
const RECUP_FORME = { bien: { doigts: 5, coudes: 5, epaules: 5, energie: 5, motivation: 5 }, moyen: { doigts: 3, coudes: 3, epaules: 3, energie: 4, motivation: 4 }, pastop: { doigts: 2, coudes: 2, epaules: 2, energie: 2, motivation: 2 } };
const TEXTE = new Set(["forme", "gDisc", "cotSalle", "cot", "salle", "salleCible", "nom", "zone", "raison", "cause", "style", "essaisAvant", "comment", "fond", "typeSalle", "disc", "res"]);
// Séance de grimpe en cours de cette discipline (pour « Noter un passage maintenant » depuis la fiche d'une voie)
const seanceEnCoursPour = (ctx, disc) => ctx.programme.find(s => { const sa = ctx.doc.seances[s.id]; return sa && sa.debut && !sa.fin && discipline(s, sa) === disc; });

// Niveaux proposés pour l'inventaire : ceux de la salle (liste, couleurs), sinon les cotations de base de l'app de 4a à 7a (voie) ou de 3 à 7A (bloc)
function niveauxSalle(sl, disc) { const c = cotationDe(sl, disc);
  if (c.mode === "couleurs") return c.liste.map(x => x.salle);
  if (c.mode === "liste") return [...c.liste.map(x => x.salle), ""];                 // "" : niveau inconnu
  if (c.mode === "aucune") return [""];
  return [...(disc === "Voie" ? ["4a", "4b", "4c", "5a", "5b", "5c", "6a", "6b", "6c", "7a"] : ["3", "4", "5", "6A", "6B", "6C", "7A"]), ""]; }

// --- Plusieurs secteurs d'un coup : un nombre, puis un nom par secteur (1, 2, 3… par défaut, à adapter) ---
const champsSecteurs = (M, min = 1) => h`<div class="ligne-reg"><span>Nombre de secteurs</span><span class="compteur"><button data-act="mNbSecteurs" data-pas="-1" ${M.noms.length <= min ? "disabled" : ""}>−</button><span>${M.noms.length}</span><button data-act="mNbSecteurs" data-pas="1">+</button></span></div>
  ${si(M.noms.length, () => h`<p class="petit">Les noms se changent ici (ou plus tard, ✎ sur le secteur). Inclinaison : Vertical par défaut, puis celle de ses voies.</p><div class="noms-secteurs">${M.noms.map((n, i) => h`<input type="text" value="${n}" data-frappe="mNomSecteur" data-i="${i}" aria-label="Nom du secteur ${i + 1}">`)}</div>`)}`;
const nomsSecteurs = (noms, n, depart) => Array.from({ length: n }, (_, i) => noms[i] !== undefined ? noms[i] : String(depart + i));

// --- Façon de coter d'une salle ---
const FORMES = disc => [["standard", disc === "Voie" ? "Cotation française (4a, 5b, 6a+…)" : "Fontainebleau (4, 5+, 6A…)"], ["chiffres", "Chiffres (1, 2, 3…)"], ["lettres", "Lettres (A, B, C…)"],
  ["mixte", "Chiffres et lettres (4a, 4b, 4c…)"], ["couleurs", "Couleurs : la couleur est le niveau"], ["libre", "Autres : je les tape"], ["aucune", "Pas de niveaux"]];
const formeDe = c => c.mode === "liste" ? c.forme || "libre" : c.mode;
// Les niveaux créés d'après la forme et le nombre ; les équivalents déjà choisis sont gardés par position, les autres pré-remplis
function niveauxGeneres(forme, n, depart, ancienne, disc, echelles) {
  const noms = Array.from({ length: n }, (_, i) => forme === "chiffres" ? String(i + 1) : forme === "lettres" ? String.fromCharCode(65 + (i % 26)) + (i >= 26 ? "" + Math.floor(i / 26) : "")
    : `${depart + Math.floor(i / 3)}${"abc"[i % 3]}`);
  const l = noms.map((nom, i) => ({ salle: nom, app: (ancienne[i] && !ancienne[i].auto && ancienne[i].app) || "" }));
  return preRemplir(l, disc, echelles);
}
// Équivalent proposé : les niveaux répartis régulièrement de 4a à 7a (voie) ou de 3 à 7A (bloc) ; seulement là où rien n'est choisi
function preRemplir(l, disc, echelles) {
  const e = echelles[disc] || [], lo = Math.max(0, e.indexOf(disc === "Voie" ? "4a" : "3")), hi = Math.max(lo, e.indexOf(disc === "Voie" ? "7a" : "7A"));
  l.forEach((x, i) => { if (x.app && !x.auto) return; x.app = e[Math.round(lo + (hi - lo) * (l.length > 1 ? i / (l.length - 1) : 0))] || ""; x.auto = true; });     // « auto » : proposé, pas encore choisi
  return l;
}

export function rendre(ctx) {
  const M = ctx.state.modal, { data, doc } = ctx; if (!M) return "";
  const s = M.seanceId ? ctx.seance(M.seanceId) : null, sa = s ? ctx.saisie(s.id) : {};
  switch (M.type) {
    case "externe": return M.rendu(ctx);                // fenêtre d'un module chargé à la demande (assistant) : il fournit son rendu
    case "pasTop": return h`<h2>Qu'est-ce qui ne va pas ?</h2><p class="petit">Plusieurs réponses possibles.</p>
      <div class="choix">${[["doigts", "Doigts"], ["coudes", "Coudes"], ["epaules", "Épaules"], ["energie", "Énergie"], ["motivation", "Motivation"]].map(([k, l]) => h`<button data-act="mBascule" data-k="${k}" class="${M.quoi.includes(k) ? "choisi" : ""}">${l}</button>`)}</div>
      <label class="champ">Une douleur maintenant ? (0 = non)</label>${echelle("mChamp", 10, M.niveau, { de: 0, data: { champ: "niveau" } })}
      ${si(M.niveau > 0, () => liste("zone", data.zones.filter(z => z !== "Aucune"), M.zone, { label: "Zone", vide: "Choisir…" }))}
      ${actionsBas("C'est noté", "pasTopOk")}`;

    case "voieRapide": { const salle = salleDe(doc, M.salleId), v = salle.voies.find(x => x.id === M.voieId), hv = parVoie(toutesTentatives(ctx.programme, doc)).find(x => x.voieId === v.id), hex = hexDe(doc, v.couleur, salle);
      return h`<h2><span class="pastille" style="background:${hex}"></span> ${libelleVoie(v)}</h2><p class="petit">${v.profil ? v.profil + " · " : ""}${secteurDe(salle, v) ? secteurDe(salle, v).nom + " · " : ""}${hv ? `${hv.essais} essai${hv.essais > 1 ? "s" : ""}, ${hv.reussies} réussi${hv.reussies > 1 ? "s" : ""}${causePrincipale(hv) ? `, surtout « ${causePrincipale(hv).toLowerCase()} »` : ""}, dernier le ${court(hv.derniere)}` : "jamais tentée"}</p>
      ${!M.res ? h`<div class="rapide-btns"><button class="ok" data-act="voieRapideRes" data-res="ok">✓ ${M.disc === "Bloc" ? "Réussi" : "Enchaînée"}</button>${si(M.disc === "Voie", h`<button class="sec" data-act="voieRapideRes" data-res="sec">Avec sec</button>`)}<button class="ko" data-act="voieRapideRes" data-res="ko">✗ Échec</button></div>`
        : M.res === "sec" ? h`<label class="champ">Combien de « sec » ?</label><div class="choix echelle">${[1, 2, 3, 4, 5, 6].map(n => h`<button data-act="voieRapideOk" data-sec="${n}">${n}</button>`)}</div>`
        : h`<label class="champ">Pourquoi ? <span class="petit">(le choix enregistre)</span></label><select class="liste" data-act="voieRapideCause"><option value="">Choisir la cause…</option>${CAUSES.map(c => h`<option value="${c}">${c}</option>`)}</select>
          <div class="actions"><button data-act="voieRapideOk" data-cause="">Enregistrer sans cause</button></div>`}
      <div class="fiche-actions"><button data-act="etoileFenetre" data-id="${v.id}" data-salle="${salle.id}">${v.etoile ? "★ À essayer" : "☆ À essayer"}</button><button data-act="voieEditerDepuis" data-id="${v.id}">${ico("crayon")} Modifier la voie</button></div>
      <div class="actions"><button data-act="mFermer">Annuler</button></div>`; }

    case "noter": return fenetreNoter(ctx, M);

    case "apresReussite": return h`<h2>✓ ${M.libelle}</h2><p class="petit">C'est noté. Tu peux préciser, ou fermer.</p>${champsReussite(ctx, M)}
      <div class="actions"><button class="principal" data-act="apresReussiteOk">Fermer</button></div>`;

    case "choixSalle": { const l = sallesPour(doc, M.disc), sa0 = ctx.saisie(M.seanceId), actuelle = (sa0.salle !== undefined ? sa0.salle : salleParDefautPour(doc, M.disc)) || "";
      return h`<h2>Salle du jour</h2><div class="menu">${l.map(x => h`<button class="${actuelle === x.id ? "choisi" : ""}" data-act="salleDuJour" data-id="${x.id}">${x.nom} <span class="petit">· ${x.voies.filter(v => v.statut !== "demontee" && v.disc === M.disc).length} ${M.disc === "Bloc" ? "blocs" : "voies"}</span></button>`)}
        <button class="${!actuelle ? "choisi" : ""}" data-act="salleDuJour" data-id="">Salle inconnue <span class="petit">· on note par cotation</span></button><button data-act="salleDuJourNouvelle">+ Nouvelle salle…</button></div>
        <div class="actions"><button data-act="mFermer">Fermer</button></div>`; }

    case "nouvelleVoie": { const salle = salleDe(doc, M.salleId), c = cotationDe(salle, M.disc);
      const apercu = { disc: M.disc, couleur: M.couleur, cotSalle: M.cotSalle, cot: cotApp(salle, M.disc, M.cotSalle, M.couleur), nom: M.nom }, existe = voieExistante(salle, apercu), pret = true;            // même sans niveau ni couleur : elle s'affiche « ? »
      return h`<h2>${M.disc === "Bloc" ? "Nouveau bloc" : "Nouvelle voie"} · ${salle.nom}</h2>
      <label class="champ">Couleur des prises</label>${pastilles(ctx, "mCouleur", M.couleur, salle)}
      ${cotationSalle(ctx, salle, M.disc, M)}
      ${si(salle.secteurs.length, () => liste("secteurId", salle.secteurs.map(x => [x.id, x.nom]), M.secteurId, { label: "Secteur", vide: "Sans secteur", act: "mSecteurListe" }))}
      ${ligneChoix(M, "profil", "Inclinaison", M.profil || profilHabituel(salle, M.secteurId), () => choixProfil("mProfil", M.profil || profilHabituel(salle, M.secteurId)))}
      ${ligneChoix(M, "carac", "Caractéristiques", (M.carac || []).join(", ") || "facultatif", () => listeMulti("carac", CARACTERISTIQUES, M.carac))}
      ${ligneChoix(M, "nom", "Nom ou repère", M.nom || "facultatif", () => h`<input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`)}
      ${si(existe, () => h`<p class="avert">Une voie identique existe déjà (${libelleVoie(existe)}) : elle sera utilisée.</p>`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button data-act="nouvelleVoieOk" data-res="" ${pret ? "" : "disabled"}>Créer</button><button class="principal" data-act="nouvelleVoieOk" data-res="ok" ${pret ? "" : "disabled"}>Créer et ✓</button><button class="principal" data-act="nouvelleVoieOk" data-res="ko" ${pret ? "" : "disabled"}>Créer et ✗</button></div>`; }

    case "resultat": { const disc = M.disc;
      const deSalle = M.voieId && salleDe(doc, M.salle);
      return h`<h2>${M.edit !== undefined ? "Corriger le passage" : "Noter un passage"}</h2>
      ${si(!deSalle && !M.couleur && !M.nom, () => h`<button class="ligne-nouvelle ${M.nouvelle ? "choisi" : ""}" data-act="mBool" data-k="nouvelle">${M.nouvelle ? "☑" : "☐"} Nouvelle voie <span class="petit">(sinon : une voie déjà faite)</span></button>`)}
      ${deSalle ? h`<p><span class="pastille" style="background:${hexDe(doc, M.couleur, deSalle)}"></span> <b>${libelleVoie(M)}</b> <span class="petit">· ${deSalle.nom} (pour changer la voie elle-même : « Modifier la voie »)</span></p>`
        : h`${cotationResultat(ctx, M, disc)}
      ${ligneChoix(M, "profil", "Inclinaison", M.profil, () => choixProfil("mProfil", M.profil))}`}
      <label class="champ">Résultat</label>${choix("mChamp", choixResultat(disc), M.res, { data: { champ: "res" } })}
      ${si(M.res === "sec", () => h`<label class="champ">Nombre de « sec »</label>${echelle("mChamp", 6, M.sec, { data: { champ: "sec" } })}`)}
      ${si(M.res === "ko", () => liste("cause", CAUSES, M.cause, { label: "Cause de l'échec", vide: "facultative" }))}
      ${si(M.res === "ok", () => champsReussite(ctx, M))}
      ${si(!deSalle, () => ligneChoix(M, "plus", "Couleur, nom", [M.couleur, M.nom].filter(Boolean).join(" · ") || "facultatif", () => h`${pastilles(ctx, "mCouleur", M.couleur, salleDe(doc, M.salle))}<label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`))}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="resultatOk" ${M.res ? "" : "disabled"}>Enregistrer</button></div>
      ${si(M.edit !== undefined, h`<div class="zone-danger"><button class="danger" data-act="resultatSupprimer">Supprimer ce passage</button></div>`)}`; }

    case "douleur": return h`<h2>Douleur pendant la séance</h2>${liste("zone", data.zones.filter(z => z !== "Aucune"), M.zone, { label: "Zone", vide: "Choisir…" })}
      <label class="champ">Niveau</label>${echelle("mChamp", 10, M.niveau, { data: { champ: "niveau" } })}
      <p class="petit">≥ 4 : allège la fin de séance. ≥ 6 : arrête de grimper aujourd'hui.</p>${actionsBas("Noter", "douleurOk", !M.zone)}`;

    case "sauter": return h`<h2>Séance sautée</h2>${liste("raison", ["Fatigue", "Douleur", "Pas de partenaire", "Pas le temps", "Autre"], M.raison, { label: "Raison", vide: "facultative" })}${actionsBas("Marquer sautée", "sauterOk")}`;

    case "bilan": { const disc = M.disc, estGrimpe = ["Voie", "Bloc"].includes(disc), precises = (sa.tentatives || []).filter(t => !t.approx).length;
      // La grille : la discipline de la séance, ou l'autre (salle avec voies et blocs) ; cotations au format de la salle (« 4 · ≈ 5+ »)
      const salleB = salleDe(doc, sa.salle !== undefined ? sa.salle : salleParDefautPour(doc, disc)), mixteB = !!salleB && salleB.type === "Bloc et voie", gd = mixteB ? M.gDisc || disc : disc, cl = cotationDe(salleB, gd), ech = data.echelles[gd] || [];
      const cots = salleB && cl.mode === "liste" && cl.liste.length ? [...new Set(cl.liste.filter(x => x.app).map(x => String(x.app)))].sort((a, b) => ech.indexOf(a) - ech.indexOf(b)) : ech;      // salle à liste : ses cotations
      const cle = (c, r) => `${c}|${r}|${gd}`, deGd = k => (k.split("|")[2] || disc) === gd;
      const presentes = [...new Set([...etapesSeance(s, sa).filter(e => e.grimpe && e.grimpe.cot && e.grimpe.disc === gd).flatMap(e => cotesSalleProches(salleB, gd, e.grimpe.cot, data.echelles[gd] || [])), ...Object.keys(M.grille).filter(deGd).map(k => k.split("|")[0])])].filter(Boolean).sort((a, b) => cots.indexOf(a) - cots.indexOf(b));
      return h`<h2>Bilan · ${court(M.jour || s.date)} · ${nomSeance(s, sa)}</h2>
      <label class="champ">Forme du jour <span class="petit">${M.formeAvant ? "notée au début, à corriger si besoin" : "facultatif"}</span></label>${choix("mChamp", [["bien", "🙂 Bien"], ["moyen", "😐 Moyen"], ["pastop", "😣 Pas top"]], M.forme || "", { data: { champ: "forme" } })}
      <label class="champ">Effort (1 = très facile, 10 = maximal)</label>${echelle("mChamp", 10, M.effort, { data: { champ: "effort" } })}
      <label class="champ">Douleur après (0 = aucune)</label>${echelle("mChamp", 10, M.apres, { de: 0, data: { champ: "apres" } })}
      ${si(M.apres > 0, () => liste("zone", data.zones.filter(z => z !== "Aucune"), M.zone, { label: "Zone", vide: "Choisir…" }))}
      ${si(estGrimpe, h`<label class="champ">En gros, ce que tu as grimpé <span class="petit">${precises ? `en plus des ${precises} passages déjà notés` : "(approximatif)"}</span></label>
        ${si(mixteB, h`<div class="segment disc-saisie">${["Voie", "Bloc"].map(x => h`<button data-act="mChamp" data-champ="gDisc" data-valeur="${x}" class="${gd === x ? "choisi" : ""}">${x}</button>`)}</div>`)}
        <div class="grille">${presentes.map(c => h`<div class="grille-ligne"><b>${deuxCot(salleB, gd, "", c)}</b>${["ok", "ko"].map(r => h`<span class="compteur"><button data-act="mGrille" data-k="${cle(c, r)}" data-pas="-1">−</button><span>${M.grille[cle(c, r)] || 0} ${r === "ok" ? "✓" : "✗"}</span><button data-act="mGrille" data-k="${cle(c, r)}" data-pas="1">+</button></span>`)}</div>`)}
        <button class="fiche-ligne" data-act="mPlier" data-k="autresCots"><span>Une autre cotation</span><span class="val">${M.autresCots ? "▾" : "›"}</span></button>
        ${si(M.autresCots, () => h`<div class="fiche-contenu"><div class="choix compact">${cots.filter(c => !presentes.includes(c)).map(c => h`<button data-act="mGrille" data-k="${cle(c, "ok")}" data-pas="1">${deuxCot(salleB, gd, "", c)}</button>`)}</div></div>`)}</div>`)}
      <button class="fiche-ligne" data-act="mPlier" data-k="details"><span>Heures, notes</span><span class="val">${M.hDebut} → ${M.hFin}${dureeHeures(M) != null ? ` · ${dureeHeures(M)} min` : ""} ${M.details ? "▾" : "›"}</span></button>
      ${si(M.details, () => h`<div class="fiche-contenu"><div class="ed-rangee"><label class="champ">Début</label><input type="time" data-champ="hDebut" value="${M.hDebut}"><label class="champ">Fin</label><input type="time" data-champ="hFin" value="${M.hFin}"></div><label class="champ">Notes</label><textarea data-champ="notes" rows="3">${M.notes}</textarea></div>`)}
      ${actionsBas(sa.fin ? "Enregistrer" : "Terminer la séance", "bilanOk", M.effort === "")}`; }

    case "menu": return h`<h2>${court(s.date)} · ${nomSeance(s, sa)}</h2><div class="menu">
      ${si(!M.surPage, h`<button data-act="menuBilan">Bilan / terminer</button>`)}<button data-act="menuEditer">✎ Modifier le plan</button><button data-act="menuDeplacer">${ico("calendrier")} Déplacer</button><button data-act="menuCopier">${ico("copier")} Copier vers une autre date</button>
      ${si(!(M.surPage && M.avant), h`<button data-act="menuSauter">Séance sautée</button>`)}${si(ctx.store.annulable, h`<button data-act="annuler">${ico("annuler")} Annuler : ${ctx.store.annulable}</button>`)}
      <button class="danger" data-act="menuReinit">Effacer les saisies de cette séance</button>${si(s.libre || s.copie, h`<button class="danger" data-act="menuSupprimerSeance">Supprimer cette séance</button>`)}</div><div class="actions"><button data-act="mFermer">Fermer</button></div>`;

    case "info": { const [titre, l] = INFOS[M.k] || ["", []]; return h`<h2>${titre}</h2>${l.map(p => h`<p>${p}</p>`)}<div class="actions"><button class="principal" data-act="infoFermer">OK</button></div>`; }

    case "menuEcran": return h`<h2>${M.titre}</h2><div class="menu">${M.items.map((x, i) => h`<button class="${x.danger ? "danger" : ""}" data-act="menuItem" data-i="${i}">${x.label}</button>`)}
      ${si(ctx.store.annulable, h`<button data-act="annuler">${ico("annuler")} Annuler : ${ctx.store.annulable}</button>`)}</div><div class="actions"><button data-act="mFermer">Fermer</button></div>`;

    case "copierSeance": return h`<h2>Copier la séance</h2><p class="petit">${s.activite} du ${court(s.date)} : une nouvelle séance identique, à la date choisie. L'originale ne bouge pas.</p>
      <input type="date" data-champ="date" value="${M.date}">${actionsBas("Copier", "copierSeanceOk")}`;

    case "copieSemaine": { const derniere = Math.max(...ctx.programme.map(x => x.semaine));
      return h`<h2>Semaine ${M.w} : copier ou répéter</h2>
      ${choix("mChamp", [["repeter", "Répéter juste après"], ["copier", "Copier vers une semaine"]], M.mode, { data: { champ: "mode" } })}
      ${M.mode === "repeter" ? h`<label class="champ">Combien de fois ?</label>${echelle("mChamp", 4, M.n, { data: { champ: "n" } })}<p class="petit">Semaines ${M.w + 1} à ${M.w + M.n} remplacées par une copie de la semaine ${M.w}.</p>`
        : h`<label class="champ">Vers la semaine</label><div class="choix compact">${Array.from({ length: derniere + 4 }, (_, i) => i + 1).filter(x => x !== M.w).map(x => h`<button data-act="mChamp" data-champ="dest" data-valeur="${x}" class="${M.dest === x ? "choisi" : ""}">${x}</button>`)}</div><p class="petit">Les séances prévues de la semaine ${M.dest} sont remplacées.</p>`}
      <p class="petit">Une semaine qui contient une séance commencée ou faite n'est jamais écrasée.</p>${actionsBas(M.mode === "repeter" ? "Répéter" : "Copier", "copieSemaineOk")}`; }

    case "deplacer": return h`<h2>Déplacer la séance</h2><p class="petit">Prévue le ${court(s.datePrevue)}. La séance garde sa place dans le programme ; seule sa date change.</p>
      <input type="date" data-champ="date" value="${M.date}">${actionsBas("Déplacer", "deplacerOk")}`;

    case "ficheRoutine": { const e = data.routines.filter(x => x.routine === M.nom), tot = e.reduce((t, x) => t + (x.duree || 0), 0);
      return h`<h2>${M.nom}</h2><p class="petit"><span class="cat-chip" style="--cat:${COULEUR_ROUTINES}">Routine</span> ${GENRES_ROUTINE[(e[0] || {}).genre] || ""}${tot ? ` · ${dureeTexte(tot)} en tout` : ""}</p>
      <ol class="routine">${e.map(x => h`<li><b>${x.etape}</b>${x.duree ? h` <span class="petit">${dureeTexte(x.duree)}</span>` : ""}<div>${lier(x.quoi, data.exercices)}</div></li>`)}</ol>
      <div class="actions"><button data-act="favori" data-nom="${M.nom}">${doc.favoris.includes(M.nom) ? "★ Favori" : "☆ Favori"}</button><button class="principal" data-act="mFermer">Fermer</button></div>`; }
    case "ficheExo": { const x = data.exercices[+M.k]; return h`<h2>${x.nom}</h2><p class="petit"><span class="cat-chip" style="--cat:${couleurCategorie(x.categorie)}">${x.categorie}</span> ${etiquetteNiveau(x.niveau)}${x.discipline ? " · " + x.discipline : ""}${+x.duree > 0 ? ` · ≈ ${x.duree} min` : ""}</p>
      ${si(x.but, h`<p><b>But.</b> ${x.but}</p>`)}<ol>${x.comment.split("\n").filter(Boolean).map(l => h`<li>${l}</li>`)}</ol>
      ${si(x.erreurs, h`<p><b>Erreurs fréquentes.</b> ${x.erreurs}</p>`)}${si(x.facile, h`<p><b>Plus facile.</b> ${x.facile}</p>`)}${si(x.securite, h`<p class="securite">${ico("bouclier")} ${x.securite}</p>`)}
      ${si(x.perso, () => h`<p class="petit">${x.perso === "mien" ? "Exercice à toi." : `Fiche modifiée (d'origine : « ${x.base} »).`} Reporté dans Programme.xlsx au prochain « grimpe.py rapport ».</p>`)}
      <div class="actions"><button data-act="favori" data-nom="${x.nom}">${doc.favoris.includes(x.nom) ? "★ Favori" : "☆ Favori"}</button><button data-act="exoEditer" data-k="${M.k}">${ico("crayon")} Modifier</button><button class="principal" data-act="mFermer">Fermer</button></div>`; }
    case "exoEdit": { const cats = [...new Set(data.exercices.map(e => e.categorie).filter(Boolean))], groupes = FAMILLES.map(([, l], i) => ({ groupe: NOMS_FAMILLES[i], options: l.filter(c => cats.includes(c)) })).filter(g => g.options.length);
      const autres = cats.filter(c => !FAMILLES.some(([, l]) => l.includes(c))); if (autres.length) groupes.push({ groupe: "Autres", options: autres });
      const champ = (k, label, ph, zone = false) => h`<label class="champ">${label}</label>${zone ? h`<textarea data-champ="${k}" rows="${k === "comment" ? 5 : 2}" placeholder="${ph}">${M[k] || ""}</textarea>` : h`<input type="text" data-champ="${k}" value="${M[k] || ""}" placeholder="${ph}">`}`;
      return h`<h2>${M.edition ? "Modifier l'exercice" : "Nouvel exercice"}</h2>${si(M.base, () => h`<p class="petit">Fiche d'origine : « ${M.base} ». Les séances qui la citent suivent la nouvelle version.</p>`)}
      ${champ("nom", "Nom", "Pieds silencieux")}
      ${liste("categorie", groupes, M.categorie, { act: "mListe", vide: "Catégorie…", label: "Catégorie" })}
      <label class="champ">Niveau</label>${choix("mChamp", ["Débutant", "Intermédiaire", "Avancé"], M.niveau, { data: { champ: "niveau" } })}
      <label class="champ">Discipline</label>${choix("mChamp", [...new Set(["Voie et bloc", "Voie", "Bloc", M.discipline].filter(Boolean))], M.discipline || "Voie et bloc", { data: { champ: "discipline" } })}
      <label class="champ">Durée habituelle <span class="petit">(minutes, facultatif : sert à estimer la durée des séances)</span></label><input type="number" inputmode="numeric" min="0" max="180" data-champ="duree" value="${M.duree ?? ""}" placeholder="ex. 5">
      ${champ("but", "But", "à quoi il sert")}${champ("comment", "Comment faire (une étape par ligne)", "Regarde la prise…", true)}${champ("securite", "Sécurité", "facultatif", true)}
      ${champ("erreurs", "Erreurs fréquentes", "facultatif")}${champ("facile", "Plus facile", "facultatif")}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="exoEnregistrer">Enregistrer</button></div>
      ${si(M.id && M.base, h`<div class="zone-danger"><button class="danger" data-act="exoRetablir">Rétablir la fiche d'origine</button></div>`)}
      ${si(M.id && !M.base, h`<div class="zone-danger"><button class="danger" data-act="exoSupprimer">Supprimer cet exercice</button></div>`)}`; }

    case "mesures": { const prec = k => { const w = Object.keys(doc.mesures).map(Number).filter(x => x < M.semaine && doc.mesures[x][k] != null && doc.mesures[x][k] !== "").sort((a, b) => b - a)[0]; return w ? { w, v: doc.mesures[w][k] } : null; };
      return h`<h2>Mesures · semaine ${M.semaine}</h2><p class="petit">Quelques tests simples, une fois par semaine, reposé : pour voir si tu progresses. Tout est facultatif. ${info("mesures", "Quels tests, comment ?")}</p>
      ${MESURES.map(([k, l]) => { const p = k !== "notes" && prec(k); return h`<label class="champ">${l}${p ? h` <span class="petit">· la dernière fois (S${p.w}) : ${p.v}</span>` : ""}</label>${k === "notes" ? h`<textarea data-champ="${k}" rows="2">${M[k] || ""}</textarea>` : h`<input type="number" inputmode="decimal" step="any" data-champ="${k}" value="${M[k] ?? ""}">`}`; })}${actionsBas("Enregistrer", "mesuresOk")}`; }

    case "editeur": return editeur.rendre(ctx);

    case "pause": { const deb = doc.reglages.dateDebut || data.dateDebut, lundi = ajouterJours(deb, 7 * (M.depuis - 1)), apres = ajouterJours(lundi, 7 * (M.n || 1));
      const fin = ctx.programme.reduce((m, x) => x.date > m ? x.date : m, "");
      return h`<h2>Faire une pause avant la semaine ${M.depuis}</h2>
      <p>Tu ne peux pas grimper pendant un moment (blessure, vacances, maladie) ? Le programme t'attend : il reprendra à la semaine ${M.depuis} après la pause, au lieu de te faire sauter des séances.</p>
      <label class="champ">Durée de la pause</label>${choix("mChamp", [[1, "1 sem."], [2, "2 sem."], [3, "3 sem."], [4, "4 sem."]], M.n, { data: { champ: "n" }, classe: "compact une-ligne" })}
      <div class="carte compacte"><p>La semaine ${M.depuis} commencera le <b>${court(apres)}</b> au lieu du ${court(lundi)}.</p>${fin ? h`<p class="petit">Toutes les semaines suivantes glissent aussi : fin du programme le ${court(ajouterJours(fin, 7 * (M.n || 1)))} au lieu du ${court(fin)}.</p>` : ""}
        <p class="petit">Les séances déjà commencées, faites ou sautées restent à leur date. Rien n'est effacé ; Options › Annuler défait la pause.</p></div>
      ${info("pause", "En savoir plus")}${actionsBas(`Décaler de ${M.n || 1} semaine${(M.n || 1) > 1 ? "s" : ""}`, "pauseOk")}`; }

    case "salle": { const sl = M.id ? salleDe(doc, M.id) : null, nb = sl ? sl.voies.length : 0;
      // Façon de coter, en trois questions : comment la salle note ? combien de niveaux ? équivalent dans la cotation de l'app (pré-rempli)
      const modeDisc = disc => { const c = M.cotation[disc], f = formeDe(c), genere = ["chiffres", "lettres", "mixte"].includes(f);
        return h`<div class="cot-disc"><b>${disc === "Voie" ? "Voies" : "Blocs"}</b>
        ${liste(`forme-${disc}`, FORMES(disc), f, { act: "mForme", vide: null, data: { disc }, label: "Comment la salle note ses niveaux ?" })}
        ${si(genere, () => h`<div class="ligne-reg"><span>Nombre de niveaux différents</span><span class="compteur"><button data-act="mNbNiveaux" data-disc="${disc}" data-pas="-1">−</button><span>${c.liste.length}</span><button data-act="mNbNiveaux" data-disc="${disc}" data-pas="1">+</button></span></div>
          ${si(f === "mixte", () => liste(`depart-${disc}`, ["1", "2", "3", "4", "5", "6", "7", "8"], String(c.depart || 4), { act: "mDepart", vide: null, data: { disc }, label: "Premier niveau (avec a, b, c)" }))}`)}
        ${si(f === "couleurs", () => h`<p class="petit">Touche les couleurs dans l'ordre, de la plus facile à la plus dure.</p><div class="pastilles">${PALETTE.map(b => b.nuances[0]).concat(((sl && sl.couleurs) || []).map(x => [x.nom, x.hex])).filter(([nom]) => !c.liste.some(x => x.salle === nom)).map(([nom, hex]) => h`<button data-act="mEquivAjout" data-disc="${disc}" data-valeur="${nom}" class="pastille" style="background:${hex}" title="${nom}" aria-label="${nom}"></button>`)}</div>`)}
        ${si(f === "libre", () => h`<div class="ajout"><input type="text" placeholder="Niveau affiché par la salle (ex. N3, vert foncé)" data-champ="nouveau-${disc}" value="${M["nouveau-" + disc] || ""}"><button data-act="mEquivAjout" data-disc="${disc}">+</button></div>`)}
        ${si(c.mode === "liste" || c.mode === "couleurs", () => c.liste.length ? h`<p class="petit">${c.liste.length} niveau${c.liste.length > 1 ? "x" : ""} · équivalent dans la cotation de l'app (pré-rempli, modifiable) :</p><div class="equiv">${c.liste.map((x, i) => h`<div class="equiv-ligne"><span>${c.mode === "couleurs" ? h`<span class="pastille" style="background:${hexDe(doc, x.salle, sl)}"></span> ` : ""}<b>${x.salle}</b></span>
            ${liste(`equiv-${disc}-${i}`, data.echelles[disc], x.app, { act: "mEquivSel", vide: "≈ ?", data: { disc, i } })}${si(!genere, h`<button data-act="mEquivSuppr" data-disc="${disc}" data-i="${i}" aria-label="Retirer">✕</button>`)}</div>`)}</div>` : h`<p class="petit">Aucun niveau pour l'instant.</p>`)}</div>`; };
      const resumeCot = ["Voie", "Bloc"].filter(d => M.typeSalle === "Bloc et voie" || M.typeSalle === d).map(d => `${d === "Voie" ? "voies" : "blocs"} : ${{ standard: d === "Voie" ? "française" : "Fontainebleau", chiffres: "chiffres", lettres: "lettres", mixte: "chiffres et lettres", couleurs: "couleurs", libre: "ses niveaux", aucune: "aucune" }[formeDe(M.cotation[d])]}${M.cotation[d].liste.length && M.cotation[d].mode !== "standard" ? ` (${M.cotation[d].liste.length})` : ""}`).join(" · ");
      return h`<h2>${M.id ? "Modifier la salle" : "Nouvelle salle"}</h2><label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom}" placeholder="Nom de la salle">
      ${ligneChoix(M, "type", "Type", M.typeSalle, () => choix("mChamp", ["Bloc", "Voie", "Bloc et voie"], M.typeSalle, { data: { champ: "typeSalle" } }))}
      ${si(!M.id, () => h`<label class="champ">Secteurs</label>${champsSecteurs(M, 0)}`)}
      <label class="champ">Couleur de la carte</label><div class="pastilles">${FONDS_SALLE.map(c => h`<button class="pastille ${(M.fond || (sl ? fondSalle(doc, sl) : "")) === c ? "choisi" : ""}" style="background:${c}" data-act="mChamp" data-champ="fond" data-valeur="${c}" aria-label="Couleur de fond"></button>`)}</div>
      <button class="fiche-ligne" data-act="mSection" data-k="cot"><span>Façon de coter</span><span class="val">${resumeCot} ${M.section === "cot" ? "▾" : "›"}</span></button>
      ${si(M.section === "cot", () => h`<div class="fiche-contenu">${si(M.typeSalle !== "Bloc", () => modeDisc("Voie"))}${si(M.typeSalle !== "Voie", () => modeDisc("Bloc"))}</div>`)}
      ${si(M.id, () => h`<button class="fiche-ligne" data-act="mSection" data-k="coul"><span>Couleurs propres à la salle</span><span class="val">${(sl.couleurs || []).length || "aucune"} ${M.section === "coul" ? "▾" : "›"}</span></button>
        ${si(M.section === "coul", () => h`<div class="fiche-contenu">${(sl.couleurs || []).map(c => h`<div class="equiv-ligne"><input type="color" value="${c.hex}" data-act="couleurTeinte" data-nom="${c.nom}"><input type="text" value="${c.nom}" data-act="couleurNom" data-nom="${c.nom}"><button data-act="couleurSuppr" data-nom="${c.nom}" aria-label="Supprimer">✕</button></div>`)}
          <div class="ajout"><input type="text" data-champ="coulNom" placeholder="Nouvelle couleur (ex. Lilas)" value="${M.coulNom || ""}"><input type="color" data-champ="coulHex" value="${M.coulHex || "#888888"}"><button data-act="salleCouleur">+</button></div></div>`)}`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="salleOk" ${M.nom ? "" : "disabled"}>Enregistrer</button></div>
      ${si(M.id, () => h`<div class="zone-danger"><button class="danger" data-act="salleSupprimer">Supprimer la salle${nb ? ` et ses ${nb} voie${nb > 1 ? "s" : ""}` : ""}</button></div>`)}`; }

    case "inventaire": { const sl = salleDe(doc, M.salleId), c = cotationDe(sl, M.disc), niv = niveauxSalle(sl, M.disc), total = Object.values(M.comptes).reduce((a, b) => a + b, 0);
      return h`<h2>Inventaire rapide · ${sl.nom}</h2><p class="petit">Combien de ${M.disc === "Bloc" ? "blocs" : "voies"} à chaque niveau ? Elles sont créées d'un coup ; les couleurs et les noms se complètent ensuite, voie par voie.</p>
      ${si(sl.type === "Bloc et voie", () => choix("mInvDisc", [["Voie", "Voies"], ["Bloc", "Blocs"]], M.disc, { classe: "compact" }))}
      ${si(sl.secteurs.length, () => liste("secteurId", sl.secteurs.map(x => [x.id, x.nom]), M.secteurId, { label: "Dans le secteur", vide: "Sans secteur", act: "mSecteurListe" }))}
      <div class="inventaire">${niv.map(n => h`<div class="ligne-reg"><span>${c.mode === "couleurs" ? h`<span class="pastille" style="background:${hexDe(doc, n, sl)}"></span> ${n.toLowerCase()}` : h`<b>${n || (c.mode === "aucune" ? "Sans niveau" : "Niveau inconnu")}</b>`}${c.mode === "couleurs" && cotApp(sl, M.disc, "", n) ? h` <span class="petit">≈ ${cotApp(sl, M.disc, "", n)}</span>` : ""}</span>
        <span class="inv-droite">${si(c.mode !== "couleurs", () => { const cl = (M.couleursNiv || {})[n] || "", hx = cl ? hexDe(doc, cl, sl) : "";
            return h`<button class="inv-couleur ${cl ? "" : "vide"} ${M.invCoul === n ? "ouvert" : ""}" data-act="mInvCouleurOuvrir" data-k="${n}" style="${hx ? `background:${hx}` : ""}" aria-label="Couleur des ${M.disc === "Bloc" ? "blocs" : "voies"} ${n}">${cl ? "" : "?"}</button>`; })}
        <span class="compteur"><button data-act="mInv" data-k="${n}" data-pas="-1" ${M.comptes[n] ? "" : "disabled"}>−</button><span>${M.comptes[n] || 0}</span><button data-act="mInv" data-k="${n}" data-pas="1">+</button></span></span></div>
        ${si(M.invCoul === n && c.mode !== "couleurs", () => h`<div class="fiche-contenu">${pastilles(ctx, "mInvCouleur", (M.couleursNiv || {})[n] || "", sl, { k: n })}</div>`)}`)}</div>
      ${si(c.mode !== "couleurs", () => h`<p class="petit">Le rond à côté de chaque niveau : la couleur des prises de ces ${M.disc === "Bloc" ? "blocs" : "voies"} (facultatif ; « ? » = sans couleur, à compléter ensuite).</p>`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="inventaireOk" ${total ? "" : "disabled"}>Créer ${total} ${M.disc === "Bloc" ? (total > 1 ? "blocs" : "bloc") : (total > 1 ? "voies" : "voie")}</button></div>`; }

    case "secteurs": return h`<h2>Nouveaux secteurs · ${salleDe(doc, M.salleId).nom}</h2>${champsSecteurs(M)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="secteursOk">Créer ${M.noms.length} secteur${M.noms.length > 1 ? "s" : ""}</button></div>`;

    case "secteur": { const sl = salleDe(doc, M.salleId), n = M.id ? sl.voies.filter(v => v.secteurId === M.id && v.statut !== "demontee").length : 0, i = M.id ? sl.secteurs.findIndex(x => x.id === M.id) : -1;
      return h`<h2>${M.id ? "Modifier le secteur" : "Nouveau secteur"}</h2><label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom}" placeholder="Dalle, Toit, Mur du fond…">${(() => { const n = M.id ? sl.voies.filter(v => v.secteurId === M.id && v.profil && v.statut !== "demontee").length : 0;
        return h`<p class="petit">Inclinaison : <b>${M.id ? inclinaisonSecteur(sl, M.id) || "Vertical" : "Vertical"}</b> — ${n ? `la plus fréquente de ses ${n} voie${n > 1 ? "s" : ""}` : "par défaut ; ensuite, la plus fréquente de ses voies"}. Les nouvelles voies la prennent.</p>`; })()}
      ${si(M.id && sl.secteurs.length > 1, () => h`<label class="champ">Place sur le mur</label><div class="ed-rangee"><button data-act="secteurBouger" data-pas="-1" ${i === 0 ? "disabled" : ""}>↑ Monter</button><button data-act="secteurBouger" data-pas="1" ${i === sl.secteurs.length - 1 ? "disabled" : ""}>↓ Descendre</button><span class="petit">${i + 1} sur ${sl.secteurs.length}</span></div>`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="secteurOk" ${M.nom ? "" : "disabled"}>Enregistrer</button></div>
      ${si(M.id, () => h`<div class="zone-danger"><button data-act="secteurRenouveler" ${n ? "" : "disabled"}>${ico("renouveler")} Renouveler : ${n} voie${n > 1 ? "s" : ""} démontée${n > 1 ? "s" : ""}</button><button class="danger" data-act="secteurSupprimer">Supprimer le secteur</button></div>`)}`; }

    case "voie": { const sl = salleDe(doc, M.salleId), tous = toutesTentatives(ctx.programme, doc), hv = M.id ? parVoie(tous).find(x => x.voieId === M.id) : null,
        ts = M.id ? tous.filter(t => t.voieId === M.id).sort((a, b) => (a.date || "0") === (b.date || "0") ? (b.t || 0) - (a.t || 0) : (a.date || "0") < (b.date || "0") ? 1 : -1) : [];
      const sec = sl.secteurs.find(x => x.id === M.secteurId), cot = cotationDe(sl, M.disc), autresSalles = doc.salles.filter(x => x.id !== sl.id && (x.type === "Bloc et voie" || x.type === M.disc));
      const libCot = cot.mode === "couleurs" ? (cotApp(sl, M.disc, "", M.couleur) || "selon la couleur") : M.cotSalle || "—";
      // Création comme modification : une ligne par réglage (« Couleur  Rouge › »), on n'ouvre que ce qu'on change.
      // En création, couleur et cotation sont ouvertes d'office : ce sont les deux choix à faire.
      const ouvertes = M.id || M.section ? [M.section] : ["couleur", "cot"];
      const ligne = (k, label, valeur, contenu) => h`<button class="fiche-ligne" data-act="mSection" data-k="${k}"><span>${label}</span><span class="val">${valeur} ${ouvertes.includes(k) ? "▾" : "›"}</span></button>${si(ouvertes.includes(k), () => h`<div class="fiche-contenu">${contenu()}</div>`)}`;     // une seule présentation
      return h`${M.id ? h`<div class="fiche-tete"><span class="tuile-voie apercu ${hexDe(doc, M.couleur, sl) === "transparent" ? "sans-couleur" : ""}" style="background:${hexDe(doc, M.couleur, sl)};color:${texteSur(hexDe(doc, M.couleur, sl))}"><b>${M.etoile ? "★ " : ""}${libelleVoie({ cotSalle: M.cotSalle, cot: cotApp(sl, M.disc, M.cotSalle, M.couleur) })}</b>${dessinProfil(M.profil, "picto-tuile")}</span>
          <div><h2>${M.disc === "Bloc" ? "Bloc" : "Voie"}${M.nom ? " · " + M.nom : ""}</h2><p class="petit">${sl.nom}${sec ? " · " + sec.nom : ""}${M.statut === "demontee" ? " · démontée" : ""}</p>
          <p class="petit">${hv ? `${hv.essais} essai${hv.essais > 1 ? "s" : ""}, ${hv.reussies} réussi${hv.reussies > 1 ? "s" : ""}` : "jamais tentée"}</p></div></div>
          ${si(M.statut === "demontee", h`<button class="gros principal" data-act="voieDemonter">Remonter cette voie</button>`)}`
        : h`<h2>${M.disc === "Bloc" ? "Nouveau bloc" : "Nouvelle voie"} · ${sl.nom}</h2>`}
      ${si(sl.type === "Bloc et voie", () => ligne("disc", "Discipline", M.disc, () => choix("mChamp", ["Voie", "Bloc"], M.disc, { data: { champ: "disc" } })))}
      ${ligne("couleur", "Couleur", M.couleur || "—", () => pastilles(ctx, "mCouleur", M.couleur, sl))}
      ${ligne("cot", "Cotation", libCot, () => cotationSalle(ctx, sl, M.disc, M))}
      ${ligne("profil", "Inclinaison", M.profil || "—", () => choixProfil("mProfil", M.profil))}
      ${si(sl.secteurs.length, () => ligne("secteur", "Secteur", sec ? sec.nom : "sans secteur", () => liste("secteurId", sl.secteurs.map(x => [x.id, x.nom]), M.secteurId || "", { vide: "Sans secteur", act: "mSecteurListe" })))}
      ${ligne("carac", "Caractéristiques", (M.carac || []).join(", ") || "—", () => h`${listeMulti("carac", CARACTERISTIQUES, M.carac)}<p class="petit">Arête, traversée, dièdre… plusieurs possibles. Elles entrent dans « À travailler » de Progrès.</p>`)}
      ${ligne("nom", "Nom ou repère", M.nom || "—", () => h`<input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`)}
      ${si(M.id && autresSalles.length, () => ligne("salle", "Salle", sl.nom, () => h`<p class="petit">Voie notée dans la mauvaise salle ? Déplace-la : ses passages la suivent.</p>${liste("salleCible", [[sl.id, sl.nom + " (actuelle)"], ...autresSalles.map(x => [x.id, x.nom])], M.salleCible || sl.id, { vide: null })}`))}
      ${si(M.id, () => h`<div class="historique-voie"><div class="hv-tete"><b>Historique</b><button class="petit-btn btn-ajout" data-act="passageAutreJour">+ Ajouter</button></div>
        ${ts.length ? ts.map(t => { const e = reussiT(t) ? essaisAvantReussite(tous, t) : null, rep = reussiT(t) && dejaReussie(tous, t.voieId, t) !== null;
          return h`<div class="hv-ligne"><span><b>${t.date ? court(t.date) : "Date inconnue"}</b> · ${resLabel(t)}${rep ? " · répétition" : ""}${t.aisance ? " · " + AISANCES[t.aisance].toLowerCase() : ""}${e ? ` · ${e === "inconnu" ? "essais inconnus" : e === "1" || e === 1 ? "flash" : e + " essais"}` : ""}${t.cause ? " · " + t.cause.toLowerCase() : ""}<br><span class="petit">${t.approx ? "hors séance" : "en séance"}</span></span>
            <button class="hv-suppr" data-act="passageSupprimer" data-pa="${t.approx ? t.id || "" : ""}" data-s="${t.approx ? "" : t.seanceId}" data-t="${t.t || ""}" aria-label="Supprimer ce passage">✕</button></div>`; })
          : h`<p class="petit">Aucun passage. « + Ajouter » pour noter un passage d'un autre jour (réussite ou échecs).</p>`}</div>`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="voieOk">Enregistrer</button></div>
      ${si(M.id && M.statut !== "demontee" && seanceEnCoursPour(ctx, M.disc), () => h`<button class="gros contour" data-act="noterDepuisFiche">+ Noter un passage maintenant</button>`)}
      ${si(M.id, () => h`<div class="fiche-actions"><button data-act="mBasculeEtoile">${M.etoile ? "★ À essayer" : "☆ À essayer"}</button><button data-act="voieDupliquer">${ico("copier")} Dupliquer</button>${si(M.statut !== "demontee", h`<button data-act="voieDemonter">Démontée</button>`)}</div>
        <div class="zone-danger"><button class="danger" data-act="voieSupprimer">Supprimer la voie</button></div>`)}`; }

    case "supprimer": return h`<h2>${M.titre}</h2><p class="petit">${M.texte}</p><div class="menu">${M.choix.map((c, i) => h`<button class="${c.danger ? "danger" : ""}" data-act="supprimerChoix" data-i="${i}">${c.label}</button>`)}</div>
      <p class="petit">Tu pourras annuler juste après.</p><div class="actions"><button data-act="mFermer">Annuler</button></div>`;

    case "selection": return h`<h2>${M.titre}</h2>${M.quoi === "profil" ? choixProfil("selectionAppliquer", "") : cotationSalle(ctx, salleDe(doc, ctx.state.salleId), M.disc, M)}
      ${si(M.quoi === "cot", () => h`<div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="selectionAppliquer" ${M.cotSalle || M.couleur ? "" : "disabled"}>Appliquer</button></div>`)}${si(M.quoi === "profil", h`<div class="actions"><button data-act="mFermer">Annuler</button></div>`)}`;

    case "ajoutRapide": { const sl = salleDe(doc, M.salleId), pret = M.couleur || M.cotSalle;
      return h`<h2>Ajouter plusieurs voies · ${sl.nom}</h2><p class="petit">Par exemple : 4 jaunes en 5b dans le même secteur. Elles s'ajoutent d'un coup ; la fenêtre reste ouverte pour la série suivante.</p>
      ${si(sl.type === "Bloc et voie", () => ligneChoix(M, "disc", "Discipline", M.disc, () => choix("mChamp", ["Voie", "Bloc"], M.disc, { data: { champ: "disc" } })))}
      <label class="champ">Couleur</label>${pastilles(ctx, "mCouleur", M.couleur, sl)}${cotationSalle(ctx, sl, M.disc, M)}
      <label class="champ">Combien ?</label>${echelle("mChamp", 8, M.nb, { data: { champ: "nb" } })}
      ${si(sl.secteurs.length, () => liste("secteurId", sl.secteurs.map(x => [x.id, x.nom]), M.secteurId, { label: "Secteur", vide: "Sans secteur", act: "mSecteurListe" }))}
      ${ligneChoix(M, "profil", "Inclinaison", M.profil || profilHabituel(sl, M.secteurId), () => choixProfil("mProfil", M.profil || profilHabituel(sl, M.secteurId)))}
      ${si(M.total, h`<p class="petit">✓ ${M.total} voie${M.total > 1 ? "s" : ""} ajoutée${M.total > 1 ? "s" : ""} depuis l'ouverture.</p>`)}
      <div class="actions"><button data-act="mFermer">Terminé</button><button class="principal" data-act="ajoutRapideOk" ${pret ? "" : "disabled"}>Ajouter ${M.nb || 1}</button></div>`; }

    case "classerSecteur": { const sl = salleDe(doc, M.salleId);
      return h`<h2>Déplacer ${ctx.state.classer.size} voie${ctx.state.classer.size > 1 ? "s" : ""} vers…</h2><div class="menu">${sl.secteurs.map(x => h`<button data-act="classerSecteurOk" data-id="${x.id}">${x.nom}</button>`)}<button data-act="classerSecteurOk" data-id="">Sans secteur</button></div>
      ${si(!sl.secteurs.length, h`<p class="petit">Aucun secteur : crée-en un avec « + Secteur ».</p>`)}<div class="actions"><button data-act="mFermer">Annuler</button></div>`; }

    case "passageAncien": { const sl = M.salle ? salleDe(doc, M.salle) : null, v = M.voieId && sl ? sl.voies.find(x => x.id === M.voieId) : null, plusieurs = M.res && M.res !== "ok";
      const dates = M.dates || [], nb = dates.length + (M.inconnues || 0);
      return h`<h2>${v ? "Ajouter des passages" : "Passage hors séance"}</h2>
      ${v ? h`<p><span class="pastille" style="background:${hexDe(doc, v.couleur, sl)}"></span> <b>${libelleVoie(v)}</b> <span class="petit">· ${sl.nom}</span></p>` : ""}
      ${si(!v && !M.couleur && !M.nom, () => h`<button class="ligne-nouvelle ${M.nouvelle ? "choisi" : ""}" data-act="mBool" data-k="nouvelle">${M.nouvelle ? "☑" : "☐"} Nouvelle voie <span class="petit">(sinon : une voie déjà faite)</span></button>`)}
      ${si(!v, () => h`${ligneChoix(M, "disc", "Discipline", M.disc, () => choix("mChamp", ["Voie", "Bloc"], M.disc, { data: { champ: "disc" } }))}
        ${cotationResultat(ctx, M, M.disc)}
        ${ligneChoix(M, "profil", "Inclinaison", M.profil, () => choixProfil("mProfil", M.profil))}
        ${ligneChoix(M, "plus", "Couleur, nom", [M.couleur, M.nom].filter(Boolean).join(" · ") || "facultatif", () => h`${pastilles(ctx, "mCouleur", M.couleur)}<input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="Nom (facultatif)">`)}
        ${si(doc.salles.length, () => liste("salle", doc.salles.map(x => [x.id, x.nom]), M.salle, { label: "Salle", vide: "Salle inconnue" }))}
`)}
      <label class="champ">Résultat</label>${choix("mChamp", choixResultat(v ? v.disc : M.disc), M.res, { data: { champ: "res" } })}
      ${plusieurs ? h`<label class="champ">${M.res === "sec" ? "Dates (une par passage)" : "Dates des échecs (une par essai)"}</label>
        <div class="dates-pastilles">${dates.map((d, i) => h`<button class="date-pastille" data-act="dateRetirer" data-i="${i}">${court(d)} ✕</button>`)}${si(M.inconnues, h`<button class="date-pastille" data-act="inconnueRetirer">Date inconnue ×${M.inconnues} ✕</button>`)}${si(!nb, h`<span class="petit">aucune date</span>`)}</div>
        <div class="ed-rangee"><input type="date" data-champ="dateAjout" value="${M.dateAjout || ctx.aujourdhui()}"><button data-act="dateAjouter">+ Cette date</button><button data-act="inconnueAjouter">+ Date inconnue</button></div>
        ${si(!v, () => h`<label class="champ">Combien de fois chaque date ?</label>${echelle("mChamp", 8, M.n, { data: { champ: "n" } })}`)}`
      : h`${ligneChoix(M, "date", "Date", M.dateInconnue ? "inconnue" : court(M.date), () => h`<div class="ed-rangee"><input type="date" data-champ="date" value="${M.date}"><button data-act="mBool" data-k="dateInconnue" class="${M.dateInconnue ? "choisi" : ""}">Date inconnue</button></div>`)}
        ${si(M.res === "ok", () => champsReussite(ctx, M))}`}
      ${actionsBas(plusieurs && nb > 1 ? `Ajouter ${nb * (v ? 1 : M.n || 1)} passages` : "Ajouter", "passageAncienOk", !M.res || (plusieurs ? !nb : !M.date && !M.dateInconnue))}`; }

    case "nouveauProgramme": return h`<h2>Nouveau programme</h2><p>Le programme a changé (${data.programmeId}). Les saisies de l'ancien programme ne lui correspondent plus.</p>
      <p class="petit">Exporte d'abord (sauvegarde complète), puis démarre : les séances de l'ancien programme sont effacées ; réglages, salles, passages hors séance et favoris sont gardés.</p>
      <div class="actions"><button data-act="exporter">${ico("envoyer")} Exporter</button><button class="principal danger" data-act="nouveauProgrammeOk">Démarrer le nouveau programme</button></div>`;

    case "coller": return h`<h2>Restaurer en collant le texte</h2><p class="petit">Colle ici le texte copié avec « Copier les données » (depuis Notes ou un mail).</p>
      <textarea data-champ="texte" rows="8" placeholder="{ &quot;format&quot;: &quot;grimpe-export&quot;, … }">${M.texte || ""}</textarea>${actionsBas("Continuer", "collerOk")}`;

    case "import": return h`<h2>Restaurer une sauvegarde</h2><p>Sauvegarde du ${(M.exporteLe || "").slice(0, 16).replace("T", " ")}${M.autreProgramme ? h` · <b>d'un autre programme</b>` : ""}${M.source ? ` (${M.source})` : ""}.</p>
      <p class="petit">Tout ce qui est dans l'app sera remplacé.</p><div class="actions"><button data-act="mFermer">Annuler</button><button class="principal danger" data-act="importOk">Remplacer</button></div>`;
    default: return h`<p>Fenêtre inconnue : ${M.type}</p><div class="actions"><button data-act="mFermer">Fermer</button></div>`;
  }
}

const M = ctx => ctx.state.modal;
// Durée en minutes d'après les heures du bilan (une fin avant le début = après minuit)
const enMinutes = hm => { const m = /^(\d{1,2}):(\d{2})$/.exec(hm || ""); return m ? +m[1] * 60 + +m[2] : null; };
export function dureeHeures(m) { const a = enMinutes(m.hDebut), b = enMinutes(m.hFin); if (a == null || b == null) return null; return Math.max(1, (b - a + 1440) % 1440); }
// La fiche d'une voie fait foi : ses passages déjà notés reprennent sa cotation, sa couleur, son nom et son profil
function propagerVoies(doc, salle) {
  const parId = new Map(salle.voies.map(v => [v.id, v]));
  for (const sa of Object.values(doc.seances)) for (const t of sa.tentatives || []) { const v = t.voieId && parId.get(t.voieId); if (!v) continue;
    Object.assign(t, { cot: v.cot || "", cotSalle: v.cotSalle || "", couleur: v.couleur || "", nom: v.nom || "", profil: v.profil || t.profil || "" }); }
}
const nettoyer = t => { Object.keys(t).forEach(k => (t[k] === undefined || t[k] === "" || t[k] === null) && delete t[k]); return t; };
export const actions = {
  ...editeur.actions,
  mFermer: ctx => { const p = ctx.state.modal && ctx.state.modal.precedent; p ? ctx.ouvrirModal(p) : ctx.fermerModal(); },
  ficheExo: (ctx, d) => ctx.ouvrirModal({ type: "ficheExo", k: d.k, precedent: ctx.state.modal }),
  collerOk: ctx => { try { const v = verifierImport(lireTexte(M(ctx).texte || ""), ctx.data); ctx.ouvrirModal({ type: "import", ...v, source: "texte collé" }); } catch (e) { ctx.toast(e.message); } },
  mListe: (ctx, d, el) => { const m = M(ctx); m[d.champ] = el.value; m.section = "";
    if (m.type === "passageAncien" && d.champ === "salle") m.cotSalle = m.cot ? cotSalleDe(salleDe(ctx.doc, m.salle), m.disc, m.cot).split(" / ")[0] || "" : "";     // l'autre salle : sa cotation à elle
    ctx.rendre(); },
  mListeMulti: (ctx, d, el) => { M(ctx)[el.dataset.champMulti] = [...el.selectedOptions].map(o => o.value); ctx.rendre(); },
  mSecteurListe: (ctx, d, el) => { M(ctx).secteurId = el.value; ctx.state.dernierSecteur = el.value; ctx.rendre(); },
  voieRapideCause: (ctx, d, el) => { if (el.value) actions.voieRapideOk(ctx, { cause: el.value }); },
  noterDepuisFiche: ctx => { const m = M(ctx), s = seanceEnCoursPour(ctx, m.disc); if (!s) return; ctx.ouvrirModal({ type: "voieRapide", seanceId: s.id, salleId: m.salleId, voieId: m.id, disc: m.disc, res: "", sec: 1, cause: "" }); },
  mBool: (ctx, d) => { const m = M(ctx); m[d.k] = !m[d.k]; ctx.rendre(); },
  mBascVal: (ctx, d) => { const m = M(ctx); m[d.champ] = m[d.champ] === d.valeur ? "" : d.valeur; if (m.type === "apresReussite") enregistrerApresReussite(ctx, m); ctx.rendre(); },
  mChamp: (ctx, d) => { const m = M(ctx); if (m.type === "passageAncien" && d.champ === "disc" && d.valeur !== m.disc) { m.cot = ""; m.cotSalle = ""; m.chiffre = ""; }
    m[d.champ] = TEXTE.has(d.champ) || isNaN(d.valeur) || d.valeur === "" ? d.valeur : +d.valeur; m.section = "";      // un niveau « 6 » reste du texte
    if (d.champ === "disc") { m.cot = ""; m.cotSalle = ""; m.chiffre = ""; if (m.res === "sec" && d.valeur === "Bloc") m.res = ""; }   // autre échelle : on repart de zéro
    ctx.rendre(); },
  mBasculeEtoile: ctx => { const m = M(ctx); m.etoile = m.etoile ? "" : ctx.aujourdhui(); ctx.rendre(); },
  etoileFenetre: (ctx, d) => { ctx.modifier("voie à essayer", doc => { const v = salleDe(doc, d.salle).voies.find(x => x.id === d.id); if (v.etoile) delete v.etoile; else v.etoile = ctx.aujourdhui(); }); ctx.rendre(); },
  mBascule: (ctx, d) => { const l = M(ctx).quoi, i = l.indexOf(d.k); i >= 0 ? l.splice(i, 1) : l.push(d.k); ctx.rendre(); },
  mPlier: (ctx, d) => { M(ctx)[d.k] = !M(ctx)[d.k]; ctx.rendre(); },
  mChiffre: (ctx, d) => { M(ctx).chiffre = d.valeur; M(ctx)[d.champ || "cot"] = ""; ctx.rendre(); },
  mCot: (ctx, d) => { const c = d.champ || "cot"; M(ctx)[c] = d.valeur === M(ctx)[c] ? "" : d.valeur; if (!d.valeur) M(ctx).chiffre = ""; if (M(ctx).type === "selection" || M(ctx).type === "voie") M(ctx).section = ""; ctx.rendre(); },
  mProfil: (ctx, d) => { M(ctx).profil = d.valeur; M(ctx).section = ""; ctx.rendre(); },
  mSecteur: (ctx, d) => { M(ctx).secteurId = d.valeur; M(ctx).section = ""; ctx.state.dernierSecteur = d.valeur; ctx.rendre(); },
  mCouleur: (ctx, d) => { M(ctx).couleur = M(ctx).couleur === d.valeur ? "" : d.valeur; if (M(ctx).type === "voie") M(ctx).section = ""; ctx.rendre(); },
  mInvCouleurOuvrir: (ctx, d) => { const m = M(ctx); m.invCoul = m.invCoul === d.k ? null : d.k; ctx.rendre(); },
  mInvCouleur: (ctx, d) => { const m = M(ctx); m.couleursNiv = m.couleursNiv || {}; m.couleursNiv[d.k] = m.couleursNiv[d.k] === d.valeur ? "" : d.valeur; m.invCoul = null; if (!m.comptes[d.k]) m.comptes[d.k] = 1; ctx.rendre(); },
  mInv: (ctx, d) => { const m = M(ctx); m.comptes[d.k] = Math.max(0, (m.comptes[d.k] || 0) + +d.pas); ctx.rendre(); },
  mInvDisc: (ctx, d) => { const m = M(ctx); m.disc = d.valeur; m.comptes = {}; ctx.rendre(); },
  inventaireOk: ctx => { const m = M(ctx), sl0 = salleDe(ctx.doc, m.salleId), couleurs = cotationDe(sl0, m.disc).mode === "couleurs"; let n = 0;
    ctx.modifier("inventaire", d => { const sl = salleDe(d, m.salleId);
      for (const [niv, k] of Object.entries(m.comptes)) for (let i = 0; i < k; i++) { sl.voies.push(nouvelleVoie(sl, { disc: m.disc, couleur: couleurs ? niv : (m.couleursNiv || {})[niv] || m.couleur || "", cotSalle: couleurs ? "" : niv, profil: profilHabituel(sl, m.secteurId || null), secteurId: m.secteurId || null }, ctx.aujourdhui())); n++; } });
    forcerOuvert(`sec-${m.salleId}-${m.secteurId || ""}`); ctx.fermerModal(); ctx.toast(m.disc === "Bloc" ? `${n} bloc${n > 1 ? "s" : ""} créé${n > 1 ? "s" : ""}` : `${n} voie${n > 1 ? "s" : ""} créée${n > 1 ? "s" : ""}`, () => ctx.store.annuler()); },
  mNbSecteurs: (ctx, d) => { const m = M(ctx); m.noms = nomsSecteurs(m.noms, Math.max(m.type === "salle" ? 0 : 1, Math.min(30, m.noms.length + +d.pas)), m.departNom || 1); ctx.rendre(); },
  mNomSecteur: (ctx, d, el) => { M(ctx).noms[+d.i] = el.value; },
  secteursOk: ctx => { const m = M(ctx); ctx.modifier("secteurs", d => { const sl = salleDe(d, m.salleId); m.noms.forEach((n, i) => sl.secteurs.push({ id: nouvelId("sec"), nom: n.trim() || String((m.departNom || 1) + i), profil: "Vertical" })); });
    ctx.fermerModal(); ctx.toast(`${m.noms.length} secteur${m.noms.length > 1 ? "s" : ""} créé${m.noms.length > 1 ? "s" : ""}`, () => ctx.store.annuler()); },
  mForme: (ctx, d, el) => { const c = M(ctx).cotation[d.disc], f = el.value;
    if (f === "standard" || f === "aucune" || f === "couleurs") { if (c.mode !== f) c.liste = []; c.mode = f; delete c.forme; }
    else { const avant = c.mode === "liste" ? c.forme || "libre" : ""; c.mode = "liste"; c.forme = f;
      if (f !== "libre") { c.liste = niveauxGeneres(f, avant === f ? c.liste.length : 6, c.depart || 4, c.liste, d.disc, ctx.data.echelles); } else if (avant !== "libre") c.liste = []; }
    ctx.rendre(); },
  mNbNiveaux: (ctx, d) => { const c = M(ctx).cotation[d.disc]; c.liste = niveauxGeneres(c.forme, Math.max(1, Math.min(20, c.liste.length + +d.pas)), c.depart || 4, c.liste, d.disc, ctx.data.echelles); ctx.rendre(); },
  mDepart: (ctx, d, el) => { const c = M(ctx).cotation[d.disc]; c.depart = +el.value; c.liste = niveauxGeneres(c.forme, c.liste.length || 6, c.depart, [], d.disc, ctx.data.echelles); ctx.rendre(); },
  mEquivSel: (ctx, d, el) => { const x = M(ctx).cotation[d.disc].liste[+d.i]; x.app = el.value; delete x.auto; },
  mMode: (ctx, d) => { M(ctx).cotation[d.disc].mode = d.valeur; ctx.rendre(); },
  mEquiv: (ctx, d, el) => { M(ctx).cotation[d.disc].liste[+d.i].app = el.value.trim(); },
  mEquivSuppr: (ctx, d) => { M(ctx).cotation[d.disc].liste.splice(+d.i, 1); ctx.rendre(); },
  mEquivAjout: (ctx, d) => { const m = M(ctx), val = d.valeur || (m["nouveau-" + d.disc] || "").trim(); if (!val) return; if (!m.cotation[d.disc].liste.some(x => x.salle === val)) { const l = m.cotation[d.disc].liste; l.push({ salle: val, app: "" }); if (m.cotation[d.disc].mode === "couleurs") preRemplir(l, d.disc, ctx.data.echelles); } m["nouveau-" + d.disc] = ""; ctx.rendre(); },
  mGrille: (ctx, d) => { const m = M(ctx); m.grille[d.k] = Math.max(0, (m.grille[d.k] || 0) + +d.pas); if (!m.grille[d.k]) delete m.grille[d.k]; ctx.rendre(); },

  pasTopOk: ctx => { const m = M(ctx); ctx.modifierSeance(m.seanceId, "forme du jour", sa => { sa.recup = Object.fromEntries(["doigts", "coudes", "epaules", "energie", "motivation"].map(k => [k, m.quoi.includes(k) ? 2 : 4])); sa.douleur = { ...(sa.douleur || {}), avant: m.niveau, zoneAvant: m.niveau ? m.zone : "" }; }); ctx.fermerModal(); },
  voieRapideRes: (ctx, d) => { const m = M(ctx); m.res = d.res; if (d.res === "ok") actions.voieRapideOk(ctx, {}); else ctx.rendre(); },
  voieRapideOk: (ctx, d) => { const m = M(ctx), s = ctx.seance(m.seanceId), salle = salleDe(ctx.doc, m.salleId), v = salle.voies.find(x => x.id === m.voieId);
    const dejaTentee = toutesTentatives(ctx.programme, ctx.doc).some(x => x.voieId === v.id);
    const t = tentativeDe(v, salle, nettoyer({ k: cleRattachement(ctx, s, ctx.saisie(s.id), m.disc), res: m.res, sec: m.res === "sec" ? +d.sec : undefined, cause: m.res === "ko" ? d.cause : undefined, style: m.res === "ok" ? (dejaTentee ? "Après travail" : "À vue") : undefined }));
    ctx.fermerModal(); ajouterTentative(ctx, s, t);
    if (m.res === "ok") ouvrirApresReussite(ctx, s, v);
    else ctx.rendre(); },
  apresReussiteOk: ctx => { const m = M(ctx); enregistrerApresReussite(ctx, m); ctx.fermerModal(); },
  voieEditerDepuis: (ctx, d) => { const m = M(ctx), v = salleDe(ctx.doc, m.salleId).voies.find(x => x.id === d.id); ctx.ouvrirModal({ type: "voie", salleId: m.salleId, ...v, chiffre: (v.cotSalle || "")[0] || "", precedent: m }); },
  nouvelleVoieOk: (ctx, d) => { const m = M(ctx), s = ctx.seance(m.seanceId), salle = salleDe(ctx.doc, m.salleId);
    let v = voieExistante(salle, { disc: m.disc, couleur: m.couleur, cotSalle: m.cotSalle, nom: m.nom });
    if (!v) { v = nouvelleVoie(salle, { disc: m.disc, couleur: m.couleur, cotSalle: m.cotSalle, nom: m.nom, profil: m.profil, secteurId: m.secteurId || null, carac: m.carac }, ctx.aujourdhui()); ctx.modifier("voie ajoutée", doc => { salleDe(doc, m.salleId).voies.push(v); }); }
    ctx.fermerModal();
    if (d.res) ajouterTentative(ctx, s, tentativeDe(v, salleDe(ctx.doc, m.salleId), nettoyer({ k: cleRattachement(ctx, s, ctx.saisie(s.id), m.disc), res: d.res, style: d.res === "ok" ? "À vue" : undefined })));
    if (d.res === "ok") ouvrirApresReussite(ctx, s, v); else ctx.rendre(); },
  mCotSalle: (ctx, d) => { const m = M(ctx), salle = salleDe(ctx.doc, m.salleEch || m.salle); m.cotSalle = d.valeur || ""; m.cot = d.valeur ? cotApp(salle, m.disc, d.valeur) : ""; ctx.rendre(); },
  resultatOk: ctx => { const m = M(ctx), s = ctx.seance(m.seanceId), t = nettoyer({ t: Date.now(), k: m.k, disc: m.disc, cot: m.cot || "", cotSalle: m.cotSalle, profil: m.profil, res: m.res, sec: m.res === "sec" ? m.sec : undefined, style: m.res === "ok" ? m.style : undefined, cause: m.res === "ko" ? m.cause : undefined, couleur: m.couleur, nom: m.nom, salle: m.salle, voieId: m.voieId, nouvelle: !m.voieId && !m.couleur && !m.nom && m.nouvelle ? true : undefined, ...(m.res === "ok" ? champsTentative(m, ctx) : {}) });
    if (m.edit !== undefined) { ctx.modifierSeance(s.id, "correction", sa => { const anc = sa.tentatives[m.edit]; sa.tentatives[m.edit] = { ...t, t: anc.t, k: anc.k, approx: anc.approx }; }); ctx.fermerModal(); }
    else { ctx.fermerModal(); ajouterTentative(ctx, s, t); } ctx.rendre(); },
  resultatSupprimer: ctx => { const m = M(ctx); ctx.modifierSeance(m.seanceId, "passage supprimé", sa => { sa.tentatives.splice(m.edit, 1); }); ctx.fermerModal(); },
  douleurOk: ctx => { const m = M(ctx); if (!m.zone) return; ctx.modifierSeance(m.seanceId, "douleur notée", sa => { sa.douleur = sa.douleur || {}; sa.douleur.pendant = sa.douleur.pendant || []; sa.douleur.pendant.push({ t: Date.now(), zone: m.zone, niveau: m.niveau }); }); ctx.fermerModal(); ctx.toast("Douleur notée"); },
  sauterOk: ctx => { const m = M(ctx); ctx.modifierSeance(m.seanceId, "séance sautée", sa => { sa.statut = "sautee"; sa.raison = m.raison; delete sa.debut; delete sa.fin; }); ctx.fermerModal(); },
  bilanOk: ctx => { const m = M(ctx); if (m.effort === "") return; const minutes = dureeHeures(m);
    if (!minutes) { ctx.toast("Vérifie les heures de début et de fin."); m.details = true; ctx.rendre(); return; }
    ctx.modifierSeance(m.seanceId, "bilan", sa => { const now = Date.now(), debut = new Date(`${m.jour}T${m.hDebut.padStart(5, "0")}:00`).getTime();
      if (!sa.debut) sa.approx = true;
      sa.debut = debut; sa.fin = debut + minutes * 60000; sa.duree = minutes; delete sa.pauseTotale; delete sa.statut; delete sa.pause;
      sa.effort = +m.effort; sa.douleur = { ...(sa.douleur || {}), apres: +m.apres || 0, zone: +m.apres ? m.zone : "" }; sa.notes = m.notes;
      sa.tentatives = (sa.tentatives || []).filter(t => !t.approx);
      for (const [k, n] of Object.entries(m.grille)) { const [cot, res, dd] = k.split("|"); for (let i = 0; i < n; i++) sa.tentatives.push({ t: now, disc: dd || m.disc, cot, profil: "", res, approx: true, ...(sa.salle ? { salle: sa.salle } : {}) }); }
      if (m.forme && m.forme !== m.formeAvant) sa.recup = { ...RECUP_FORME[m.forme] }; });
    ctx.fermerModal(); ctx.rendre(true);
    // Sans sauvegarde GitHub, et sans export depuis 7 jours : un rappel, avec le bouton
    ctx.synchroniser("fin de séance").then(ok => { const d = ctx.doc.dernierExport, jours = d ? (Date.now() - new Date(d)) / 864e5 : 99;
      if (!ok && jours > 7) ctx.toast(d ? `Dernière sauvegarde il y a ${Math.floor(jours)} jours` : "Aucune sauvegarde de tes données", null, { label: "Sauvegarder", action: () => ctx.agir("copierOuExporter") }); }); },
  menuBilan: ctx => { const id = M(ctx).seanceId; ctx.fermerModal(); ctx.state.seanceId = id; ACTIONS_SEANCE.bilanOuvrir(ctx, { id }); },
  menuSauter: ctx => { const id = M(ctx).seanceId; ctx.fermerModal(); ctx.state.seanceId = id; ACTIONS_SEANCE.sauterOuvrir(ctx); },
  menuEditer: ctx => { const s = ctx.seance(M(ctx).seanceId); editeur.ouvrir(ctx, { cible: s.id, contenu: s.contenu }); },
  menuCopier: ctx => { const s = ctx.seance(M(ctx).seanceId); ctx.ouvrirModal({ type: "copierSeance", seanceId: s.id, date: ajouterJours(s.date, 7) }); },
  copierSeanceOk: ctx => { const m = M(ctx), s = ctx.seance(m.seanceId); if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || "")) { ctx.toast("Choisis une date."); return; }
    const debut = ctx.doc.reglages.dateDebut || ctx.data.dateDebut, sem = semaineDe(debut, m.date), ops = opsCopieSeance(s, sem, nomJour(m.date));
    if (sem < 1) ops.push({ id: nouvelId("o"), op: "date", cible: ops[0].cible, date: m.date });
    ctx.modifier("séance copiée", d => { d.ops.push(...ops); }); ctx.fermerModal(); ctx.toast(`Copiée au ${court(m.date)}`, () => ctx.store.annuler()); },
  copieSemaineOk: ctx => { const m = M(ctx), dests = m.mode === "repeter" ? Array.from({ length: m.n }, (_, i) => m.w + i + 1) : [m.dest];
    const { ops, refusees } = opsCopieSemaine(ctx.programme, ctx.doc, m.w, dests), faites = dests.filter(x => !refusees.includes(x));
    if (ops.length) ctx.modifier(`semaine ${m.w} copiée`, d => { d.ops.push(...ops); });
    ctx.fermerModal(); ctx.toast(`${faites.length ? `Copiée vers ${faites.map(x => "S" + x).join(", ")}` : "Rien copié"}${refusees.length ? ` · ${refusees.map(x => "S" + x).join(", ")} déjà commencée${refusees.length > 1 ? "s" : ""} : laissée${refusees.length > 1 ? "s" : ""}` : ""}`, ops.length ? () => ctx.store.annuler() : undefined); },
  menuDeplacer: ctx => { const s = ctx.seance(M(ctx).seanceId); ctx.ouvrirModal({ type: "deplacer", seanceId: s.id, date: s.date }); },
  menuReinit: ctx => { const id = M(ctx).seanceId; if (!confirm("Effacer toutes les saisies de cette séance ?")) return; ctx.modifier("saisies effacées", d => { delete d.seances[id]; }); ctx.fermerModal(); },
  deplacerOk: ctx => { const m = M(ctx), s = ctx.seance(m.seanceId); if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date || "")) { ctx.toast("Choisis une date."); return; } ctx.modifier("séance déplacée", d => { d.ops = d.ops.filter(o => !(o.op === "date" && o.cible === s.id)); if (m.date !== s.datePrevue) d.ops.push({ id: nouvelId("o"), op: "date", cible: s.id, date: m.date }); }); ctx.fermerModal(); },
  pauseOk: ctx => { const m = M(ctx), { ids, gardees } = idsAPauser(ctx.programme, ctx.doc, m.depuis);
    ctx.modifier("pause du programme", d => { d.ops.push({ id: nouvelId("o"), op: "pause", depuis: m.depuis, n: m.n, ids }); }); ctx.fermerModal();
    ctx.toast(`${ids.length} séance${ids.length > 1 ? "s" : ""} décalée${ids.length > 1 ? "s" : ""}${gardees ? ` ; ${gardees} déjà commencée${gardees > 1 ? "s" : ""} ou faite${gardees > 1 ? "s" : ""} reste${gardees > 1 ? "nt" : ""} en place` : ""}`, () => ctx.store.annuler()); },
  mesuresOk: ctx => { const m = M(ctx); ctx.modifier("mesures", d => { d.mesures[m.semaine] = Object.fromEntries(MESURES.map(([k]) => [k, m[k]]).filter(([, v]) => v !== "" && v != null)); }); ctx.fermerModal(); },
  // Bibliothèque modifiable : tes fiches (doc.exos), qui complètent ou modifient celles du programme
  exoNouveau: ctx => ctx.ouvrirModal({ type: "exoEdit", ...ficheDe({}), niveau: "Débutant", discipline: "Voie et bloc", edition: false }),
  exoEditer: (ctx, d) => { const x = ctx.data.exercices[+d.k]; ctx.ouvrirModal({ type: "exoEdit", ...ficheDe(x), edition: true }); },
  exoEnregistrer: ctx => { const m = M(ctx), nom = (m.nom || "").trim();
    if (!nom) { ctx.toast("Donne un nom à l'exercice"); return; } if (!m.categorie) { ctx.toast("Choisis une catégorie"); return; }
    const autre = ctx.data.exercices.find(e => e.nom.toLowerCase() === nom.toLowerCase() && (e.persoId || "") !== (m.id || "") && e.nom !== m.base);
    if (autre) { ctx.toast(`« ${nom} » existe déjà dans la bibliothèque`); return; }
    const fiche = { id: m.id || nouvelId("x"), base: m.base || "", nom, categorie: m.categorie, niveau: m.niveau || "", discipline: m.discipline || "Voie et bloc", but: (m.but || "").trim(), comment: (m.comment || "").trim(), securite: (m.securite || "").trim(), erreurs: (m.erreurs || "").trim(), facile: (m.facile || "").trim(), duree: +m.duree > 0 ? Math.min(180, Math.round(+m.duree)) : "" };
    ctx.modifier(m.edition ? `exercice « ${nom} » modifié` : `exercice « ${nom} » ajouté`, x => { x.exos = (x.exos || []).filter(e => e.id !== fiche.id); x.exos.push(fiche); });
    ctx.fermerModal(); ctx.toast(m.edition ? "Fiche enregistrée" : "Exercice ajouté à la bibliothèque", () => ctx.agir("annuler")); },
  exoRetablir: ctx => { const m = M(ctx); ctx.modifier(`fiche « ${m.base} » rétablie`, x => { x.exos = (x.exos || []).filter(e => e.id !== m.id); }); ctx.fermerModal(); ctx.toast("Fiche d'origine rétablie", () => ctx.agir("annuler")); },
  exoSupprimer: ctx => { const m = M(ctx); ctx.modifier(`exercice « ${m.nom} » supprimé`, x => { x.exos = (x.exos || []).filter(e => e.id !== m.id); }); ctx.fermerModal(); ctx.toast("Exercice supprimé", () => ctx.agir("annuler")); },
  favori: (ctx, d) => { ctx.modifier("favori", x => { const i = x.favoris.indexOf(d.nom); i >= 0 ? x.favoris.splice(i, 1) : x.favoris.push(d.nom); }); ctx.rendre(); },
  ajoutRapideOk: ctx => { const m = M(ctx), n = +m.nb || 1; forcerOuvert(`sec-${m.salleId}-${m.secteurId || ""}`);
    ctx.modifier(`${n} voie${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}`, d => { const sl = salleDe(d, m.salleId);
      for (let i = 0; i < n; i++) sl.voies.push(nouvelleVoie(sl, { disc: m.disc, couleur: m.couleur, cotSalle: m.cotSalle, profil: m.profil, secteurId: m.secteurId || null }, ctx.aujourdhui())); });
    m.total = (m.total || 0) + n; m.nb = 1; m.couleur = ""; m.cotSalle = ""; m.chiffre = ""; ctx.rendre(); },
  classerSecteurOk: (ctx, d) => { const ids = [...ctx.state.classer], sid = ctx.state.salleId; forcerOuvert(`sec-${sid}-${d.id || ""}`);
    ctx.modifier("voies classées", doc => { const sl = salleDe(doc, sid); ids.forEach(id => ranger(sl, id, d.id || null, null)); });
    ctx.state.classer = null; ctx.fermerModal(); ctx.toast(`${ids.length} voie${ids.length > 1 ? "s" : ""} classée${ids.length > 1 ? "s" : ""}`, () => ctx.store.annuler()); },

  // ---------- Salles, secteurs, voies : modifier, supprimer (toujours avec « Annuler ») ----------
  mSection: (ctx, d) => { const m = M(ctx); m.section = m.section === d.k ? "" : d.k; ctx.rendre(); },
  salleOk: ctx => { const m = M(ctx); if (!m.nom) return; ctx.modifier("salle", d => { if (m.id) { const sl = salleDe(d, m.id); Object.assign(sl, { nom: m.nom, type: m.typeSalle, cotation: m.cotation, ...(m.fond ? { fond: m.fond } : {}) });
      sl.voies.forEach(v => { v.cot = cotApp(sl, v.disc, v.cotSalle, v.couleur); }); propagerVoies(d, sl); } else { const id = nouvelId("s"); d.salles.push({ id, nom: m.nom, type: m.typeSalle, couleurs: [], cotation: m.cotation, secteurs: (m.noms || []).map((n, i) => ({ id: nouvelId("sec"), nom: n.trim() || String(i + 1), profil: "Vertical" })), voies: [], ...(m.fond ? { fond: m.fond } : {}) });
      if (m.pourSeance) { const sa = d.seances[m.pourSeance] = d.seances[m.pourSeance] || {}; sa.salle = id; retenirSalle(d, m.pourDisc, id); } } }); ctx.fermerModal(); },
  salleCouleur: ctx => { const m = M(ctx); if (!m.coulNom) return; ctx.modifier("couleur de salle", d => { salleDe(d, m.id).couleurs.push({ nom: m.coulNom.trim(), hex: m.coulHex || "#888888" }); }); m.coulNom = ""; ctx.rendre(); },
  couleurTeinte: (ctx, d, el) => { const m = M(ctx); ctx.modifier("couleur modifiée", doc => renommerCouleur(doc, salleDe(doc, m.id), d.nom, d.nom, el.value)); ctx.rendre(); },
  couleurNom: (ctx, d, el) => { const m = M(ctx), nom = el.value.trim(); if (!nom || nom === d.nom) return;
    if (couleursDe(salleDe(ctx.doc, m.id)).some(c => c.nom === nom)) { ctx.toast(`« ${nom} » existe déjà.`); ctx.rendre(); return; }
    ctx.modifier("couleur renommée", doc => renommerCouleur(doc, salleDe(doc, m.id), d.nom, nom)); ctx.rendre(); },
  couleurSuppr: (ctx, d) => { const m = M(ctx), n = voiesDeCouleur(salleDe(ctx.doc, m.id), d.nom);
    if (n) { ctx.toast(`${n} voie${n > 1 ? "s utilisent" : " utilise"} « ${d.nom} » : change d'abord leur couleur.`); return; }
    ctx.modifier("couleur supprimée", doc => supprimerCouleur(salleDe(doc, m.id), d.nom)); ctx.toast(`Couleur « ${d.nom} » supprimée`, () => ctx.store.annuler()); ctx.rendre(); },
  salleSupprimer: ctx => { const m = M(ctx), sl = salleDe(ctx.doc, m.id), p = Object.values(ctx.doc.seances).flatMap(sa => sa.tentatives || []).filter(t => t.salle === m.id).length;
    const faire = passages => { let r; ctx.modifier("salle supprimée", d => { r = supprimerSalle(d, m.id, passages); }); ctx.state.modal = null;
      if (ctx.state.vue === "salle") ctx.ouvrir("salles"); else ctx.rendre();
      ctx.toast(`Salle « ${sl.nom} » supprimée${r.voies ? ` avec ${r.voies} voie${r.voies > 1 ? "s" : ""}` : ""}${passages === "supprimer" && r.passages ? ` et ${r.passages} passage${r.passages > 1 ? "s" : ""}` : ""}`, () => ctx.store.annuler()); };
    if (!p) return faire("garder");
    ctx.ouvrirModal({ type: "supprimer", titre: `Supprimer « ${sl.nom} »`, texte: `${sl.voies.length} voie${sl.voies.length > 1 ? "s partent" : " part"} avec la salle. ${p} passage${p > 1 ? "s ont été notés" : " a été noté"} dans cette salle.`,
      choix: [{ label: `Supprimer la salle, garder les ${p} passage${p > 1 ? "s" : ""}`, faire: () => faire("garder") }, { label: `Supprimer la salle et les ${p} passage${p > 1 ? "s" : ""}`, danger: true, faire: () => faire("supprimer") }] }); },
  secteurOk: ctx => { const m = M(ctx); if (!m.nom) return; ctx.modifier("secteur", d => { const sl = salleDe(d, m.salleId); if (m.id) Object.assign(sl.secteurs.find(x => x.id === m.id), { nom: m.nom, profil: categorieInclinaison(m.profil) || sl.secteurs.find(x => x.id === m.id).profil }); else sl.secteurs.push({ id: nouvelId("sec"), nom: m.nom, profil: categorieInclinaison(m.profil) || "Vertical" }); }); ctx.fermerModal(); },
  secteurBouger: (ctx, d) => { const m = M(ctx); ctx.modifier("ordre des secteurs", doc => deplacerSecteur(salleDe(doc, m.salleId), m.id, +d.pas)); ctx.rendre(); },
  secteurRenouveler: ctx => { const m = M(ctx); let n = 0; ctx.modifier("secteur renouvelé", d => { n = renouveler(salleDe(d, m.salleId), m.id, ctx.aujourdhui()); }); ctx.fermerModal(); ctx.toast(`${n} voie${n > 1 ? "s" : ""} démontée${n > 1 ? "s" : ""}`, () => ctx.store.annuler()); },
  secteurSupprimer: ctx => { const m = M(ctx), sl = salleDe(ctx.doc, m.salleId), sec = sl.secteurs.find(x => x.id === m.id), ids = sl.voies.filter(v => v.secteurId === m.id).map(v => v.id), n = ids.length, p = passagesDe(ctx.doc, ids);
    const faire = (voies, passages) => { ctx.modifier("secteur supprimé", d => supprimerSecteur(d, salleDe(d, m.salleId), m.id, voies, passages)); ctx.fermerModal();
      ctx.toast(`Secteur « ${sec.nom} » supprimé${n ? (voies === "garder" ? ` ; ${n} voie${n > 1 ? "s" : ""} sans secteur` : ` avec ${n} voie${n > 1 ? "s" : ""}${passages === "supprimer" && p ? ` et ${p} passage${p > 1 ? "s" : ""}` : ""}`) : ""}`, () => ctx.store.annuler()); };
    if (!n) return faire("garder");
    const s = x => x > 1 ? "s" : "";
    ctx.ouvrirModal({ type: "supprimer", titre: `Supprimer le secteur « ${sec.nom} »`, texte: `Il contient ${n} voie${s(n)}${p ? `, avec ${p} passage${s(p)} noté${s(p)}` : ""}.`,
      choix: [{ label: `Garder les ${n} voie${s(n)} (sans secteur)`, faire: () => faire("garder") },
        ...(p ? [{ label: `Supprimer aussi les voies, garder leurs ${p} passage${s(p)}`, danger: true, faire: () => faire("supprimer", "garder") }, { label: `Supprimer les voies et leurs ${p} passage${s(p)}`, danger: true, faire: () => faire("supprimer", "supprimer") }]
            : [{ label: `Supprimer aussi les ${n} voie${s(n)}`, danger: true, faire: () => faire("supprimer", "garder") }])] }); },
  supprimerChoix: (ctx, d) => { const c = M(ctx).choix[+d.i]; c.faire(); },
  voieOk: ctx => { const m = M(ctx); forcerOuvert(`sec-${m.salleId}-${m.secteurId || ""}`); if (m.secteurId !== undefined) ctx.state.dernierSecteur = m.secteurId || ""; ctx.modifier("voie", d => { const sl = salleDe(d, m.salleId), champs = { disc: m.disc, couleur: m.couleur || "", cotSalle: m.cotSalle || "", cot: cotApp(sl, m.disc, m.cotSalle, m.couleur), nom: m.nom || "", profil: m.profil || "Vertical", secteurId: m.secteurId || null, carac: m.carac && m.carac.length ? [...m.carac] : undefined };
      if (m.id) { const v = sl.voies.find(x => x.id === m.id); Object.assign(v, champs); if (m.etoile) v.etoile = m.etoile; else delete v.etoile; propagerVoies(d, sl);
        if (m.salleCible && m.salleCible !== m.salleId) deplacerVoieSalle(d, m.salleId, m.salleCible, m.id); }
      else { sl.voies.push(nouvelleVoie(sl, champs, ctx.aujourdhui())); ctx.state.derniers = { ...(ctx.state.derniers || {}), [`${m.salleId}-${m.disc}`]: { couleur: m.couleur || "", cotSalle: m.cotSalle || "" } }; } });
    const p = m.precedent, partie = m.salleCible && m.salleCible !== m.salleId; ctx.fermerModal(); if (partie) ctx.toast(`Voie déplacée vers « ${salleDe(ctx.doc, m.salleCible).nom} »`, () => ctx.store.annuler()); else if (p && p.type !== "voieRapide") ctx.ouvrirModal(p); },
  voieDemonter: ctx => { const m = M(ctx), remonter = m.statut === "demontee"; ctx.modifier(remonter ? "voie remontée" : "voie démontée", d => { const v = salleDe(d, m.salleId).voies.find(x => x.id === m.id); if (remonter) { v.statut = "enPlace"; v.demontee = null; } else { v.statut = "demontee"; v.demontee = ctx.aujourdhui(); } });
    ctx.fermerModal(); ctx.toast(remonter ? "Voie remontée" : "Voie démontée", () => ctx.store.annuler()); },
  voieDupliquer: ctx => { const m = M(ctx); ctx.modifier("voie dupliquée", d => dupliquerVoie(salleDe(d, m.salleId), m.id, ctx.aujourdhui())); ctx.fermerModal(); ctx.toast("Voie dupliquée", () => ctx.store.annuler()); },
  voieSupprimer: ctx => { const m = M(ctx), p = passagesDe(ctx.doc, [m.id]);
    const faire = passages => { ctx.modifier("voie supprimée", d => supprimerVoies(d, salleDe(d, m.salleId), [m.id], passages)); ctx.state.modal = null; ctx.rendre();
      ctx.toast(`Voie supprimée${p ? (passages === "garder" ? ` ; ${p} passage${p > 1 ? "s" : ""} gardé${p > 1 ? "s" : ""}` : ` avec ${p} passage${p > 1 ? "s" : ""}`) : ""}`, () => ctx.store.annuler()); };
    if (!p) return faire("garder");
    ctx.ouvrirModal({ type: "supprimer", titre: "Supprimer la voie", texte: `${p} passage${p > 1 ? "s ont été notés" : " a été noté"} sur cette voie.`,
      choix: [{ label: `Supprimer la voie, garder ${p > 1 ? `ses ${p} passages` : "son passage"}`, faire: () => faire("garder") }, { label: `Supprimer la voie et ${p > 1 ? `ses ${p} passages` : "son passage"}`, danger: true, faire: () => faire("supprimer") }] }); },
  selectionAppliquer: (ctx, d) => { const m = M(ctx), ids = [...ctx.state.classer], sid = ctx.state.salleId;
    ctx.modifier(m.quoi === "profil" ? "inclinaison modifiée" : "cotation modifiée", doc => { const sl = salleDe(doc, sid);
      sl.voies.filter(v => ids.includes(v.id) && (m.quoi === "profil" || v.disc === m.disc)).forEach(v => { if (m.quoi === "profil") v.profil = d.valeur; else { v.cotSalle = m.cotSalle || ""; v.cot = cotApp(sl, v.disc, v.cotSalle, v.couleur); } }); propagerVoies(doc, sl); });
    ctx.state.classer = null; ctx.fermerModal(); ctx.toast(`${ids.length} voie${ids.length > 1 ? "s" : ""} modifiée${ids.length > 1 ? "s" : ""}`, () => ctx.store.annuler()); },
  passageAncienOk: ctx => { const m = M(ctx), sl = m.salle ? salleDe(ctx.doc, m.salle) : null, v = m.voieId && sl ? sl.voies.find(x => x.id === m.voieId) : null;
    const base = v ? { disc: v.disc, cot: v.cot, cotSalle: v.cotSalle, profil: v.profil, couleur: v.couleur, nom: v.nom, salle: sl.id, voieId: v.id } : { disc: m.disc, cot: m.cot, ...(m.cotSalle ? { cotSalle: m.cotSalle } : {}), profil: m.profil, couleur: m.couleur, nom: m.nom, salle: m.salle, nouvelle: !m.couleur && !m.nom && m.nouvelle ? true : undefined };
    const plusieurs = m.res !== "ok", dates = plusieurs ? [...(m.dates || []), ...Array(m.inconnues || 0).fill("")] : [m.dateInconnue ? "" : m.date], fois = plusieurs && !v ? (m.n || 1) : 1;
    let n = 0;
    ctx.modifier("passage hors séance", d => { for (const date of dates) for (let i = 0; i < fois; i++) d.passagesAnciens.push(nettoyer({ id: nouvelId("pa"), t: Date.now() + n++, date, dateInconnue: date ? undefined : true, ...base, res: m.res, sec: m.res === "sec" ? 1 : undefined, ...(m.res === "ok" ? champsTentative(m, ctx) : {}) })); });
    const p = m.precedent; ctx.fermerModal(); if (p) ctx.ouvrirModal({ ...p, section: "" }); ctx.toast(`${n} passage${n > 1 ? "s" : ""} ajouté${n > 1 ? "s" : ""}`, () => ctx.store.annuler()); },
  dateAjouter: ctx => { const m = M(ctx), d = m.dateAjout || ctx.aujourdhui(); m.dates = [...(m.dates || []), d].sort(); ctx.rendre(); },
  dateRetirer: (ctx, d) => { const m = M(ctx); m.dates = (m.dates || []).filter((x, i) => i !== +d.i); ctx.rendre(); },
  inconnueAjouter: ctx => { M(ctx).inconnues = (M(ctx).inconnues || 0) + 1; ctx.rendre(); },
  inconnueRetirer: ctx => { M(ctx).inconnues = 0; ctx.rendre(); },
  // ✕ dans l'historique d'une voie : supprimé tout de suite, « Annuler » quelques secondes
  passageSupprimer: (ctx, d) => {
    if (d.pa) ctx.modifier("passage supprimé", x => { x.passagesAnciens = x.passagesAnciens.filter(p => p.id !== d.pa); });
    else ctx.modifierSeance(d.s, "passage supprimé", sa => { const l = sa.tentatives || [], i = l.findIndex(t => String(t.t || "") === d.t && t.voieId === M(ctx).id); if (i >= 0) l.splice(i, 1); });
    ctx.toast("Passage supprimé", () => ctx.store.annuler()); ctx.rendre(); },
  passageAutreJour: (ctx, d) => { const m = M(ctx); ctx.ouvrirModal({ type: "passageAncien", salle: m.salleId, voieId: m.id, disc: m.disc, date: ctx.aujourdhui(), dateInconnue: false, res: "", n: 1, dates: [], inconnues: 0, precedent: m }); },
  salleDuJour: (ctx, d) => { const m = M(ctx), s = ctx.seance(m.seanceId);
    ctx.modifier("salle du jour", doc => { const sa = doc.seances[s.id] = doc.seances[s.id] || {}; sa.salle = d.id; retenirSalle(doc, m.disc, d.id); }, { annulable: false }); ctx.fermerModal(); },
  salleDuJourNouvelle: ctx => { const m = M(ctx); ctx.ouvrirModal({ type: "salle", nom: "", typeSalle: m.disc, cotation: { Voie: { mode: "standard", liste: [] }, Bloc: { mode: "standard", liste: [] } }, noms: [], pourSeance: m.seanceId, pourDisc: m.disc }); },
  menuSupprimerSeance: ctx => { const id = M(ctx).seanceId; ctx.modifier("séance supprimée", d => { d.ops = d.ops.filter(o => o.cible !== id); delete d.seances[id]; }); ctx.state.seanceId = null; ctx.fermerModal(); ctx.toast("Séance supprimée", () => ctx.store.annuler()); },
  infoOuvrir: (ctx, d) => ctx.ouvrirModal({ type: "info", k: d.k, precedent: ctx.state.modal }),
  infoFermer: ctx => { const p = M(ctx).precedent; ctx.fermerModal(); if (p) ctx.ouvrirModal(p); },
  menuItem: (ctx, d) => { const x = M(ctx).items[+d.i]; ctx.fermerModal(); ctx.agir(x.act, x.data || {}); },
  nouveauProgrammeOk: ctx => { ctx.modifier("nouveau programme", d => { d.seances = {}; d.ops = []; d.mesures = {}; d.competences = {}; d.feuxVus = {}; d.programmeId = ctx.data.programmeId; }); ctx.state.seanceId = null; ctx.fermerModal(); },
  importOk: ctx => { const m = M(ctx); ctx.store.remplacer(m.doc); ctx.state.seanceId = null; ctx.state.modal = null; ctx.ouvrir("programme"); ctx.toast("Sauvegarde restaurée"); },
};

function ouvrirApresReussite(ctx, s, v) { const l = ctx.saisie(s.id).tentatives, i = l.length - 1;
  ctx.ouvrirModal({ type: "apresReussite", seanceId: s.id, i, voieId: v.id, libelle: libelleVoie(v), refTentative: refPassage(ctx, s.id, l[i]), style: l[i].style }); }
// Après une réussite notée d'un appui : aisance, essais et premier essai s'enregistrent au fil des choix
function enregistrerApresReussite(ctx, m) {
  ctx.modifierSeance(m.seanceId, "précisions", sa => { const t = sa.tentatives[m.i]; if (!t) return; const c = champsTentative(m, ctx);
    for (const k of ["aisance", "style", "essaisAvant", "premierEssai"]) { if (c[k]) t[k] = c[k]; else delete t[k]; } }, { annulable: false });
  m.refTentative = refPassage(ctx, m.seanceId, ctx.saisie(m.seanceId).tentatives[m.i]);
}
