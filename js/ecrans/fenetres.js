// ecrans/fenetres.js — les fenêtres du bas. L'état de la fenêtre est ctx.state.modal (M) ; les champs « data-champ » l'écrivent à la frappe.
import { h, si, choix, echelle, brut, pictoProfil as dessinProfil } from "../html.js";
import { discipline, etapesSeance, nouvelId, idsAPauser, opsCopieSeance, opsCopieSemaine } from "../programme.js";
import { RES_LABEL, ajouterTentative, cleRattachement, actions as ACTIONS_SEANCE } from "./seance.js";
import { court, semaineDe, nomJour, ajouterJours } from "../dates.js";
import { salleDe, couleursDe, hexDe, texteSur, cotationDe, cotApp, nouvelleVoie, voieExistante, tentativeDe, libelleVoie, secteurDe, renouveler, profilHabituel, ranger, passagesDe, supprimerVoies, dupliquerVoie, deplacerVoieSalle, deplacerSecteur, supprimerSecteur, supprimerSalle, renommerCouleur, supprimerCouleur, voiesDeCouleur } from "../salles.js";
import { parVoie, tentatives as toutesTentatives, causePrincipale } from "../analyse.js";
import * as editeur from "./editeur.js";

export const PROFILS = ["Dalle", "Vertical", "Léger dévers", "Dévers", "Fort dévers", "Toit"];
const STYLES = ["À vue", "Flash", "Après travail"];
const CAUSES = ["Lecture", "Pieds", "Placement ou gainage", "Force", "Endurance", "Peur"];
const MESURES = [["planche", "Planche (s)"], ["course", "Course continue (min)"], ["tractions", "Tractions"], ["genou", "Genou contre le mur (cm)"], ["squat", "Squat profond (s)"], ["notes", "Notes"]];
export const choixProfil = (act, actuel) => h`<div class="choix profils">${PROFILS.map(p => h`<button data-act="${act}" data-valeur="${p}" class="${actuel === p ? "choisi" : ""}">${dessinProfil(p)}${p}</button>`)}</div>`;
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
      <div class="actions"><button data-act="mFermer">Annuler</button><button data-act="etoileFenetre" data-id="${v.id}" data-salle="${salle.id}">${v.etoile ? "★ À essayer" : "☆ À essayer"}</button><button data-act="voieEditerDepuis" data-id="${v.id}">Modifier la voie</button></div>`; }

    case "nouvelleVoie": { const salle = salleDe(doc, M.salleId), c = cotationDe(salle, M.disc);
      const apercu = { disc: M.disc, couleur: M.couleur, cotSalle: M.cotSalle, cot: cotApp(salle, M.disc, M.cotSalle, M.couleur), nom: M.nom }, existe = voieExistante(salle, apercu), pret = M.couleur || M.cotSalle || M.nom;
      return h`<h2>Nouvelle ${M.disc === "Bloc" ? "bloc" : "voie"} · ${salle.nom}</h2>
      <label class="champ">Couleur des prises</label>${pastilles(ctx, "mCouleur", M.couleur, salle)}
      ${cotationSalle(ctx, salle, M.disc, M)}
      ${si(salle.secteurs.length, h`<label class="champ">Secteur</label>${choix("mSecteur", [["", "—"], ...salle.secteurs.map(x => [x.id, x.nom])], M.secteurId, { classe: "compact" })}`)}
      <button class="pli" data-act="mPlier" data-k="plus">${M.plus ? "▾" : "▸"} Profil, nom</button>
      ${si(M.plus, h`<label class="champ">Profil</label>${choixProfil("mProfil", M.profil || profilHabituel(salle, M.secteurId))}<label class="champ">Nom ou repère</label><input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`)}
      ${si(existe, () => h`<p class="avert">Une voie identique existe déjà (${libelleVoie(existe)}) : elle sera utilisée.</p>`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button data-act="nouvelleVoieOk" data-res="" ${pret ? "" : "disabled"}>Créer</button><button class="principal" data-act="nouvelleVoieOk" data-res="ok" ${pret ? "" : "disabled"}>Créer et ✓</button><button class="principal" data-act="nouvelleVoieOk" data-res="ko" ${pret ? "" : "disabled"}>Créer et ✗</button></div>`; }

    case "resultat": { const disc = M.disc;
      const deSalle = M.voieId && salleDe(doc, M.salle);
      return h`<h2>${M.edit !== undefined ? "Corriger" : "Noter"} ${disc === "Bloc" ? "un bloc" : "une voie"}</h2>
      ${deSalle ? h`<p><span class="pastille" style="background:${hexDe(doc, M.couleur, deSalle)}"></span> <b>${libelleVoie(M)}</b> <span class="petit">· ${deSalle.nom} (pour changer la voie elle-même : sa fiche dans Salles)</span></p>`
        : h`<label class="champ">Cotation <span class="petit">(facultatif)</span></label>${selecteurCot(ctx, disc, M.cot)}${si(M.cot, h`<p class="petit">Cotation : <b>${M.cot}</b> · <button class="lien" data-act="mCot" data-valeur="" data-champ="cot">sans cotation</button></p>`)}
      <label class="champ">Profil</label>${choixProfil("mProfil", M.profil)}`}
      <label class="champ">Résultat</label>${choix("mChamp", disc === "Bloc" ? [["ok", "✓ Réussi"], ["ko", "✗ Pas réussi"]] : [["ok", "✓ Enchaînée"], ["sec", "Avec sec"], ["ko", "✗ Pas réussie"]], M.res, { data: { champ: "res" } })}
      ${si(M.res === "sec", h`<label class="champ">Nombre de « sec »</label>${echelle("mChamp", 6, M.sec, { data: { champ: "sec" } })}`)}
      ${si(M.res === "ko", h`<label class="champ">Cause</label>${choix("mChamp", CAUSES, M.cause, { data: { champ: "cause" }, classe: "compact" })}`)}
      ${si(M.res === "ok", h`<label class="champ">Style</label>${choix("mChamp", STYLES, M.style, { data: { champ: "style" } })}`)}
      ${si(!deSalle, () => h`<button class="pli" data-act="mPlier" data-k="plus">${M.plus ? "▾" : "▸"} Couleur, nom</button>
      ${si(M.plus, () => h`<label class="champ">Couleur</label>${pastilles(ctx, "mCouleur", M.couleur, salleDe(doc, M.salle))}<label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`)}`)}
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
        <button class="pli" data-act="mPlier" data-k="autresCots">${M.autresCots ? "▾" : "▸"} Une autre cotation</button>
        ${si(M.autresCots, () => h`<div class="choix compact">${cots.filter(c => !presentes.includes(c)).map(c => h`<button data-act="mGrille" data-k="${c}|ok" data-pas="1">${c}</button>`)}</div>`)}</div>`)}
      <button class="pli" data-act="mPlier" data-k="details">${M.details ? "▾" : "▸"} Heures, notes <span class="petit">${M.hDebut} → ${M.hFin}${dureeHeures(M) != null ? ` · ${dureeHeures(M)} min` : ""}</span></button>
      ${si(M.details, () => h`<div class="ed-rangee"><label class="champ">Début</label><input type="time" data-champ="hDebut" value="${M.hDebut}"><label class="champ">Fin</label><input type="time" data-champ="hFin" value="${M.hFin}"></div><label class="champ">Notes</label><textarea data-champ="notes" rows="3">${M.notes}</textarea>`)}
      ${actionsBas(sa.fin ? "Enregistrer" : "Terminer la séance", "bilanOk", M.effort === "")}`; }

    case "menu": return h`<h2>${court(s.date)} · ${s.activite}</h2><div class="menu">
      <button data-act="menuBilan">Bilan / terminer</button><button data-act="menuEditer">✎ Modifier le plan</button><button data-act="menuDeplacer">📅 Déplacer</button><button data-act="menuCopier">⧉ Copier vers une autre date</button>
      <button data-act="menuSauter">Séance sautée</button>${si(ctx.store.annulable, h`<button data-act="annuler">↶ Annuler : ${ctx.store.annulable}</button>`)}
      <button class="danger" data-act="menuReinit">Effacer les saisies de cette séance</button></div><div class="actions"><button data-act="mFermer">Fermer</button></div>`;

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

    case "ficheExo": { const x = data.exercices[+M.k]; return h`<h2>${x.nom}</h2><p class="petit">${x.categorie}${x.niveau ? " · " + x.niveau : ""}${x.discipline ? " · " + x.discipline : ""}</p>
      ${si(x.but, h`<p><b>But.</b> ${x.but}</p>`)}<ol>${x.comment.split("\n").filter(Boolean).map(l => h`<li>${l}</li>`)}</ol>
      ${si(x.erreurs, h`<p><b>Erreurs fréquentes.</b> ${x.erreurs}</p>`)}${si(x.facile, h`<p><b>Plus facile.</b> ${x.facile}</p>`)}${si(x.securite, h`<p class="securite">🛡 ${x.securite}</p>`)}
      <div class="actions"><button data-act="favori" data-nom="${x.nom}">${doc.favoris.includes(x.nom) ? "★ Favori" : "☆ Favori"}</button><button class="principal" data-act="mFermer">Fermer</button></div>`; }

    case "mesures": return h`<h2>Mesures · semaine ${M.semaine}</h2><p class="petit">Astuce : une ligne « Planche (s) {mesure planche} » dans la séance du dimanche met le champ directement dans le plan.</p>${MESURES.map(([k, l]) => h`<label class="champ">${l}</label>${k === "notes" ? h`<textarea data-champ="${k}" rows="2">${M[k] || ""}</textarea>` : h`<input type="number" inputmode="decimal" step="any" data-champ="${k}" value="${M[k] ?? ""}">`}`)}${actionsBas("Enregistrer", "mesuresOk")}`;

    case "editeur": return editeur.rendre(ctx);

    case "pause": return h`<h2>Mettre le programme en pause</h2><p class="petit">Toutes les séances à partir de la semaine ${M.depuis} sont décalées.</p>
      <label class="champ">Nombre de semaines</label>${echelle("mChamp", 4, M.n, { data: { champ: "n" } })}<p class="petit">Les séances déjà commencées, faites ou sautées restent à leur date.</p>${actionsBas("Décaler", "pauseOk")}`;

    case "salle": { const sl = M.id ? salleDe(doc, M.id) : null, nb = sl ? sl.voies.length : 0;
      const modeDisc = disc => h`<label class="champ">${disc === "Voie" ? "Voies" : "Blocs"}</label>${choix("mMode", [["standard", "Comme l'app"], ["liste", "Ses niveaux"], ["couleurs", "Par couleurs"], ["aucune", "Aucune"]], M.cotation[disc].mode, { data: { disc }, classe: "compact" })}
        ${si(M.cotation[disc].mode === "liste" || M.cotation[disc].mode === "couleurs", () => h`<div class="equiv">${M.cotation[disc].liste.map((x, i) => h`<div class="equiv-ligne"><span>${M.cotation[disc].mode === "couleurs" ? h`<span class="pastille" style="background:${hexDe(doc, x.salle, sl)}"></span> ` : ""}${x.salle}</span><input type="text" list="echelle-${disc}" placeholder="≈ app" value="${x.app || ""}" data-act="mEquiv" data-disc="${disc}" data-i="${i}"><button data-act="mEquivSuppr" data-disc="${disc}" data-i="${i}" aria-label="Retirer">✕</button></div>`)}
          ${M.cotation[disc].mode === "couleurs" ? h`<div class="pastilles">${couleursDe(sl).filter(c => !M.cotation[disc].liste.some(x => x.salle === c.nom)).map(c => h`<button data-act="mEquivAjout" data-disc="${disc}" data-valeur="${c.nom}" class="pastille" style="background:${c.hex}" title="${c.nom}"></button>`)}</div>`
            : h`<div class="ajout"><input type="text" placeholder="Niveau affiché par la salle (ex. 5+, bleu, N3)" data-champ="nouveau-${disc}" value="${M["nouveau-" + disc] || ""}"><button data-act="mEquivAjout" data-disc="${disc}">+</button></div>`}
          <datalist id="echelle-${disc}">${data.echelles[disc].map(c => h`<option value="${c}">`)}</datalist></div>`)}`;
      const resumeCot = ["Voie", "Bloc"].filter(d => M.typeSalle === "Bloc et voie" || M.typeSalle === d).map(d => `${d === "Voie" ? "voies" : "blocs"} : ${{ standard: "comme l'app", liste: "ses niveaux", couleurs: "par couleurs", aucune: "aucune" }[M.cotation[d].mode]}`).join(" · ");
      return h`<h2>${M.id ? "Modifier la salle" : "Nouvelle salle"}</h2><label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom}" placeholder="Nom de la salle">
      <label class="champ">Type</label>${choix("mChamp", ["Bloc", "Voie", "Bloc et voie"], M.typeSalle, { data: { champ: "typeSalle" } })}
      <button class="fiche-ligne" data-act="mSection" data-k="cot"><span>Façon de coter</span><span class="val">${resumeCot} ${M.section === "cot" ? "▾" : "›"}</span></button>
      ${si(M.section === "cot", () => h`<div class="fiche-contenu">${si(M.typeSalle !== "Bloc", () => modeDisc("Voie"))}${si(M.typeSalle !== "Voie", () => modeDisc("Bloc"))}</div>`)}
      ${si(M.id, () => h`<button class="fiche-ligne" data-act="mSection" data-k="coul"><span>Couleurs propres à la salle</span><span class="val">${(sl.couleurs || []).length || "aucune"} ${M.section === "coul" ? "▾" : "›"}</span></button>
        ${si(M.section === "coul", () => h`<div class="fiche-contenu">${(sl.couleurs || []).map(c => h`<div class="equiv-ligne"><input type="color" value="${c.hex}" data-act="couleurTeinte" data-nom="${c.nom}"><input type="text" value="${c.nom}" data-act="couleurNom" data-nom="${c.nom}"><button data-act="couleurSuppr" data-nom="${c.nom}" aria-label="Supprimer">✕</button></div>`)}
          <div class="ajout"><input type="text" data-champ="coulNom" placeholder="Nouvelle couleur (ex. Lilas)" value="${M.coulNom || ""}"><input type="color" data-champ="coulHex" value="${M.coulHex || "#888888"}"><button data-act="salleCouleur">+</button></div></div>`)}`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="salleOk" ${M.nom ? "" : "disabled"}>Enregistrer</button></div>
      ${si(M.id, () => h`<div class="zone-danger"><button class="danger" data-act="salleSupprimer">Supprimer la salle${nb ? ` et ses ${nb} voie${nb > 1 ? "s" : ""}` : ""}</button></div>`)}`; }

    case "secteur": { const sl = salleDe(doc, M.salleId), n = M.id ? sl.voies.filter(v => v.secteurId === M.id && v.statut !== "demontee").length : 0, i = M.id ? sl.secteurs.findIndex(x => x.id === M.id) : -1;
      return h`<h2>${M.id ? "Modifier le secteur" : "Nouveau secteur"}</h2><label class="champ">Nom</label><input type="text" data-champ="nom" value="${M.nom}" placeholder="Dalle, Toit, Mur du fond…"><label class="champ">Profil habituel</label>${choixProfil("mProfil", M.profil)}
      ${si(M.id && sl.secteurs.length > 1, () => h`<label class="champ">Place sur le mur</label><div class="ed-rangee"><button data-act="secteurBouger" data-pas="-1" ${i === 0 ? "disabled" : ""}>↑ Monter</button><button data-act="secteurBouger" data-pas="1" ${i === sl.secteurs.length - 1 ? "disabled" : ""}>↓ Descendre</button><span class="petit">${i + 1} sur ${sl.secteurs.length}</span></div>`)}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="secteurOk" ${M.nom ? "" : "disabled"}>Enregistrer</button></div>
      ${si(M.id, () => h`<div class="zone-danger"><button data-act="secteurRenouveler" ${n ? "" : "disabled"}>⟳ Renouveler : ${n} voie${n > 1 ? "s" : ""} démontée${n > 1 ? "s" : ""}</button><button class="danger" data-act="secteurSupprimer">Supprimer le secteur</button></div>`)}`; }

    case "voie": { const sl = salleDe(doc, M.salleId), hv = M.id ? parVoie(toutesTentatives(ctx.programme, doc)).find(x => x.voieId === M.id) : null, ts = M.id ? toutesTentatives(ctx.programme, doc).filter(t => t.voieId === M.id).slice(-8).reverse() : [];
      const sec = sl.secteurs.find(x => x.id === M.secteurId), cot = cotationDe(sl, M.disc), autresSalles = doc.salles.filter(x => x.id !== sl.id && (x.type === "Bloc et voie" || x.type === M.disc));
      const libCot = cot.mode === "couleurs" ? (cotApp(sl, M.disc, "", M.couleur) || "selon la couleur") : M.cotSalle || "—";
      // En création : tout est ouvert. En modification : une ligne par réglage, on n'ouvre que ce qu'on change.
      const ligne = (k, label, valeur, contenu) => M.id ? h`<button class="fiche-ligne" data-act="mSection" data-k="${k}"><span>${label}</span><span class="val">${valeur} ${M.section === k ? "▾" : "›"}</span></button>${si(M.section === k, () => h`<div class="fiche-contenu">${contenu()}</div>`)}` : h`<label class="champ">${label}</label>${contenu()}`;
      return h`${M.id ? h`<div class="fiche-tete"><span class="tuile-voie apercu" style="background:${hexDe(doc, M.couleur, sl)};color:${texteSur(hexDe(doc, M.couleur, sl))}"><b>${M.etoile ? "★ " : ""}${libelleVoie({ cotSalle: M.cotSalle, cot: cotApp(sl, M.disc, M.cotSalle, M.couleur) })}</b>${dessinProfil(M.profil, "picto-tuile")}</span>
          <div><h2>${M.disc === "Bloc" ? "Bloc" : "Voie"}${M.nom ? " · " + M.nom : ""}</h2><p class="petit">${sl.nom}${sec ? " · " + sec.nom : ""}${M.statut === "demontee" ? " · démontée" : ""}</p>
          <p class="petit">${hv ? `${hv.essais} essai${hv.essais > 1 ? "s" : ""}, ${hv.reussies} réussi${hv.reussies > 1 ? "s" : ""}` : "jamais tentée"}</p></div></div>
          ${si(M.statut === "demontee", h`<button class="gros principal" data-act="voieDemonter">Remonter cette voie</button>`)}`
        : h`<h2>Nouvelle ${M.disc === "Bloc" ? "bloc" : "voie"} · ${sl.nom}</h2>`}
      ${si(sl.type === "Bloc et voie", () => ligne("disc", "Discipline", M.disc, () => choix("mChamp", ["Voie", "Bloc"], M.disc, { data: { champ: "disc" } })))}
      ${ligne("couleur", "Couleur", M.couleur || "—", () => pastilles(ctx, "mCouleur", M.couleur, sl))}
      ${ligne("cot", "Cotation", libCot, () => cotationSalle(ctx, sl, M.disc, M))}
      ${ligne("profil", "Profil", M.profil || "—", () => choixProfil("mProfil", M.profil))}
      ${si(sl.secteurs.length, () => ligne("secteur", "Secteur", sec ? sec.nom : "sans secteur", () => choix("mSecteur", [["", "Sans secteur"], ...sl.secteurs.map(x => [x.id, x.nom])], M.secteurId || "", { classe: "compact" })))}
      ${ligne("nom", "Nom ou repère", M.nom || "—", () => h`<input type="text" data-champ="nom" value="${M.nom || ""}" placeholder="facultatif">`)}
      ${si(M.id && autresSalles.length, () => ligne("salle", "Salle", sl.nom, () => h`<p class="petit">Voie notée dans la mauvaise salle ? Déplace-la : ses passages la suivent.</p>${choix("mChamp", [[sl.id, sl.nom + " (actuelle)"], ...autresSalles.map(x => [x.id, x.nom])], M.salleCible || sl.id, { data: { champ: "salleCible" }, classe: "compact" })}`))}
      ${si(hv, () => ligne("histo", "Historique", `${ts.length} dernier${ts.length > 1 ? "s" : ""}`, () => h`<div class="petit">${ts.map(t => h`<div>${court(t.date)} · ${RES_LABEL[t.res]}${t.cause ? " · " + t.cause : ""}</div>`)}</div>`))}
      <div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="voieOk">Enregistrer</button></div>
      ${si(M.id, () => h`<div class="fiche-actions"><button data-act="mBasculeEtoile">${M.etoile ? "★ À essayer" : "☆ À essayer"}</button><button data-act="voieDupliquer">⧉ Dupliquer</button>${si(M.statut !== "demontee", h`<button data-act="voieDemonter">Démontée</button>`)}</div>
        <div class="zone-danger"><button class="danger" data-act="voieSupprimer">Supprimer la voie</button></div>`)}`; }

    case "supprimer": return h`<h2>${M.titre}</h2><p class="petit">${M.texte}</p><div class="menu">${M.choix.map((c, i) => h`<button class="${c.danger ? "danger" : ""}" data-act="supprimerChoix" data-i="${i}">${c.label}</button>`)}</div>
      <p class="petit">Tu pourras annuler juste après.</p><div class="actions"><button data-act="mFermer">Annuler</button></div>`;

    case "selection": return h`<h2>${M.titre}</h2>${M.quoi === "profil" ? choixProfil("selectionAppliquer", "") : cotationSalle(ctx, salleDe(doc, ctx.state.salleId), M.disc, M)}
      ${si(M.quoi === "cot", () => h`<div class="actions"><button data-act="mFermer">Annuler</button><button class="principal" data-act="selectionAppliquer" ${M.cotSalle || M.couleur ? "" : "disabled"}>Appliquer</button></div>`)}${si(M.quoi === "profil", h`<div class="actions"><button data-act="mFermer">Annuler</button></div>`)}`;

    case "ajoutRapide": { const sl = salleDe(doc, M.salleId), pret = M.couleur || M.cotSalle;
      return h`<h2>Ajouter plusieurs voies · ${sl.nom}</h2><p class="petit">Par exemple : 4 jaunes en 5b dans le même secteur. Elles s'ajoutent d'un coup ; la fenêtre reste ouverte pour la série suivante.</p>
      ${si(sl.type === "Bloc et voie", h`${choix("mChamp", ["Voie", "Bloc"], M.disc, { data: { champ: "disc" } })}`)}
      <label class="champ">Couleur</label>${pastilles(ctx, "mCouleur", M.couleur, sl)}${cotationSalle(ctx, sl, M.disc, M)}
      <label class="champ">Combien ?</label>${echelle("mChamp", 8, M.nb, { data: { champ: "nb" } })}
      ${si(sl.secteurs.length, h`<label class="champ">Secteur</label>${choix("mSecteur", [["", "—"], ...sl.secteurs.map(x => [x.id, x.nom])], M.secteurId, { classe: "compact" })}`)}
      <button class="pli" data-act="mPlier" data-k="plus">${M.plus ? "▾" : "▸"} Profil</button>${si(M.plus, () => choixProfil("mProfil", M.profil || profilHabituel(sl, M.secteurId)))}
      ${si(M.total, h`<p class="petit">✓ ${M.total} voie${M.total > 1 ? "s" : ""} ajoutée${M.total > 1 ? "s" : ""} depuis l'ouverture.</p>`)}
      <div class="actions"><button data-act="mFermer">Terminé</button><button class="principal" data-act="ajoutRapideOk" ${pret ? "" : "disabled"}>Ajouter ${M.nb || 1}</button></div>`; }

    case "classerSecteur": { const sl = salleDe(doc, M.salleId);
      return h`<h2>Déplacer ${ctx.state.classer.size} voie${ctx.state.classer.size > 1 ? "s" : ""} vers…</h2><div class="menu">${sl.secteurs.map(x => h`<button data-act="classerSecteurOk" data-id="${x.id}">${x.nom}</button>`)}<button data-act="classerSecteurOk" data-id="">Sans secteur</button></div>
      ${si(!sl.secteurs.length, h`<p class="petit">Aucun secteur : crée-en un avec « + Secteur ».</p>`)}<div class="actions"><button data-act="mFermer">Annuler</button></div>`; }

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
  mChamp: (ctx, d) => { const m = M(ctx); m[d.champ] = isNaN(d.valeur) || d.valeur === "" ? d.valeur : +d.valeur;
    if (d.champ === "disc") { m.cot = ""; m.cotSalle = ""; m.chiffre = ""; if (m.res === "sec" && d.valeur === "Bloc") m.res = ""; }   // autre échelle : on repart de zéro
    ctx.rendre(); },
  mBasculeEtoile: ctx => { const m = M(ctx); m.etoile = m.etoile ? "" : ctx.aujourdhui(); ctx.rendre(); },
  etoileFenetre: (ctx, d) => { ctx.modifier("voie à essayer", doc => { const v = salleDe(doc, d.salle).voies.find(x => x.id === d.id); if (v.etoile) delete v.etoile; else v.etoile = ctx.aujourdhui(); }); ctx.rendre(); },
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
    const dejaTentee = toutesTentatives(ctx.programme, ctx.doc).some(x => x.voieId === v.id);
    const t = tentativeDe(v, salle, nettoyer({ k: cleRattachement(ctx, s, ctx.saisie(s.id), m.disc), res: m.res, sec: m.res === "sec" ? +d.sec : undefined, cause: m.res === "ko" ? d.cause : undefined, style: m.res === "ok" ? (dejaTentee ? "Après travail" : "À vue") : undefined }));
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
  bilanOk: ctx => { const m = M(ctx); if (m.effort === "") return; const minutes = dureeHeures(m);
    if (!minutes) { ctx.toast("Vérifie les heures de début et de fin."); m.details = true; ctx.rendre(); return; }
    ctx.modifierSeance(m.seanceId, "bilan", sa => { const now = Date.now(), debut = new Date(`${m.jour}T${m.hDebut.padStart(5, "0")}:00`).getTime();
      if (!sa.debut) sa.approx = true;
      sa.debut = debut; sa.fin = debut + minutes * 60000; sa.duree = minutes; delete sa.pauseTotale; delete sa.statut; delete sa.pause;
      sa.effort = +m.effort; sa.douleur = { ...(sa.douleur || {}), apres: +m.apres || 0, zone: +m.apres ? m.zone : "" }; sa.notes = m.notes;
      sa.tentatives = (sa.tentatives || []).filter(t => !t.approx);
      for (const [k, n] of Object.entries(m.grille)) { const [cot, res] = k.split("|"); for (let i = 0; i < n; i++) sa.tentatives.push({ t: now, disc: m.disc, cot, profil: "", res, approx: true }); } });
    ctx.fermerModal(); ctx.rendre(true); ctx.synchroniser("fin de séance"); },
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
  favori: (ctx, d) => { ctx.modifier("favori", x => { const i = x.favoris.indexOf(d.nom); i >= 0 ? x.favoris.splice(i, 1) : x.favoris.push(d.nom); }); ctx.rendre(); },
  ajoutRapideOk: ctx => { const m = M(ctx), n = +m.nb || 1;
    ctx.modifier(`${n} voie${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""}`, d => { const sl = salleDe(d, m.salleId);
      for (let i = 0; i < n; i++) sl.voies.push(nouvelleVoie(sl, { disc: m.disc, couleur: m.couleur, cotSalle: m.cotSalle, profil: m.profil, secteurId: m.secteurId || null }, ctx.aujourdhui())); });
    m.total = (m.total || 0) + n; m.nb = 1; m.couleur = ""; m.cotSalle = ""; m.chiffre = ""; ctx.rendre(); },
  classerSecteurOk: (ctx, d) => { const ids = [...ctx.state.classer], sid = ctx.state.salleId;
    ctx.modifier("voies classées", doc => { const sl = salleDe(doc, sid); ids.forEach(id => ranger(sl, id, d.id || null, null)); });
    ctx.state.classer = null; ctx.fermerModal(); ctx.toast(`${ids.length} voie${ids.length > 1 ? "s" : ""} classée${ids.length > 1 ? "s" : ""}`, () => ctx.store.annuler()); },

  // ---------- Salles, secteurs, voies : modifier, supprimer (toujours avec « Annuler ») ----------
  mSection: (ctx, d) => { const m = M(ctx); m.section = m.section === d.k ? "" : d.k; ctx.rendre(); },
  salleOk: ctx => { const m = M(ctx); if (!m.nom) return; ctx.modifier("salle", d => { if (m.id) { const sl = salleDe(d, m.id); Object.assign(sl, { nom: m.nom, type: m.typeSalle, cotation: m.cotation });
      sl.voies.forEach(v => { v.cot = cotApp(sl, v.disc, v.cotSalle, v.couleur); }); propagerVoies(d, sl); } else d.salles.push({ id: nouvelId("s"), nom: m.nom, type: m.typeSalle, couleurs: [], cotation: m.cotation, secteurs: [], voies: [] }); }); ctx.fermerModal(); },
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
  secteurOk: ctx => { const m = M(ctx); if (!m.nom) return; ctx.modifier("secteur", d => { const sl = salleDe(d, m.salleId); if (m.id) Object.assign(sl.secteurs.find(x => x.id === m.id), { nom: m.nom, profil: m.profil }); else sl.secteurs.push({ id: nouvelId("sec"), nom: m.nom, profil: m.profil || "" }); }); ctx.fermerModal(); },
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
  voieOk: ctx => { const m = M(ctx); ctx.modifier("voie", d => { const sl = salleDe(d, m.salleId), champs = { disc: m.disc, couleur: m.couleur || "", cotSalle: m.cotSalle || "", cot: cotApp(sl, m.disc, m.cotSalle, m.couleur), nom: m.nom || "", profil: m.profil || "Vertical", secteurId: m.secteurId || null };
      if (m.id) { const v = sl.voies.find(x => x.id === m.id); Object.assign(v, champs); if (m.etoile) v.etoile = m.etoile; else delete v.etoile; propagerVoies(d, sl);
        if (m.salleCible && m.salleCible !== m.salleId) deplacerVoieSalle(d, m.salleId, m.salleCible, m.id); }
      else sl.voies.push(nouvelleVoie(sl, champs, ctx.aujourdhui())); });
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
    ctx.modifier(m.quoi === "profil" ? "profil modifié" : "cotation modifiée", doc => { const sl = salleDe(doc, sid);
      sl.voies.filter(v => ids.includes(v.id) && (m.quoi === "profil" || v.disc === m.disc)).forEach(v => { if (m.quoi === "profil") v.profil = d.valeur; else { v.cotSalle = m.cotSalle || ""; v.cot = cotApp(sl, v.disc, v.cotSalle, v.couleur); } }); propagerVoies(doc, sl); });
    ctx.state.classer = null; ctx.fermerModal(); ctx.toast(`${ids.length} voie${ids.length > 1 ? "s" : ""} modifiée${ids.length > 1 ? "s" : ""}`, () => ctx.store.annuler()); },
  passageAncienOk: ctx => { const m = M(ctx); ctx.modifier("passages hors app", d => { for (let i = 0; i < (m.n || 1); i++) d.passagesAnciens.push(nettoyer({ id: nouvelId("pa"), date: m.date, disc: m.disc, cot: m.cot, profil: m.profil, res: m.res, couleur: m.couleur, nom: m.nom, salle: m.salle })); }); ctx.fermerModal(); ctx.toast(`${m.n || 1} passage${m.n > 1 ? "s" : ""} ajouté${m.n > 1 ? "s" : ""}`); },
  nouveauProgrammeOk: ctx => { ctx.modifier("nouveau programme", d => { d.seances = {}; d.ops = []; d.mesures = {}; d.competences = {}; d.feuxVus = {}; d.programmeId = ctx.data.programmeId; }); ctx.state.seanceId = null; ctx.fermerModal(); },
  importOk: ctx => { const m = M(ctx); ctx.store.remplacer(m.doc); ctx.state.seanceId = null; ctx.state.modal = null; ctx.ouvrir("seance"); ctx.toast("Sauvegarde restaurée"); },
};
