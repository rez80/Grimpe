// ecrans/fenetres.js — les fenêtres du bas. L'état de la fenêtre est ctx.state.modal (M) ; les champs « data-champ » l'écrivent à la frappe.
import { h, si, choix, echelle, brut } from "../html.js";
import { discipline, etapesSeance, nouvelId } from "../programme.js";
import { RES_LABEL, ajouterTentative, cleRattachement, actions as ACTIONS_SEANCE } from "./seance.js";
import { court, semaineDe, nomJour } from "../dates.js";
import { salleDe, couleursDe, hexDe, texteSur, cotationDe, cotApp, nouvelleVoie, voieExistante, tentativeDe, libelleVoie, secteurDe, renouveler } from "../salles.js";
import { parVoie, tentatives as toutesTentatives, causePrincipale } from "../analyse.js";
import * as editeur from "./editeur.js";

export const PROFILS = ["Dalle", "Vertical", "Léger dévers", "Dévers", "Fort dévers", "Toit"];
const STYLES = ["À vue", "Flash", "Après travail"];
const CAUSES = ["Lecture", "Pieds", "Placement ou gainage", "Force", "Endurance", "Peur"];
const MESURES = [["planche", "Planche (s)"], ["course", "Course continue (min)"], ["tractions", "Tractions"], ["genou", "Genou contre le mur (cm)"], ["squat", "Squat profond (s)"], ["notes", "Notes"]];
const pictoProfil = p => ({ "Dalle": "M8 18 L13 2", "Vertical": "M11 18 L11 2", "Léger dévers": "M13 18 L9 2", "Dévers": "M15 18 L6 2", "Fort dévers": "M16 18 L3 5", "Toit": "M16 18 L16 8 L2 8" })[p];
export const choixProfil = (act, actuel) => h`<div class="choix profils">${PROFILS.map(p => h`<button data-act="${act}" data-valeur="${p}" class="${actuel === p ? "choisi" : ""}"><svg viewBox="0 0 18 20" class="picto"><path d="M1 19 H17" class="sol"/><path d="${pictoProfil(p)}"/></svg>${p}</button>`)}</div>`;
export const pastilles = (ctx, act, actuel, salle) => h`<div class="pastilles">${couleursDe(salle).map(c => h`<button data-act="${act}" data-valeur="${c.nom}" class="pastille ${actuel === c.nom ? "choisi" : ""}" style="background:${c.hex}" aria-label="${c.nom}" title="${c.nom}"></button>`)}</div>`;
const actionsBas = (ok = "Enregistrer", actOk = "mOk", desactive = false) => h`<div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="${actOk}" ${desactive ? "disabled" : ""}>${ok}</button></div>`;
// Sélecteur de cotation : chiffre puis lettre ; un deuxième appui efface
export function selecteurCot(ctx, disc, actuel, champ = "cot") {
  const liste = ctx.data.echelles[disc] || [], M = ctx.state.modal, chiffre = M.chiffre || (actuel ? actuel[0] : "");
  const chiffres = [...new Set(liste.map(c => c[0]))];
  return h`<div class="choix compact">${chiffres.map(c => h`<button data-act="mChiffre" data-valeur="${c}" data-champ="${champ}" class="${chiffre === c ? "choisi" : ""}">${c}</button>`)}</div>
    ${si(chiffre, h`<div class="choix compact">${liste.filter(c => c[0] === chiffre).map(c => h`<button data-act="mCot" data-valeur="${c}" data-champ="${champ}" class="${actuel === c ? "choisi" : ""}">${c}</button>`)}</div>`)}`;
}
// Cotation selon la façon de coter de la salle
function cotationSalle(ctx, salle, disc, M) {
  const c = cotationDe(salle, disc);
  if (c.mode === "standard") return h`<label class="champ">Cotation</label>${selecteurCot(ctx, disc, M.cotSalle, "cotSalle")}`;
  if (c.mode === "liste") return h`<label class="champ">Niveau (${salle.nom})</label>${choix("mChamp", c.liste.map(x => [x.salle, x.salle + (x.app ? ` (${x.app})` : "")]), M.cotSalle, { data: { champ: "cotSalle" }, classe: "compact" })}`;
  if (c.mode === "couleurs") return h`<p class="petit">Dans cette salle, la couleur donne le niveau${M.couleur ? ` : ${M.couleur} ${cotApp(salle, disc, "", M.couleur) ? "≈ " + cotApp(salle, disc, "", M.couleur) : "(équivalent inconnu)"}` : ""}.</p>`;
  return h`<p class="petit">Salle sans cotation.</p>`;
}

export function rendre(ctx) {
  const M = ctx.state.modal, { data, doc } = ctx; if (!M) return "";
  const s = M.seanceId ? ctx.seance(M.seanceId) : null, sa = s ? ctx.saisie(s.id) : {};
  switch (M.type) {
    case "pasTop": return h`<h2>Qu'est-ce qui ne va pas ?</h2><p class="petit">Plusieurs réponses possibles.</p>
      <div class="choix">${[["doigts", "Doigts"], ["coudes", "Coudes"], ["epaules", "Épaules"], ["energie", "Énergie"], ["motivation", "Motivation"]].map(([k, l]) => h`<button data-act="mBascule" data-k="${k}" class="${M.quoi.includes(k) ? "choisi" : ""}">${l}</button>`)}</div>
      <label class="champ">Une douleur maintenant ? (0 = non)</label>${echelle("mChamp", 10, M.niveau, { de: 0, data: { champ: "niveau" } })}
      ${si(M.niveau > 0, h`${choix("mChamp", data.zones.filter(z => z !== "Aucune"), M.zone, { data: { champ: "zone" }, classe: "compact" })}`)}
      ${actionsBas("C'est noté", "pasTopOk")}`;

    case "voieRapide": { const salle = salleDe(doc, M.salleId), v = salle.voies.find(x => x.id === M.voieId), hv = parVoie(toutesTentatives(ctx.programme, doc)).find(x => x.voieId === v.id), hex = hexDe(doc, v.couleur, salle);
      return h`<h2><span class="pastille" style="background:${hex}"></span> ${libelleVoie(v)}</h2><p class="petit">${v.profil ? v.profil + " · " : ""}${secteurDe(salle, v) ? secteurDe(salle, v).nom + " · " : ""}${hv ? `${hv.essais} essai${hv.essais > 1 ? "s" : ""}, ${hv.reussies} réussi${hv.reussies > 1 ? "s" : ""}${causePrincipale(hv) ? `, surtout « ${causePrincipale(hv).toLowerCase()} »` : ""}, dernier le ${court(hv.derniere)}` : "jamais tentée"}</p>
      ${!M.res ? h`<div class="rapide-btns"><button class="ok" data-act="voieRapideRes" data-res="ok">✓ ${M.disc === "Bloc" ? "Réussi" : "Enchaînée"}</button>${si(M.disc === "Voie", h`<button class="sec" data-act="voieRapideRes" data-res="sec">Avec sec</button>`)}<button class="ko" data-act="voieRapideRes" data-res="ko">✗ Pas ${M.disc === "Bloc" ? "réussi" : "réussie"}</button></div>`
        : M.res === "sec" ? h`<label class="champ">Combien de « sec » ?</label><div class="choix echelle">${[1, 2, 3, 4, 5, 6].map(n => h`<button data-act="voieRapideOk" data-sec="${n}">${n}</button>`)}</div>`
        : h`<label class="champ">Pourquoi ? <span class="petit">(un appui enregistre)</span></label><div class="choix">${CAUSES.map(c => h`<button data-act="voieRapideOk" data-cause="${c}">${c}</button>`)}<button data-act="voieRapideOk" data-cause="">Sans dire</button></div>`}
      <div class="actions"><button data-act="mFermer">Annuler</button><button data-act="voieEditerDepuis" data-id="${v.id}">Fiche de la voie</button></div>`; }

    case "nouvelleVoie": { const salle = salleDe(doc, M.salleId), c = cotationDe(salle, M.disc);
      const apercu = { disc: M.disc, couleur: M.couleur, cotSalle: M.cotSalle, cot: cotApp(salle, M.disc, M.cotSalle, M.couleur), nom: M.nom }, existe = voieExistante(salle, apercu), pret = M.couleur || M.cotSalle || M.nom;
      return h`<h2>Nouvelle ${M.disc === "Bloc" ? "bloc" : "voie"} · ${salle.nom}</h2>
      <label class="champ">Couleur des prises</label>${pastilles(ctx, "mCouleur", M.couleur, salle)}
      ${cotationSalle(ctx, salle, M.disc, M)}
      ${si(salle.secteurs.length, h`<label class="champ">Secteur</label>${choix("mSecteur", [["", "—"], ...salle.secteurs.map(x => [x.id, x.nom])], M.secteurId, { classe: "compact" })}`)}
      <button class="pli" data-act="mPlier" data-k="plus">${M.plus ? "▾" : "▸"} Profil, nom</button>
      ${si(M.plus, h`<label class="champ">Profil</label>${choixProfil("mProfil", M.profil || ((salle.secteurs.find(x => x.id === M.secteurId) || {}).profil) || "Vertical")}<label class="champ">Nom ou repère</label><input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`)}
      ${si(existe, () => h`<p class="avert">Une voie identique existe déjà (${libelleVoie(existe)}) : elle sera utilisée.</p>`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button data-act="nouvelleVoieOk" data-res="" ${pret ? "" : "disabled"}>Créer</button><button class="principal" data-act="nouvelleVoieOk" data-res="ok" ${pret ? "" : "disabled"}>Créer et ✓</button><button class="principal" data-act="nouvelleVoieOk" data-res="ko" ${pret ? "" : "disabled"}>Créer et ✗</button></div>`; }

    case "resultat": { const disc = M.disc;
      return h`<h2>${M.edit !== undefined ? "Corriger" : "Noter"} ${disc === "Bloc" ? "un bloc" : "une voie"}</h2>
      <label class="champ">Cotation <span class="petit">(facultatif)</span></label>${selecteurCot(ctx, disc, M.cot)}${si(M.cot, h`<p class="petit">Cotation : <b>${M.cot}</b> · <button class="lien" data-act="mCot" data-valeur="" data-champ="cot">sans cotation</button></p>`)}
      <label class="champ">Profil</label>${choixProfil("mProfil", M.profil)}
      <label class="champ">Résultat</label>${choix("mChamp", disc === "Bloc" ? [["ok", "✓ Réussi"], ["ko", "✗ Pas réussi"]] : [["ok", "✓ Enchaînée"], ["sec", "Avec sec"], ["ko", "✗ Pas réussie"]], M.res, { data: { champ: "res" } })}
      ${si(M.res === "sec", h`<label class="champ">Nombre de « sec »</label>${echelle("mChamp", 6, M.sec, { data: { champ: "sec" } })}`)}
      ${si(M.res === "ko", h`<label class="champ">Cause</label>${choix("mChamp", CAUSES, M.cause, { data: { champ: "cause" }, classe: "compact" })}`)}
      ${si(M.res === "ok", h`<label class="champ">Style</label>${choix("mChamp", STYLES, M.style, { data: { champ: "style" } })}`)}
      <button class="pli" data-act="mPlier" data-k="plus">${M.plus ? "▾" : "▸"} Couleur, nom</button>
      ${si(M.plus, h`<label class="champ">Couleur</label>${pastilles(ctx, "mCouleur", M.couleur, salleDe(doc, M.salle))}<label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`)}
      <div class="actions">${M.edit !== undefined ? h`<button class="danger" data-act="resultatSupprimer">Supprimer</button>` : h`<button data-act="mFermer">Annuler</button>`}<button class="principal" data-act="resultatOk" ${M.res ? "" : "disabled"}>Enregistrer</button></div>`; }

    case "douleur": return h`<h2>Douleur pendant la séance</h2><label class="champ">Zone</label>${choix("mChamp", data.zones.filter(z => z !== "Aucune"), M.zone, { data: { champ: "zone" }, classe: "compact" })}
      <label class="champ">Niveau</label>${echelle("mChamp", 10, M.niveau, { data: { champ: "niveau" } })}
      <p class="petit">≥ 4 : allège la fin de séance. ≥ 6 : arrête de grimper aujourd'hui.</p>${actionsBas("Noter", "douleurOk", !M.zone)}`;

    case "sauter": return h`<h2>Séance sautée</h2>${choix("mChamp", ["Fatigue", "Douleur", "Pas de partenaire", "Pas le temps", "Autre"], M.raison, { data: { champ: "raison" }, classe: "compact" })}${actionsBas("Marquer sautée", "sauterOk")}`;

    case "bilan": { const disc = M.disc, estGrimpe = ["Voie", "Bloc"].includes(disc), cots = data.echelles[disc] || [], precises = (sa.tentatives || []).filter(t => !t.approx).length;
      const presentes = [...new Set([...etapesSeance(s, sa).filter(e => e.grimpe && e.grimpe.cot).map(e => e.grimpe.cot), ...Object.keys(M.grille).map(k => k.split("|")[0])])].filter(Boolean).sort((a, b) => cots.indexOf(a) - cots.indexOf(b));
      return h`<h2>Bilan · ${court(s.date)} ${s.activite}</h2>
      <label class="champ">Effort (1 = très facile, 10 = maximal)</label>${echelle("mChamp", 10, M.effort, { data: { champ: "effort" } })}
      <label class="champ">Douleur après (0 = aucune)</label>${echelle("mChamp", 10, M.apres, { de: 0, data: { champ: "apres" } })}
      ${si(M.apres > 0, h`<label class="champ">Zone</label>${choix("mChamp", data.zones.filter(z => z !== "Aucune"), M.zone, { data: { champ: "zone" }, classe: "compact" })}`)}
      ${si(estGrimpe, h`<label class="champ">En gros, ce que tu as grimpé <span class="petit">${precises ? `en plus des ${precises} passages déjà notés` : "(approximatif)"}</span></label>
        <div class="grille">${presentes.map(c => h`<div class="grille-ligne"><b>${c}</b>${["ok", "ko"].map(r => h`<span class="compteur"><button data-act="mGrille" data-k="${c}|${r}" data-pas="-1">−</button><span>${M.grille[c + "|" + r] || 0} ${r === "ok" ? "✓" : "✗"}</span><button data-act="mGrille" data-k="${c}|${r}" data-pas="1">+</button></span>`)}</div>`)}
        <div class="choix compact">${cots.filter(c => !presentes.includes(c)).slice(0, 40).map(c => h`<button data-act="mGrille" data-k="${c}|ok" data-pas="1">${c}</button>`)}</div></div>`)}
      <button class="pli" data-act="mPlier" data-k="details">${M.details ? "▾" : "▸"} Durée, notes</button>
      ${si(M.details, h`<label class="champ">Durée (min)</label><input type="number" inputmode="numeric" data-champ="duree" value="${M.duree}"><label class="champ">Notes</label><textarea data-champ="notes" rows="3">${M.notes}</textarea>`)}
      ${actionsBas(sa.fin ? "Enregistrer" : "Terminer la séance", "bilanOk", M.effort === "")}`; }

    case "menu": return h`<h2>${court(s.date)} · ${s.activite}</h2><div class="menu">
      <button data-act="menuBilan">Bilan / terminer</button><button data-act="menuEditer">✎ Modifier le plan</button><button data-act="menuDeplacer">📅 Déplacer</button>
      <button data-act="menuSauter">Séance sautée</button>${si(ctx.store.annulable, h`<button data-act="annuler">↶ Annuler : ${ctx.store.annulable}</button>`)}
      <button class="danger" data-act="menuReinit">Effacer les saisies de cette séance</button></div><div class="actions"><button data-act="mFermer">Fermer</button></div>`;

    case "deplacer": return h`<h2>Déplacer la séance</h2><p class="petit">Prévue le ${court(s.datePrevue)}. La séance garde sa place dans le programme ; seule sa date change.</p>
      <input type="date" data-champ="date" value="${M.date}">${actionsBas("Déplacer", "deplacerOk")}`;

    case "ficheExo": { const x = data.exercices[+M.k]; return h`<h2>${x.nom}</h2><p class="petit">${x.categorie}${x.niveau ? " · " + x.niveau : ""}${x.discipline ? " · " + x.discipline : ""}</p>
      ${si(x.but, h`<p><b>But.</b> ${x.but}</p>`)}<ol>${x.comment.split("\n").filter(Boolean).map(l => h`<li>${l}</li>`)}</ol>
      ${si(x.erreurs, h`<p><b>Erreurs fréquentes.</b> ${x.erreurs}</p>`)}${si(x.facile, h`<p><b>Plus facile.</b> ${x.facile}</p>`)}${si(x.securite, h`<p class="securite">🛡 ${x.securite}</p>`)}
      <div class="actions"><button data-act="favori" data-nom="${x.nom}">${doc.favoris.includes(x.nom) ? "★ Favori" : "☆ Favori"}</button><button class="principal" data-act="mFermer">Fermer</button></div>`; }

    case "mesures": return h`<h2>Mesures · semaine ${M.semaine}</h2><p class="petit">Astuce : une ligne « Planche (s) {mesure planche} » dans la séance du dimanche met le champ directement dans le plan.</p>${MESURES.map(([k, l]) => h`<label class="champ">${l}</label>${k === "notes" ? h`<textarea data-champ="${k}" rows="2">${M[k] || ""}</textarea>` : h`<input type="number" inputmode="decimal" step="any" data-champ="${k}" value="${M[k] ?? ""}">`}`)}${actionsBas("Enregistrer", "mesuresOk")}`;

    case "editeur": return editeur.rendre(ctx);

    case "pause": return h`<h2>Mettre le programme en pause</h2><p class="petit">Toutes les séances à partir de la semaine ${M.depuis} sont décalées.</p>
      <label class="champ">Nombre de semaines</label>${echelle("mChamp", 4, M.n, { data: { champ: "n" } })}${actionsBas("Décaler", "pauseOk")}`;

    case "salle": { const sl = M.id ? salleDe(doc, M.id) : null;
      const modeDisc = disc => h`<label class="champ">Façon de coter · ${disc}</label>${choix("mMode", [["standard", "Comme l'app"], ["liste", "Ses niveaux"], ["couleurs", "Par couleurs"], ["aucune", "Aucune"]], M.cotation[disc].mode, { data: { disc }, classe: "compact" })}
        ${si(M.cotation[disc].mode === "liste" || M.cotation[disc].mode === "couleurs", h`<div class="equiv">${M.cotation[disc].liste.map((x, i) => h`<div class="equiv-ligne"><span>${M.cotation[disc].mode === "couleurs" ? h`<span class="pastille" style="background:${hexDe(doc, x.salle, sl)}"></span> ` : ""}${x.salle}</span><input type="text" list="echelle-${disc}" placeholder="≈ app" value="${x.app || ""}" data-act="mEquiv" data-disc="${disc}" data-i="${i}"><button data-act="mEquivSuppr" data-disc="${disc}" data-i="${i}">✕</button></div>`)}
          ${M.cotation[disc].mode === "couleurs" ? h`<div class="pastilles">${couleursDe(sl).filter(c => !M.cotation[disc].liste.some(x => x.salle === c.nom)).map(c => h`<button data-act="mEquivAjout" data-disc="${disc}" data-valeur="${c.nom}" class="pastille" style="background:${c.hex}" title="${c.nom}"></button>`)}</div>`
            : h`<div class="ajout"><input type="text" placeholder="Niveau affiché par la salle (ex. 5+, bleu, N3)" data-champ="nouveau-${disc}" value="${M["nouveau-" + disc] || ""}"><button data-act="mEquivAjout" data-disc="${disc}">+</button></div>`}
          <datalist id="echelle-${disc}">${data.echelles[disc].map(c => h`<option value="${c}">`)}</datalist></div>`)}`;
      return h`<h2>${M.id ? "Salle" : "Nouvelle salle"}</h2><label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom}"><label class="champ">Type</label>${choix("mChamp", ["Bloc", "Voie", "Bloc et voie"], M.typeSalle, { data: { champ: "typeSalle" } })}
      ${si(M.typeSalle !== "Bloc", modeDisc("Voie"))}${si(M.typeSalle !== "Voie", modeDisc("Bloc"))}
      ${si(M.id, () => h`<label class="champ">Couleurs propres à la salle</label><div class="pastilles">${(sl.couleurs || []).map(c => h`<span class="pastille" style="background:${c.hex}" title="${c.nom}"></span>`)}</div><div class="ajout"><input type="text" data-champ="coulNom" placeholder="Nom" value="${M.coulNom || ""}"><input type="color" data-champ="coulHex" value="${M.coulHex || "#888888"}"><button data-act="salleCouleur">+</button></div>`)}
      <div class="actions">${si(M.id, h`<button class="danger" data-act="salleSupprimer">Supprimer</button>`)}<button data-act="mFermer">Annuler</button><button class="principal" data-act="salleOk" ${M.nom ? "" : "disabled"}>Enregistrer</button></div>`; }

    case "secteur": { const sl = salleDe(doc, M.salleId), n = M.id ? sl.voies.filter(v => v.secteurId === M.id && v.statut !== "demontee").length : 0;
      return h`<h2>${M.id ? "Secteur" : "Nouveau secteur"}</h2><label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom}" placeholder="Dalle, Toit, Mur du fond…"><label class="champ">Profil habituel</label>${choixProfil("mProfil", M.profil)}
      ${si(M.id, h`<p class="petit">${n} voie${n > 1 ? "s" : ""} en place. « Renouveler » les passe toutes en démontées (l'historique reste) : à faire quand la salle rouvre le secteur.</p>`)}
      <div class="actions">${si(M.id, h`<button class="danger" data-act="secteurRenouveler">⟳ Renouveler (${n})</button><button class="danger" data-act="secteurSupprimer">Supprimer</button>`)}<button class="principal" data-act="secteurOk" ${M.nom ? "" : "disabled"}>Enregistrer</button></div>`; }

    case "voie": { const sl = salleDe(doc, M.salleId), hv = M.id ? parVoie(toutesTentatives(ctx.programme, doc)).find(x => x.voieId === M.id) : null, ts = M.id ? toutesTentatives(ctx.programme, doc).filter(t => t.voieId === M.id).slice(-8).reverse() : [];
      return h`<h2>${M.id ? "Voie de la salle" : "Nouvelle " + (M.disc === "Bloc" ? "bloc" : "voie")}</h2>
      ${si(sl.type === "Bloc et voie" && !M.id, h`${choix("mChamp", ["Bloc", "Voie"], M.disc, { data: { champ: "disc" } })}`)}
      <label class="champ">Couleur</label>${pastilles(ctx, "mCouleur", M.couleur, sl)}${cotationSalle(ctx, sl, M.disc, M)}
      <label class="champ">Profil</label>${choixProfil("mProfil", M.profil)}<label class="champ">Nom ou repère</label><input type="text" data-champ="nom" value="${M.nom || ""}">
      ${si(sl.secteurs.length, h`<label class="champ">Secteur</label>${choix("mSecteur", [["", "—"], ...sl.secteurs.map(x => [x.id, x.nom])], M.secteurId || "", { classe: "compact" })}`)}
      ${si(hv, () => h`<p class="petit"><b>Historique :</b> ${hv.essais} essai${hv.essais > 1 ? "s" : ""}, ${hv.reussies} réussi${hv.reussies > 1 ? "s" : ""}.</p><div class="petit">${ts.map(t => h`<div>${court(t.date)} · ${RES_LABEL[t.res]}${t.cause ? " · " + t.cause : ""}</div>`)}</div>`)}
      <div class="actions">${M.id ? h`<button class="danger" data-act="voieDemonter">${M.statut === "demontee" ? "Remonter" : "Démontée"}</button>` : h`<button data-act="mFermer">Annuler</button>`}<button class="principal" data-act="voieOk">Enregistrer</button></div>`; }

    case "passageAncien": return h`<h2>Passage fait sans l'app</h2><label class="champ">Date</label><input type="date" data-champ="date" value="${M.date}">
      ${choix("mChamp", ["Voie", "Bloc"], M.disc, { data: { champ: "disc" } })}<label class="champ">Cotation</label>${selecteurCot(ctx, M.disc, M.cot)}
      <label class="champ">Profil</label>${choixProfil("mProfil", M.profil)}<label class="champ">Résultat</label>${choix("mChamp", M.disc === "Bloc" ? [["ok", "✓ Réussi"], ["ko", "✗ Pas réussi"]] : [["ok", "✓ Enchaînée"], ["sec", "Avec sec"], ["ko", "✗ Pas réussie"]], M.res, { data: { champ: "res" } })}
      <label class="champ">Combien de fois ?</label>${echelle("mChamp", 8, M.n, { data: { champ: "n" } })}
      <button class="pli" data-act="mPlier" data-k="plus">${M.plus ? "▾" : "▸"} Couleur, nom, salle</button>
      ${si(M.plus, h`${pastilles(ctx, "mCouleur", M.couleur)}<input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="Nom (facultatif)">${si(doc.salles.length, choix("mChamp", [["", "—"], ...doc.salles.map(x => [x.id, x.nom])], M.salle, { data: { champ: "salle" }, classe: "compact" }))}`)}
      ${actionsBas("Ajouter", "passageAncienOk", !M.res || !M.date)}`;

    case "nouveauProgramme": return h`<h2>Nouveau programme</h2><p>Le programme a changé (${data.programmeId}). Les saisies de l'ancien programme ne lui correspondent plus.</p>
      <p class="petit">Exporte d'abord (sauvegarde complète), puis démarre : les séances de l'ancien programme sont effacées ; réglages, salles, passages hors app et favoris sont gardés.</p>
      <div class="actions"><button data-act="exporter">⬆ Exporter</button><button class="principal danger" data-act="nouveauProgrammeOk">Démarrer le nouveau programme</button></div>`;

    case "import": return h`<h2>Restaurer une sauvegarde</h2><p>Sauvegarde du ${(M.exporteLe || "").slice(0, 16).replace("T", " ")}${M.autreProgramme ? h` · <b>d'un autre programme</b>` : ""}${M.source ? ` (${M.source})` : ""}.</p>
      <p class="petit">Tout ce qui est dans l'app sera remplacé.</p><div class="actions"><button data-act="mFermer">Annuler</button><button class="principal danger" data-act="importOk">Remplacer</button></div>`;
    default: return h`<p>Fenêtre inconnue : ${M.type}</p><div class="actions"><button data-act="mFermer">Fermer</button></div>`;
  }
}

const M = ctx => ctx.state.modal;
const nettoyer = t => { Object.keys(t).forEach(k => (t[k] === undefined || t[k] === "" || t[k] === null) && delete t[k]); return t; };
export const actions = {
  ...editeur.actions,
  mFermer: ctx => { const p = ctx.state.modal && ctx.state.modal.precedent; p ? ctx.ouvrirModal(p) : ctx.fermerModal(); },
  ficheExo: (ctx, d) => ctx.ouvrirModal({ type: "ficheExo", k: d.k, precedent: ctx.state.modal }),
  mChamp: (ctx, d) => { M(ctx)[d.champ] = isNaN(d.valeur) || d.valeur === "" ? d.valeur : +d.valeur; ctx.rendre(); },
  mBascule: (ctx, d) => { const l = M(ctx).quoi, i = l.indexOf(d.k); i >= 0 ? l.splice(i, 1) : l.push(d.k); ctx.rendre(); },
  mPlier: (ctx, d) => { M(ctx)[d.k] = !M(ctx)[d.k]; ctx.rendre(); },
  mChiffre: (ctx, d) => { M(ctx).chiffre = d.valeur; M(ctx)[d.champ || "cot"] = ""; ctx.rendre(); },
  mCot: (ctx, d) => { const c = d.champ || "cot"; M(ctx)[c] = d.valeur === M(ctx)[c] ? "" : d.valeur; if (!d.valeur) M(ctx).chiffre = ""; ctx.rendre(); },
  mProfil: (ctx, d) => { M(ctx).profil = d.valeur; ctx.rendre(); },
  mSecteur: (ctx, d) => { M(ctx).secteurId = d.valeur; ctx.state.dernierSecteur = d.valeur; ctx.rendre(); },
  mCouleur: (ctx, d) => { M(ctx).couleur = M(ctx).couleur === d.valeur ? "" : d.valeur; ctx.rendre(); },
  mMode: (ctx, d) => { M(ctx).cotation[d.disc].mode = d.valeur; ctx.rendre(); },
  mEquiv: (ctx, d, el) => { M(ctx).cotation[d.disc].liste[+d.i].app = el.value.trim(); },
  mEquivSuppr: (ctx, d) => { M(ctx).cotation[d.disc].liste.splice(+d.i, 1); ctx.rendre(); },
  mEquivAjout: (ctx, d) => { const m = M(ctx), val = d.valeur || (m["nouveau-" + d.disc] || "").trim(); if (!val) return; if (!m.cotation[d.disc].liste.some(x => x.salle === val)) m.cotation[d.disc].liste.push({ salle: val, app: "" }); m["nouveau-" + d.disc] = ""; ctx.rendre(); },
  mGrille: (ctx, d) => { const m = M(ctx); m.grille[d.k] = Math.max(0, (m.grille[d.k] || 0) + +d.pas); if (!m.grille[d.k]) delete m.grille[d.k]; ctx.rendre(); },

  pasTopOk: ctx => { const m = M(ctx); ctx.modifierSeance(m.seanceId, "forme du jour", sa => { sa.recup = Object.fromEntries(["doigts", "coudes", "epaules", "energie", "motivation"].map(k => [k, m.quoi.includes(k) ? 2 : 4])); sa.douleur = { ...(sa.douleur || {}), avant: m.niveau, zoneAvant: m.niveau ? m.zone : "" }; }); ctx.fermerModal(); },
  voieRapideRes: (ctx, d) => { const m = M(ctx); m.res = d.res; if (d.res === "ok") actions.voieRapideOk(ctx, {}); else ctx.rendre(); },
  voieRapideOk: (ctx, d) => { const m = M(ctx), s = ctx.seance(m.seanceId), salle = salleDe(ctx.doc, m.salleId), v = salle.voies.find(x => x.id === m.voieId);
    const t = tentativeDe(v, salle, nettoyer({ k: cleRattachement(ctx, s, ctx.saisie(s.id), m.disc), res: m.res, sec: m.res === "sec" ? +d.sec : undefined, cause: m.res === "ko" ? d.cause : undefined, style: m.res === "ok" ? "À vue" : undefined }));
    ctx.fermerModal(); ajouterTentative(ctx, s, t); ctx.rendre(); },
  voieEditerDepuis: (ctx, d) => { const m = M(ctx), v = salleDe(ctx.doc, m.salleId).voies.find(x => x.id === d.id); ctx.ouvrirModal({ type: "voie", salleId: m.salleId, ...v, chiffre: (v.cotSalle || "")[0] || "", precedent: m }); },
  nouvelleVoieOk: (ctx, d) => { const m = M(ctx), s = ctx.seance(m.seanceId), salle = salleDe(ctx.doc, m.salleId);
    let v = voieExistante(salle, { disc: m.disc, couleur: m.couleur, cotSalle: m.cotSalle, nom: m.nom });
    if (!v) { v = nouvelleVoie(salle, { disc: m.disc, couleur: m.couleur, cotSalle: m.cotSalle, nom: m.nom, profil: m.profil, secteurId: m.secteurId || null }, ctx.aujourdhui()); ctx.modifier("voie ajoutée", doc => { salleDe(doc, m.salleId).voies.push(v); }); }
    ctx.fermerModal();
    if (d.res) ajouterTentative(ctx, s, tentativeDe(v, salleDe(ctx.doc, m.salleId), nettoyer({ k: cleRattachement(ctx, s, ctx.saisie(s.id), m.disc), res: d.res, style: d.res === "ok" ? "À vue" : undefined })));
    ctx.rendre(); },
  resultatOk: ctx => { const m = M(ctx), s = ctx.seance(m.seanceId), t = nettoyer({ t: Date.now(), k: m.k, disc: m.disc, cot: m.cot || "", cotSalle: m.cotSalle, profil: m.profil, res: m.res, sec: m.res === "sec" ? m.sec : undefined, style: m.res === "ok" ? m.style : undefined, cause: m.res === "ko" ? m.cause : undefined, couleur: m.couleur, nom: m.nom, salle: m.salle, voieId: m.voieId });
    if (m.edit !== undefined) { ctx.modifierSeance(s.id, "correction", sa => { const anc = sa.tentatives[m.edit]; sa.tentatives[m.edit] = { ...t, t: anc.t, k: anc.k, approx: anc.approx }; }); ctx.fermerModal(); }
    else { ctx.fermerModal(); ajouterTentative(ctx, s, t); } ctx.rendre(); },
  resultatSupprimer: ctx => { const m = M(ctx); ctx.modifierSeance(m.seanceId, "passage supprimé", sa => { sa.tentatives.splice(m.edit, 1); }); ctx.fermerModal(); },
  douleurOk: ctx => { const m = M(ctx); if (!m.zone) return; ctx.modifierSeance(m.seanceId, "douleur notée", sa => { sa.douleur = sa.douleur || {}; sa.douleur.pendant = sa.douleur.pendant || []; sa.douleur.pendant.push({ t: Date.now(), zone: m.zone, niveau: m.niveau }); }); ctx.fermerModal(); ctx.toast("Douleur notée"); },
  sauterOk: ctx => { const m = M(ctx); ctx.modifierSeance(m.seanceId, "séance sautée", sa => { sa.statut = "sautee"; sa.raison = m.raison; delete sa.debut; delete sa.fin; }); ctx.fermerModal(); },
  bilanOk: ctx => { const m = M(ctx); if (m.effort === "") return; ctx.modifierSeance(m.seanceId, "bilan", sa => { const now = Date.now();
      if (!sa.debut) { sa.debut = now - (+m.duree || 60) * 60000; sa.approx = true; } sa.fin = sa.fin || now; delete sa.statut; delete sa.pause;
      sa.effort = +m.effort; sa.douleur = { ...(sa.douleur || {}), apres: +m.apres || 0, zone: +m.apres ? m.zone : "" }; sa.notes = m.notes; if (m.duree !== "" && m.duree != null) sa.duree = +m.duree;
      sa.tentatives = (sa.tentatives || []).filter(t => !t.approx);
      for (const [k, n] of Object.entries(m.grille)) { const [cot, res] = k.split("|"); for (let i = 0; i < n; i++) sa.tentatives.push({ t: now, disc: m.disc, cot, profil: "", res, approx: true }); } });
    ctx.fermerModal(); ctx.rendre(true); ctx.synchroniser("fin de séance"); },
  menuBilan: ctx => { const id = M(ctx).seanceId; ctx.fermerModal(); ctx.state.seanceId = id; ACTIONS_SEANCE.bilanOuvrir(ctx, { id }); },
  menuSauter: ctx => { const id = M(ctx).seanceId; ctx.fermerModal(); ctx.state.seanceId = id; ACTIONS_SEANCE.sauterOuvrir(ctx); },
  menuEditer: ctx => { const s = ctx.seance(M(ctx).seanceId); editeur.ouvrir(ctx, { cible: s.id, contenu: s.contenu }); },
  menuDeplacer: ctx => { const s = ctx.seance(M(ctx).seanceId); ctx.ouvrirModal({ type: "deplacer", seanceId: s.id, date: s.date }); },
  menuReinit: ctx => { const id = M(ctx).seanceId; if (!confirm("Effacer toutes les saisies de cette séance ?")) return; ctx.modifier("saisies effacées", d => { delete d.seances[id]; }); ctx.fermerModal(); },
  deplacerOk: ctx => { const m = M(ctx), s = ctx.seance(m.seanceId); ctx.modifier("séance déplacée", d => { d.ops = d.ops.filter(o => !(o.op === "date" && o.cible === s.id)); if (m.date !== s.datePrevue) d.ops.push({ id: nouvelId("o"), op: "date", cible: s.id, date: m.date }); }); ctx.fermerModal(); },
  pauseOk: ctx => { const m = M(ctx); ctx.modifier("pause du programme", d => { d.ops.push({ id: nouvelId("o"), op: "pause", depuis: m.depuis, n: m.n }); }); ctx.fermerModal(); },
  mesuresOk: ctx => { const m = M(ctx); ctx.modifier("mesures", d => { d.mesures[m.semaine] = Object.fromEntries(MESURES.map(([k]) => [k, m[k]]).filter(([, v]) => v !== "" && v != null)); }); ctx.fermerModal(); },
  favori: (ctx, d) => { ctx.modifier("favori", x => { const i = x.favoris.indexOf(d.nom); i >= 0 ? x.favoris.splice(i, 1) : x.favoris.push(d.nom); }); ctx.rendre(); },
  salleOk: ctx => { const m = M(ctx); if (!m.nom) return; ctx.modifier("salle", d => { if (m.id) Object.assign(salleDe(d, m.id), { nom: m.nom, type: m.typeSalle, cotation: m.cotation }); else d.salles.push({ id: nouvelId("s"), nom: m.nom, type: m.typeSalle, couleurs: [], cotation: m.cotation, secteurs: [], voies: [] }); }); ctx.fermerModal(); },
  salleCouleur: ctx => { const m = M(ctx); if (!m.coulNom) return; ctx.modifier("couleur de salle", d => { salleDe(d, m.id).couleurs.push({ nom: m.coulNom, hex: m.coulHex || "#888888" }); }); m.coulNom = ""; ctx.rendre(); },
  salleSupprimer: ctx => { const m = M(ctx); if (!confirm("Supprimer cette salle et ses voies ?")) return; ctx.modifier("salle supprimée", d => { d.salles = d.salles.filter(x => x.id !== m.id); }); ctx.fermerModal(); ctx.ouvrir("salles"); },
  secteurOk: ctx => { const m = M(ctx); if (!m.nom) return; ctx.modifier("secteur", d => { const sl = salleDe(d, m.salleId); if (m.id) Object.assign(sl.secteurs.find(x => x.id === m.id), { nom: m.nom, profil: m.profil }); else sl.secteurs.push({ id: nouvelId("sec"), nom: m.nom, profil: m.profil || "" }); }); ctx.fermerModal(); },
  secteurRenouveler: ctx => { const m = M(ctx); if (!confirm("Passer toutes les voies de ce secteur en démontées ?")) return; let n = 0; ctx.modifier("secteur renouvelé", d => { n = renouveler(salleDe(d, m.salleId), m.id, ctx.aujourdhui()); }); ctx.fermerModal(); ctx.toast(`${n} voie${n > 1 ? "s" : ""} démontée${n > 1 ? "s" : ""}`, () => ctx.store.annuler()); },
  secteurSupprimer: ctx => { const m = M(ctx); ctx.modifier("secteur supprimé", d => { const sl = salleDe(d, m.salleId); sl.secteurs = sl.secteurs.filter(x => x.id !== m.id); sl.voies.forEach(v => { if (v.secteurId === m.id) v.secteurId = null; }); }); ctx.fermerModal(); },
  voieOk: ctx => { const m = M(ctx); ctx.modifier("voie", d => { const sl = salleDe(d, m.salleId), champs = { couleur: m.couleur || "", cotSalle: m.cotSalle || "", cot: cotApp(sl, m.disc, m.cotSalle, m.couleur), nom: m.nom || "", profil: m.profil || "Vertical", secteurId: m.secteurId || null };
      if (m.id) Object.assign(sl.voies.find(x => x.id === m.id), champs); else sl.voies.push(nouvelleVoie(sl, { disc: m.disc, ...champs }, ctx.aujourdhui())); });
    const p = m.precedent; ctx.fermerModal(); if (p && p.type !== "voieRapide") ctx.ouvrirModal(p); },
  voieDemonter: ctx => { const m = M(ctx); ctx.modifier("voie démontée", d => { const v = salleDe(d, m.salleId).voies.find(x => x.id === m.id); if (v.statut === "demontee") { v.statut = "enPlace"; v.demontee = null; } else { v.statut = "demontee"; v.demontee = ctx.aujourdhui(); } }); ctx.fermerModal(); },
  passageAncienOk: ctx => { const m = M(ctx); ctx.modifier("passages hors app", d => { for (let i = 0; i < (m.n || 1); i++) d.passagesAnciens.push(nettoyer({ id: nouvelId("pa"), date: m.date, disc: m.disc, cot: m.cot, profil: m.profil, res: m.res, couleur: m.couleur, nom: m.nom, salle: m.salle })); }); ctx.fermerModal(); ctx.toast(`${m.n || 1} passage${m.n > 1 ? "s" : ""} ajouté${m.n > 1 ? "s" : ""}`); },
  nouveauProgrammeOk: ctx => { ctx.modifier("nouveau programme", d => { d.seances = {}; d.ops = []; d.mesures = {}; d.competences = {}; d.feuxVus = {}; d.programmeId = ctx.data.programmeId; }); ctx.state.seanceId = null; ctx.fermerModal(); },
  importOk: ctx => { const m = M(ctx); ctx.store.remplacer(m.doc); ctx.state.seanceId = null; ctx.state.modal = null; ctx.ouvrir("seance"); ctx.toast("Sauvegarde restaurée"); },
};
