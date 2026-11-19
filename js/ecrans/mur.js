// ecrans/mur.js — le mur d'une salle : les voies par secteur, en tuiles, rangées au doigt (glisser-déposer).
import { h, si, brut, pictoProfil, ouvert, pli, liste as listeDeroulante, forcerOuvert, ecranVide, info } from "../html.js";
import { salleDe, hexDe, texteSur, ranger, cotationDe, ordreNiveau as ordreNiv, profilHabituel, inclinaisonSecteur, passagesDe, supprimerVoies, couleursDe, cotApp } from "../salles.js";
import { parVoie, tentatives as toutesTentatives, reussi, rang, marqueVoie } from "../analyse.js";
import { court } from "../dates.js";

export function rendre(ctx) {
  const { doc, state } = ctx, s = salleDe(doc, state.salleId); if (!s) return { html: h`<p class="carte">Salle introuvable.</p>`, titre: "Salle" };
  // Filtres propres à chaque salle : en changeant de salle, on repart de zéro ; une salle d'un seul type n'a pas de filtre Voies/Blocs
  if (state.filtre.salleDesFiltres !== s.id) { Object.assign(state.filtre, { salleDesFiltres: s.id, mur: "", carac: "", etat: "", demontees: false, cotMur: null }); }
  if (s.type !== "Bloc et voie") state.filtre.mur = "";
  const filtre = state.filtre.mur || "", demontees = !!state.filtre.demontees, voies = parVoie(toutesTentatives(ctx.programme, doc));
  // État d'une voie d'après tes passages : réussie (✓), projet (essayée, pas encore réussie : ✗), jamais essayée
  const etatDe = v => { const hv = voies.find(x => x.voieId === v.id); return !hv || !hv.essais ? "jamais" : hv.reussies ? "reussie" : "projet"; }, fEtat = state.filtre.etat || "";
  const fCot = state.filtre.cotMur && state.filtre.cotMur.salle === s.id ? state.filtre.cotMur : null, fCarac = state.filtre.carac || "", caracsPresentes = [...new Set(s.voies.flatMap(v => v.carac || []))].sort();
  const liste = s.voies.filter(v => (demontees ? v.statut === "demontee" : v.statut !== "demontee") && (!filtre || v.disc === filtre) && (!fCarac || (v.carac || []).includes(fCarac)) && (!fCot || niveauDe(s, v) === fCot.cot && v.disc === fCot.disc) && (!fEtat || etatDe(v) === fEtat)).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const groupes = [...s.secteurs.map(sec => ({ id: sec.id, nom: sec.nom, profil: inclinaisonSecteur(s, sec.id), voies: liste.filter(v => v.secteurId === sec.id) })), { id: "", nom: "Sans secteur", profil: "", voies: liste.filter(v => !v.secteurId || !s.secteurs.some(x => x.id === v.secteurId)) }];
  const classer = state.classer, ranger = state.ranger;
  const tuile = v => { const hv = voies.find(x => x.voieId === v.id), hex = hexDe(doc, v.couleur, s);
    return h`<div class="tuile-voie glissable ${hex === "transparent" ? "sans-couleur" : ""} ${classer && classer.has(v.id) ? "selectionnee" : ""}" draggable="false" data-id="${v.id}" data-act="${classer ? "classerBascule" : "voieEditer"}" style="background:${hex};color:${texteSur(hex)}"><b>${v.etoile ? "★ " : ""}${v.cotSalle || v.cot || "?"}</b>${v.cotSalle && v.cot && String(v.cotSalle) !== String(v.cot) ? h`<small class="tuile-eq">≈ ${v.cot}</small>` : ""}${pictoProfil(v.profil, "picto-tuile")}<span>${v.nom || (v.profil && v.profil !== inclinaisonSecteur(s, v.secteurId || null) ? v.profil.toLowerCase() : "")}</span>${(m => m ? h`<span class="marque ${m.cls}" aria-label="${m.label}">${m.txt}</span>` : "")(marqueVoie(voies.find(x => x.voieId === v.id)))}${si(v.statut === "demontee", h`<span class="tuile-histo">démontée ${v.demontee ? court(v.demontee) : ""}</span>`)}</div>`; };
  if (classer) { const n = classer.size;
    const dis = n ? "" : "disabled", cotable = ["standard", "liste"].includes(cotationDe(s, filtre || (s.type === "Bloc" ? "Bloc" : "Voie")).mode);
    return { titre: h`<b>${s.nom}</b>`, infos: "Sélection", html: h`<p class="petit">Touche les ${motSalle(s)} à modifier ou supprimer ensemble.</p>
      ${groupes.filter(g => g.voies.length).map(g => h`<div class="secteur"><div class="secteur-tete"><b>${g.nom}</b><span class="ed-outils"><button data-act="selectionSecteurTout" data-secteur="${g.id}">Tout</button></span></div><div class="tuiles">${g.voies.map(tuile)}</div></div>`)}
      <div class="barre-classer"><div class="barre-haut"><span><b>${n}</b> sélectionnée${n > 1 ? "s" : ""}</span><button class="principal" data-act="classerFin">Terminé</button></div>
        <div class="barre-actions"><button data-act="classerSecteur" ${dis}>Secteur</button><button data-act="selectionProfil" ${dis}>Inclinaison</button>${si(cotable, h`<button data-act="selectionCot" ${dis}>Cotation</button>`)}<button data-act="classerDemonter" ${dis}>${demontees ? "Remonter" : "Démonter"}</button><button class="danger" data-act="selectionSupprimer" ${dis}>Supprimer</button></div></div>` }; }
  const discDefaut = filtre || (s.type === "Bloc" ? "Bloc" : "Voie"), tout = ranger;
  const filtreActif = !!(fCot || fCarac || filtre || fEtat || demontees);              // un filtre : seuls les secteurs qui ont quelque chose à montrer           // en mode Ranger, tous les secteurs sont ouverts (on dépose partout)
  // Résumé d'un secteur replié : nombre, couleurs présentes, étendue des cotations
  // Résumé d'un secteur, sur la ligne de son nom : « 7 blocs · 1 → 9 » (plage dans l'ordre des niveaux de la salle)
  const resume = g => { const n = v => cotationDe(s, v.disc).mode === "couleurs" ? "" : String(v.cotSalle || v.cot || ""), tri = g.voies.filter(n).sort((a, b) => ordreNiveau(ctx, s, a.disc, n(a)) - ordreNiveau(ctx, s, b.disc, n(b)));
    const lo = tri[0], hi = tri[tri.length - 1], et = !lo ? "" : n(lo) === n(hi) ? n(lo) : `${n(lo)} → ${n(hi)}`;
    return h`<span class="petit sect-resume">${compteVoies(g.voies, s)}${et ? " · " + et : ""}</span>`; };
  // En bref : combien de voies (et de blocs) par cotation, en un coup d'œil ; toucher une cotation filtre le mur
  const enPlace = s.voies.filter(v => v.statut !== "demontee"), nDem = s.voies.length - enPlace.length;
  // En bref : un bâtonnet par niveau, hauteur = nombre de voies ; couleur du niveau (salle par couleurs) ou couleur de prises la plus présente
  const recap = pli(`recap-${s.id}`, true, "En bref", () => h`${["Voie", "Bloc"].map(disc => { const l = enPlace.filter(v => v.disc === disc); if (!l.length) return "";
      const c = cotationDe(s, disc), G = {}; l.forEach(v => { const k = niveauDe(s, v); (G[k] = G[k] || []).push(v); });
      const ordre = Object.keys(G).sort((a, b) => ordreNiveau(ctx, s, disc, a) - ordreNiveau(ctx, s, disc, b) || (a < b ? -1 : 1)), max = Math.max(...ordre.map(k => G[k].length));
      const teinte = k => { if (c.mode === "couleurs") return hexDe(doc, k, s); const n = {}; G[k].forEach(v => v.couleur && (n[v.couleur] = (n[v.couleur] || 0) + 1)); const top = Object.entries(n).sort((a, b) => b[1] - a[1])[0]; return top ? hexDe(doc, top[0], s) : "#9aa5ab"; };
      const mot = n => disc === "Bloc" ? (n > 1 ? "blocs" : "bloc") : (n > 1 ? "voies" : "voie"), nom = k => c.mode === "couleurs" ? k.toLowerCase() : k;
      const E = l => ({ reussie: l.filter(v => etatDe(v) === "reussie").length, projet: l.filter(v => etatDe(v) === "projet").length, jamais: l.filter(v => etatDe(v) === "jamais").length }), T = E(l);
      return h`<div class="recap-disc"><b>${disc === "Bloc" ? "Blocs" : "Voies"} · ${l.length}</b>
        <p class="compte-etats"><span class="ce ok ${T.reussie ? "" : "zero"}">✓ ${T.reussie} réussi${disc === "Bloc" ? "" : "e"}${T.reussie > 1 ? "s" : ""}</span><span class="ce ko ${T.projet ? "" : "zero"}">✗ ${T.projet} projet${T.projet > 1 ? "s" : ""}</span><span class="ce jamais">${T.jamais} jamais essayé${disc === "Bloc" ? "" : "e"}${T.jamais > 1 ? "s" : ""}</span></p>
        <div class="batons">${ordre.map(k => { const actif = fCot && fCot.disc === disc && fCot.cot === k, e = E(G[k]), H = Math.round(8 + 64 * G[k].length / max), part = n => Math.round(H * n / G[k].length);
        return h`<button class="baton ${actif ? "choisi" : ""}" data-act="filtreCotMur" data-disc="${disc}" data-valeur="${k}" aria-label="Niveau ${nom(k)} : ${G[k].length} ${mot(G[k].length)}, ${e.reussie} réussis, ${e.projet} projets"><span class="baton-n">${G[k].length}</span>
          <span class="baton-barre empile" style="height:${H}px;--c:${teinte(k)}">${si(e.jamais, h`<i class="seg jamais" style="flex:${e.jamais}"></i>`)}${si(e.projet, h`<i class="seg projet" style="flex:${e.projet}"></i>`)}${si(e.reussie, h`<i class="seg reussie" style="flex:${e.reussie}"></i>`)}</span><span class="baton-niv">${c.mode === "couleurs" ? "" : k}${c.mode === "liste" && cotApp(s, disc, k) && cotApp(s, disc, k) !== k ? h`<small>≈${cotApp(s, disc, k)}</small>` : ""}</span></button>`; })}</div></div>`; })}
    <p class="legende-etats"><span><i class="seg reussie"></i> réussis</span><span><i class="seg projet"></i> projets</span><span><i class="seg jamais"></i> jamais essayés</span></p>
    ${si(fCot, () => h`<p class="recap-filtre">Niv ${cotationDe(s, fCot.disc).mode === "couleurs" ? fCot.cot.toLowerCase() : fCot.cot} : ${(n => `${n} ${motVoie(fCot.disc, n)}`)(enPlace.filter(v => v.disc === fCot.disc && niveauDe(s, v) === fCot.cot).length)} <button class="lien" data-act="filtreCotMur" data-disc="${fCot.disc}" data-valeur="${fCot.cot}">✕ tout afficher</button></p>`)}
    <p class="petit">${s.secteurs.length} secteur${s.secteurs.length > 1 ? "s" : ""}${nDem ? ` · ${nDem} démontée${nDem > 1 ? "s" : ""}` : ""} · touche un bâton pour ne voir que ce niveau</p>`,
    { resume: compteVoies(enPlace, s), classe: "carte recap-salle" });
  const nE = e => s.voies.filter(v => v.statut !== "demontee" && etatDe(v) === e).length;
  // L'échelle de la salle : ses niveaux et leur équivalent dans l'échelle de l'app (officielle)
  const echelle = ["Voie", "Bloc"].filter(d => s.type === "Bloc et voie" || s.type === d).map(d => { const c = cotationDe(s, d);
    return h`<div class="echelle-disc"><b>${d}</b>${c.mode === "liste" && c.liste.length ? h`<table class="tableau echelle"><tr><th>${s.nom}</th><th>≈ échelle de l'app</th></tr>${c.liste.map(x => h`<tr><td><b>${x.salle}</b></td><td>${x.app || "—"}</td></tr>`)}</table>`
      : c.mode === "couleurs" ? h`<table class="tableau echelle"><tr><th>Couleur</th><th>≈ échelle de l'app</th></tr>${c.liste.map(x => h`<tr><td><span class="pastille" style="background:${hexDe(doc, x.salle, s)}"></span> ${x.salle}</td><td>${x.app || "—"}</td></tr>`)}</table>`
      : h`<p class="petit">${c.mode === "aucune" ? "Pas de cotation dans cette salle." : "Échelle officielle : la même que l'app."}</p>`}</div>`; });
  const blocEchelle = pli(`echelle-${s.id}`, false, "Échelle de la salle", () => h`${echelle}<p class="petit">À modifier dans Options › Modifier la salle. Partout dans l'app, une cotation s'écrit « salle · ≈ app ».</p>`, { classe: "carte", resume: "équivalences" });
  const html = h`${si(!ranger && !demontees && enPlace.length, () => recap)}${si(!ranger && !demontees, () => blocEchelle)}<div class="barre-mur">
      ${si(!demontees && !ranger, h`<button class="petit-btn btn-ajout" data-act="voieNouvelle" data-secteur="${s.secteurs.some(x => x.id === state.dernierSecteur) ? state.dernierSecteur : ""}" data-disc="${discDefaut}">+ ${discDefaut === "Bloc" ? "Bloc" : "Voie"}</button>`)}
      ${si(!demontees, h`<button class="petit-btn btn-ajout" data-act="secteurNouveau">+ Secteur</button>`)}</div>
    ${si(s.voies.length && !ranger, () => h`<div class="barre-filtres">
      ${si(s.type === "Bloc et voie", () => h`<div class="segment segment-filtre">${[["", "Tout"], ["Voie", "Voies"], ["Bloc", "Blocs"]].map(([v, l]) => h`<button data-act="filtreMurSeg" data-valeur="${v}" class="${(filtre || "") === v ? "choisi" : ""}">${l}</button>`)}</div>`)}
      ${si(!demontees, () => listeDeroulante("etat-mur", [["reussie", `✓ Réussi${s.type === "Bloc" ? "s" : "es"} (${nE("reussie")})`], ["projet", `✗ Projets (${nE("projet")})`], ["jamais", `Jamais essayé${s.type === "Bloc" ? "s" : "es"} (${nE("jamais")})`]], fEtat, { act: "filtreEtat", vide: "Tous les états" }))}
      ${si(caracsPresentes.length, () => listeDeroulante("carac", caracsPresentes, fCarac, { act: "filtreCarac", vide: "Toutes caractéristiques" }))}</div>`)}
    ${(() => { const f = [filtre && [filtre === "Bloc" ? "Blocs" : "Voies", "filtreMur", { valeur: "" }], fEtat && [{ reussie: "✓ Réussis", projet: "✗ Projets", jamais: "Jamais essayés" }[fEtat], "filtreEtat", { valeur: "" }], fCot && [`Niv ${fCot.cot}`, "filtreCotMur", { disc: fCot.disc, valeur: fCot.cot }], fCarac && [fCarac, "filtreCaracRetirer", {}], demontees && ["Démontées", "filtreDemontees", {}]].filter(Boolean);
      return f.length ? h`<div class="filtres-actifs"><span class="petit">Filtre :</span>${f.map(([l, act, d]) => h`<button class="etiquette-filtre" data-act="${act}" ${brutData(d)}>${l} ✕</button>`)}</div>` : ""; })()}
    ${groupes.filter(g => g.voies.length || (!filtreActif && g.id)).map(g => { const cle = `sec-${s.id}-${g.id}`, o = tout || ouvert(cle, false);
      return h`<div class="secteur ${o ? "ouvert" : "replie"}" data-secteur="${g.id}"><div class="secteur-tete">
        <button class="secteur-plier" data-act="replier" data-cle="${cle}" data-defaut="" ${brut(g.id ? `data-appui="secteurEditer" data-id="${g.id}"` : "")} aria-expanded="${o ? "true" : "false"}"><span class="pli-fleche">${o ? "▾" : "▸"}</span><span class="sect-nom"><b>${g.nom}</b>${g.profil ? h` <span class="petit">${g.profil.toLowerCase()}</span>` : ""}</span>${resume(g)}</button>
        <span class="ed-outils">${si(g.id, h`<button data-act="secteurEditer" data-id="${g.id}" aria-label="Modifier le secteur">✎</button>`)}${si(!demontees, h`<button class="btn-ajout rond" data-act="voieNouvelle" data-secteur="${g.id}" data-disc="${discDefaut}" aria-label="Ajouter dans ${g.nom}">+</button>`)}</span></div>
        ${si(o, () => h`<div class="tuiles zone-depot" data-secteur="${g.id}">${g.voies.map(tuile)}${si(!g.voies.length, h`<span class="petit depot-vide">${ranger ? "déposer ici" : s.type === "Bloc" ? "aucun bloc" : "aucune voie"}</span>`)}</div>`)}</div>`; })}
    ${si(filtreActif && !liste.length && s.voies.length, () => ecranVide("prise", `${s.type === "Bloc" ? "Aucun bloc" : "Aucune voie"} avec ces filtres.`, h`<button class="petit-btn" data-act="filtresMurRaz">Retirer les filtres</button>`))}
    ${si(!s.voies.length, () => ecranVide("prise", `Aucun${s.type === "Bloc" ? " bloc" : "e voie"} pour l'instant. Ajoute-les avec « + ${discDefaut === "Bloc" ? "Bloc" : "Voie"} », ou directement pendant une séance.`, h`<button class="gros principal" data-act="inventaireOuvrir">Inventaire rapide : combien de ${motSalle(s)} par niveau ?</button>`))}
    ${si(!ranger && s.voies.length, () => h`<p class="petit">Touche ${s.type === "Bloc" ? "un bloc" : "une voie"} pour sa fiche ; garde le doigt dessus pour ${s.type === "Bloc" ? "le" : "la"} déplacer. ${info("murAide")}</p>`)}`;
  document.body.classList.toggle("mode-ranger", !!ranger);
  return { html, titre: h`<b>${s.nom}</b>` };            // une seule ligne de titre (la cotation est dans « Échelle de la salle »)
}

// Les mots selon ce qu'on compte : « 3 voies · 2 blocs », « 7 blocs » dans une salle de blocs
export const motVoie = (disc, n) => disc === "Bloc" ? (n > 1 ? "blocs" : "bloc") : (n > 1 ? "voies" : "voie");
const compteVoies = (l, s) => { const v = l.filter(x => x.disc !== "Bloc").length, b = l.length - v;
  if (!l.length) return `0 ${motVoie(s.type === "Bloc" ? "Bloc" : "Voie", 0)}`; return [v && `${v} ${motVoie("Voie", v)}`, b && `${b} ${motVoie("Bloc", b)}`].filter(Boolean).join(" · "); };
const motSalle = (s, n = 2) => motVoie(s.type === "Bloc" ? "Bloc" : "Voie", n);
// Un filtre choisi : les secteurs s'ouvrent, pour voir tout de suite ce qu'il reste
const ouvrirTout = ctx => { const sl = ctx.doc.salles.find(x => x.id === ctx.state.salleId); if (sl) for (const sec of [...sl.secteurs.map(x => x.id), ""]) forcerOuvert(`sec-${sl.id}-${sec}`); };
const brutData = d => brut(Object.entries(d).map(([k, v]) => `data-${k}="${String(v).replace(/"/g, "&quot;")}"`).join(" "));
// Niveau d'une voie tel que la salle l'affiche (la couleur, pour une salle qui cote par couleurs) et son rang
const niveauDe = (s, v) => String(cotationDe(s, v.disc).mode === "couleurs" ? v.couleur || "?" : v.cotSalle || v.cot || "?");
const ordreNiveau = (ctx, s, disc, k) => ordreNiv(ctx.data.echelles, s, disc, k);

// --- Glisser-déposer, comme les apps de l'iPhone : appui long (½ s) sur une tuile → elle se soulève et suit le doigt ;
// dépôt sur une tuile (avant elle), dans un secteur ouvert ou sur le nom d'un secteur replié (à la fin). Un appui court ouvre la fiche. ---
let installe = false;
export function apresRendu(ctx) {
  const racine = document.getElementById("ecran"); if (ctx.state.vue !== "salle" || !racine || installe) return; installe = true;
  let actif = null, fantome = null, attente = null, depart = null, defile = null, dernier = null, ignorerClic = false;
  const arreterDefile = () => { if (defile) { cancelAnimationFrame(defile); defile = null; } };
  const nettoyer = () => { clearTimeout(attente); attente = null; arreterDefile(); if (fantome) fantome.remove(); fantome = null;
    racine.querySelectorAll(".depot-cible, .en-glisse, .souleve").forEach(x => x.classList.remove("depot-cible", "en-glisse", "souleve")); actif = null; document.body.classList.remove("glisse-en-cours"); };
  const cibleSous = (x, y) => { if (fantome) fantome.style.display = "none"; const el = document.elementFromPoint(x, y); if (fantome) fantome.style.display = ""; if (!el) return null;
    const tuile = el.closest(".tuile-voie.glissable"), zone = el.closest(".zone-depot"), sec = el.closest(".secteur[data-secteur]");
    return tuile && tuile !== actif ? { tuile, zone: tuile.closest(".zone-depot") } : zone ? { tuile: null, zone } : sec ? { tuile: null, zone: sec } : null; };
  const placer = (x, y) => { if (fantome) { fantome.style.left = (x - fantome.offsetWidth / 2) + "px"; fantome.style.top = (y - fantome.offsetHeight / 2 - 20) + "px"; } };
  const marquer = (x, y) => { racine.querySelectorAll(".depot-cible").forEach(z => z.classList.remove("depot-cible")); const c = cibleSous(x, y); if (c) (c.tuile || c.zone).classList.add("depot-cible"); };
  // Près du haut ou du bas de l'écran, la page défile toute seule (pour atteindre les autres secteurs)
  const boucleDefile = () => { if (!actif || !dernier) { defile = null; return; } const m = 90, y = dernier.y, H = window.innerHeight;
    const v = y < m + 60 ? -Math.ceil((m + 60 - y) / 6) : y > H - m ? Math.ceil((y - (H - m)) / 6) : 0;
    if (v) { window.scrollBy(0, v); marquer(dernier.x, dernier.y); } defile = requestAnimationFrame(boucleDefile); };
  const soulever = t => { actif = t; t.classList.add("en-glisse"); document.body.classList.add("glisse-en-cours"); if (navigator.vibrate) navigator.vibrate(20);
    fantome = t.cloneNode(true); fantome.classList.add("fantome"); fantome.style.width = t.offsetWidth + "px"; document.body.appendChild(fantome); placer(depart.x, depart.y);
    defile = requestAnimationFrame(boucleDefile); };
  // le clic à ignorer est celui qui suit l'appui long ; un nouveau geste repart de zéro (après un glisser, aucun clic ne suit)
  document.addEventListener("pointerdown", () => { ignorerClic = false; }, true);
  racine.addEventListener("pointerdown", e => { if (e.button > 0 || ctx.state.vue !== "salle" || ctx.state.classer || ctx.state.filtre.demontees) return;
    const t = e.target.closest(".tuile-voie.glissable"); if (!t) return;
    depart = { x: e.clientX, y: e.clientY }; dernier = depart; t.classList.add("souleve");
    attente = setTimeout(() => { attente = null; ignorerClic = true; soulever(t); }, 450); });
  racine.addEventListener("pointermove", e => { dernier = { x: e.clientX, y: e.clientY };
    if (attente && (Math.abs(e.clientX - depart.x) > 8 || Math.abs(e.clientY - depart.y) > 8)) { nettoyer(); return; }          // le doigt bouge avant ½ s : c'est un défilement
    if (!actif) return; e.preventDefault(); placer(e.clientX, e.clientY); marquer(e.clientX, e.clientY); });
  // Pendant un déplacement, la page ne défile pas sous le doigt (iPhone : il faut bloquer « touchmove »)
  document.addEventListener("touchmove", e => { if (actif) e.preventDefault(); }, { passive: false });
  const lacher = e => { if (attente) { nettoyer(); return; } if (!actif) return; const c = cibleSous(e.clientX, e.clientY), id = actif.dataset.id; nettoyer();
    if (!c) return; const secteurId = c.zone.dataset.secteur || null, avantId = c.tuile ? c.tuile.dataset.id : null;
    const avant = (salleDe(ctx.doc, ctx.state.salleId).voies.find(v => v.id === id) || {}).secteurId || null, sec = salleDe(ctx.doc, ctx.state.salleId).secteurs.find(x => x.id === secteurId);
    ctx.modifier("voie déplacée", d => { ranger(salleDe(d, ctx.state.salleId), id, secteurId, avantId); }); ctx.toast(avant !== secteurId ? `Déplacée dans ${sec ? sec.nom : "Sans secteur"}` : "Voie déplacée", () => ctx.store.annuler()); ctx.rendre(); };
  racine.addEventListener("pointerup", lacher); racine.addEventListener("pointercancel", () => { if (!actif) nettoyer(); });
  racine.addEventListener("contextmenu", e => { if (e.target.closest(".tuile-voie.glissable")) e.preventDefault(); });
  // Après un appui long, le relâchement ne doit pas ouvrir la fiche
  racine.addEventListener("click", e => { if (ignorerClic) { ignorerClic = false; e.stopPropagation(); e.preventDefault(); } }, true);
}

// ⋯ de l'en-tête sur le mur
export function menuEcran(ctx) { const s = salleDe(ctx.doc, ctx.state.salleId); if (!s) return null; const dem = !!ctx.state.filtre.demontees;
  return { titre: s.nom, items: [
    ...(dem ? [] : [{ label: `+ Ajouter plusieurs ${motSalle(s)}…`, act: "ajoutPlusieursOuvrir" }]),
    { label: `Sélectionner plusieurs ${motSalle(s)}`, act: "classerDebut" },
    { label: dem ? `Voir les ${motSalle(s)} en place` : `Voir les ${motSalle(s)} démonté${s.type === "Bloc" ? "s" : "es"}`, act: "filtreDemontees" }, { label: "✎ Modifier la salle", act: "salleEditer" }] }; }

export const actions = {
  // Un seul point d'entrée pour l'ajout en série : par niveau (inventaire) ou une par une (couleur, cote)
  ajoutPlusieursOuvrir: ctx => { const s = salleDe(ctx.doc, ctx.state.salleId); if (!s) return;
    ctx.ouvrirModal({ type: "menuEcran", titre: `Ajouter plusieurs ${motSalle(s)}`, items: [{ label: `Par niveau : combien de ${motSalle(s)} en 4, en 5…`, act: "inventaireOuvrir" }, { label: `Une par une : couleur et cotation de chaque ${s.type === "Bloc" ? "bloc" : "voie"}`, act: "ajoutRapideOuvrir" }] }); },
  rangerBascule: ctx => { ctx.state.ranger = !ctx.state.ranger; ctx.rendre(); },
  classerDebut: ctx => { ctx.state.ranger = false; ctx.state.classer = new Set(); ctx.rendre(); },
  classerFin: ctx => { ctx.state.classer = null; ctx.rendre(); },
  selectionSecteurTout: (ctx, d) => { const s = salleDe(ctx.doc, ctx.state.salleId), dem = !!ctx.state.filtre.demontees, f = ctx.state.filtre.mur || "";
    const ids = s.voies.filter(v => (v.secteurId || "") === d.secteur && (dem ? v.statut === "demontee" : v.statut !== "demontee") && (!f || v.disc === f)).map(v => v.id), c = ctx.state.classer;
    if (ids.every(id => c.has(id))) ids.forEach(id => c.delete(id)); else ids.forEach(id => c.add(id)); ctx.rendre(); },
  selectionProfil: ctx => ctx.ouvrirModal({ type: "selection", quoi: "profil", titre: `Inclinaison de ${ctx.state.classer.size} voie${ctx.state.classer.size > 1 ? "s" : ""}` }),
  selectionCot: ctx => { const s = salleDe(ctx.doc, ctx.state.salleId), disc = ctx.state.filtre.mur || (s.type === "Bloc" ? "Bloc" : "Voie");
    ctx.ouvrirModal({ type: "selection", quoi: "cot", disc, cotSalle: "", chiffre: "", titre: `Cotation de ${ctx.state.classer.size} ${disc === "Bloc" ? "bloc" : "voie"}${ctx.state.classer.size > 1 ? "s" : ""}` }); },
  selectionSupprimer: ctx => { const ids = [...ctx.state.classer], sid = ctx.state.salleId, p = passagesDe(ctx.doc, ids), n = ids.length, s = x => x > 1 ? "s" : "";
    const faire = passages => { ctx.modifier(`${n} voie${s(n)} supprimée${s(n)}`, d => supprimerVoies(d, salleDe(d, sid), ids, passages)); ctx.state.classer = null; ctx.state.modal = null; ctx.rendre();
      ctx.toast(`${n} voie${s(n)} supprimée${s(n)}${p ? (passages === "garder" ? ` ; ${p} passage${s(p)} gardé${s(p)}` : ` avec ${p} passage${s(p)}`) : ""}`, () => ctx.store.annuler()); };
    if (!p) return faire("garder");
    ctx.ouvrirModal({ type: "supprimer", titre: `Supprimer ${n} voie${s(n)}`, texte: `${p} passage${s(p)} noté${s(p)} sur ces voies.`,
      choix: [{ label: `Supprimer les voies, garder les ${p} passage${s(p)}`, faire: () => faire("garder") }, { label: `Supprimer les voies et les ${p} passage${s(p)}`, danger: true, faire: () => faire("supprimer") }] }); },
  classerBascule: (ctx, d) => { const c = ctx.state.classer; c.has(d.id) ? c.delete(d.id) : c.add(d.id); ctx.rendre(); },
  classerSecteur: ctx => ctx.ouvrirModal({ type: "classerSecteur", salleId: ctx.state.salleId }),
  classerDemonter: ctx => { const ids = [...ctx.state.classer], demontees = !!ctx.state.filtre.demontees;
    ctx.modifier(demontees ? "voies remontées" : "voies démontées", d => { salleDe(d, ctx.state.salleId).voies.filter(v => ids.includes(v.id)).forEach(v => { if (demontees) { v.statut = "enPlace"; v.demontee = null; } else { v.statut = "demontee"; v.demontee = ctx.aujourdhui(); } }); });
    ctx.state.classer = null; ctx.toast(`${ids.length} voie${ids.length > 1 ? "s" : ""} ${demontees ? "remontée" : "démontée"}${ids.length > 1 ? "s" : ""}`, () => ctx.store.annuler()); ctx.rendre(); },
  ajoutRapideOuvrir: ctx => { const s = salleDe(ctx.doc, ctx.state.salleId), disc = ctx.state.filtre.mur || (s.type === "Bloc" ? "Bloc" : "Voie");
    ctx.ouvrirModal({ type: "ajoutRapide", salleId: s.id, disc, couleur: "", cotSalle: "", chiffre: "", nb: 1, secteurId: ctx.state.dernierSecteur || "", profil: "", total: 0 }); },
  filtreCotMur: (ctx, d) => { const f = ctx.state.filtre, id = ctx.state.salleId;
    f.cotMur = f.cotMur && f.cotMur.salle === id && f.cotMur.cot === d.valeur && f.cotMur.disc === d.disc ? null : { salle: id, disc: d.disc, cot: d.valeur };
    if (f.cotMur) { f.mur = ""; f.carac = ""; f.demontees = false;                      // les autres filtres ne doivent pas cacher le niveau touché
      for (const sec of [...(ctx.doc.salles.find(x => x.id === id) || { secteurs: [] }).secteurs.map(x => x.id), ""]) forcerOuvert(`sec-${id}-${sec}`); }
    ctx.rendre();
    if (f.cotMur) setTimeout(() => { const t = document.querySelector("#ecran .tuile-voie"); if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" }); }, 50); },
  inventaireOuvrir: ctx => { const s = salleDe(ctx.doc, ctx.state.salleId), disc = ctx.state.filtre.mur || (s.type === "Bloc" ? "Bloc" : "Voie");
    ctx.ouvrirModal({ type: "inventaire", salleId: s.id, disc, secteurId: s.secteurs.some(x => x.id === ctx.state.dernierSecteur) ? ctx.state.dernierSecteur : "", comptes: {}, couleur: "" }); },
  filtreCaracRetirer: ctx => { ctx.state.filtre.carac = ""; ctx.rendre(); },
  filtreMur: (ctx, d) => { ctx.state.filtre.mur = d.valeur; ctx.rendre(); },
  filtresMurRaz: ctx => { Object.assign(ctx.state.filtre, { mur: "", carac: "", etat: "", cotMur: null, demontees: false }); ctx.rendre(); },
  filtreMurSeg: (ctx, d) => { ctx.state.filtre.mur = d.valeur || ""; ouvrirTout(ctx); ctx.rendre(); },
  filtreMurListe: (ctx, d, el) => { ctx.state.filtre.mur = el.value; ouvrirTout(ctx); ctx.rendre(); },
  filtreEtat: (ctx, d, el) => { ctx.state.filtre.etat = el ? el.value : d.valeur || ""; if (ctx.state.filtre.etat) ouvrirTout(ctx); ctx.rendre(); },
  filtreCarac: (ctx, d, el) => { ctx.state.filtre.carac = el.value; if (el.value) for (const sec of [...(ctx.doc.salles.find(x => x.id === ctx.state.salleId) || { secteurs: [] }).secteurs.map(x => x.id), ""]) forcerOuvert(`sec-${ctx.state.salleId}-${sec}`); ctx.rendre(); },
  secteurNouveau: ctx => { const n = salleDe(ctx.doc, ctx.state.salleId).secteurs.length; ctx.ouvrirModal({ type: "secteurs", salleId: ctx.state.salleId, noms: [String(n + 1)], departNom: n + 1 }); },
  secteurEditer: (ctx, d) => { const sec = salleDe(ctx.doc, ctx.state.salleId).secteurs.find(x => x.id === d.id); ctx.ouvrirModal({ type: "secteur", salleId: ctx.state.salleId, id: sec.id, nom: sec.nom, profil: sec.profil || "Vertical" }); },
  voieNouvelle: (ctx, d) => { const s = salleDe(ctx.doc, ctx.state.salleId), dn = (ctx.state.derniers || {})[`${s.id}-${d.disc}`] || {};          // dernière couleur et dernier niveau utilisés : déjà remplis
    ctx.ouvrirModal({ type: "voie", salleId: s.id, disc: d.disc, cotSalle: dn.cotSalle || "", chiffre: (dn.cotSalle || "")[0] || "", couleur: dn.couleur || "", profil: profilHabituel(s, d.secteur || null), nom: "", secteurId: d.secteur || "" }); },
  voieEditer: (ctx, d) => { const v = salleDe(ctx.doc, ctx.state.salleId).voies.find(x => x.id === d.id); ctx.ouvrirModal({ type: "voie", salleId: ctx.state.salleId, ...v, chiffre: (v.cotSalle || "")[0] || "" }); },
};
