// ecrans/mur.js — le mur d'une salle : les voies par secteur, en tuiles, rangées au doigt (glisser-déposer).
import { h, si, pictoProfil } from "../html.js";
import { salleDe, hexDe, texteSur, ranger, cotationDe, profilHabituel, passagesDe, supprimerVoies } from "../salles.js";
import { parVoie, tentatives as toutesTentatives, reussi } from "../analyse.js";
import { court } from "../dates.js";

export function rendre(ctx) {
  const { doc, state } = ctx, s = salleDe(doc, state.salleId); if (!s) return { html: h`<p class="carte">Salle introuvable.</p>`, titre: "Salle" };
  const filtre = state.filtre.mur || "", demontees = !!state.filtre.demontees, voies = parVoie(toutesTentatives(ctx.programme, doc));
  const liste = s.voies.filter(v => (demontees ? v.statut === "demontee" : v.statut !== "demontee") && (!filtre || v.disc === filtre)).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const groupes = [...s.secteurs.map(sec => ({ id: sec.id, nom: sec.nom, profil: sec.profil, voies: liste.filter(v => v.secteurId === sec.id) })), { id: "", nom: "Sans secteur", profil: "", voies: liste.filter(v => !v.secteurId || !s.secteurs.some(x => x.id === v.secteurId)) }];
  const classer = state.classer, ranger = state.ranger;
  const tuile = v => { const hv = voies.find(x => x.voieId === v.id), hex = hexDe(doc, v.couleur, s);
    return h`<div class="tuile-voie glissable ${classer && classer.has(v.id) ? "selectionnee" : ""}" draggable="false" data-id="${v.id}" data-act="${classer ? "classerBascule" : "voieEditer"}" style="background:${hex};color:${texteSur(hex)}"><b>${v.etoile ? "★ " : ""}${v.cotSalle || v.cot || "?"}</b>${pictoProfil(v.profil, "picto-tuile")}<span>${v.nom || (v.profil || "").toLowerCase()}</span><span class="tuile-histo">${hv ? `${hv.reussies ? "✓" + (hv.reussies > 1 ? hv.reussies : "") : ""}${hv.essais - hv.reussies ? " ✗" + (hv.essais - hv.reussies) : ""}` : ""}${v.statut === "demontee" ? ` démontée ${v.demontee ? court(v.demontee) : ""}` : ""}</span>${si(!demontees && !classer, h`<span class="poignee" aria-label="Déplacer">⋮⋮</span>`)}</div>`; };
  if (classer) { const n = classer.size;
    const dis = n ? "" : "disabled", cotable = ["standard", "liste"].includes(cotationDe(s, filtre || (s.type === "Bloc" ? "Bloc" : "Voie")).mode);
    return { titre: h`<b>${s.nom}</b>`, infos: "Sélection", html: h`<p class="petit">Touche les voies à modifier ou supprimer ensemble.</p>
      ${groupes.filter(g => g.voies.length).map(g => h`<div class="secteur"><div class="secteur-tete"><b>${g.nom}</b><span class="ed-outils"><button data-act="selectionSecteurTout" data-secteur="${g.id}">Tout</button></span></div><div class="tuiles">${g.voies.map(tuile)}</div></div>`)}
      <div class="barre-classer"><div class="barre-haut"><span><b>${n}</b> sélectionnée${n > 1 ? "s" : ""}</span><button class="principal" data-act="classerFin">Terminé</button></div>
        <div class="barre-actions"><button data-act="classerSecteur" ${dis}>Secteur</button><button data-act="selectionProfil" ${dis}>Profil</button>${si(cotable, h`<button data-act="selectionCot" ${dis}>Cotation</button>`)}<button data-act="classerDemonter" ${dis}>${demontees ? "Remonter" : "Démonter"}</button><button class="danger" data-act="selectionSupprimer" ${dis}>Supprimer</button></div></div>` }; }
  const html = h`<div class="barre-prog"><button class="petit-btn" data-act="salleEditer">✎ Salle</button><button class="petit-btn" data-act="secteurNouveau">+ Secteur</button>
      ${si(!demontees, h`<button class="petit-btn" data-act="ajoutRapideOuvrir">+ Plusieurs voies</button>`)}<button class="petit-btn" data-act="classerDebut">Sélectionner</button>${si(!demontees, h`<button class="petit-btn ${ranger ? "choisi" : ""}" data-act="rangerBascule">${ranger ? "Ranger : fini" : "Ranger"}</button>`)}
      ${si(s.type === "Bloc et voie", h`<div class="choix compact" style="margin:0">${[["", "Tout"], ["Voie", "Voies"], ["Bloc", "Blocs"]].map(([v, l]) => h`<button data-act="filtreMur" data-valeur="${v}" class="${filtre === v ? "choisi" : ""}">${l}</button>`)}</div>`)}
      <button class="petit-btn ${demontees ? "choisi" : ""}" data-act="filtreDemontees">${demontees ? "En place" : "Démontées"}</button></div>
    <p class="petit">${ranger ? "Mode Ranger : fais glisser les voies où tu veux, puis « Ranger : fini »." : "Touche une voie pour sa fiche. Prends-la par ⋮⋮ (ou passe en mode Ranger) pour la déplacer."}</p>
    ${groupes.filter(g => g.voies.length || g.id || s.secteurs.length).map(g => h`<div class="secteur" data-secteur="${g.id}"><div class="secteur-tete">${g.id ? h`<button class="secteur-nom" data-act="secteurEditer" data-id="${g.id}"><b>${g.nom}</b> <span class="petit">${g.profil ? g.profil.toLowerCase() + " · " : ""}${g.voies.length} voie${g.voies.length > 1 ? "s" : ""}</span> <span class="crayon">✎</span></button>` : h`<span class="secteur-nom"><b>${g.nom}</b> <span class="petit">${g.voies.length} voie${g.voies.length > 1 ? "s" : ""}</span></span>`}
        <span class="ed-outils">${si(!demontees, h`<button data-act="voieNouvelle" data-secteur="${g.id}" data-disc="${filtre || (s.type === "Bloc" ? "Bloc" : "Voie")}">+ voie</button>`)}</span></div>
        <div class="tuiles zone-depot" data-secteur="${g.id}">${g.voies.map(tuile)}${si(!g.voies.length, h`<span class="petit depot-vide">déposer ici</span>`)}</div></div>`)}
    ${si(!s.voies.length, h`<p class="petit">Aucune voie. Ajoute-les ici, ou directement pendant une séance avec « + Nouvelle voie ».</p>`)}`;
  document.body.classList.toggle("mode-ranger", !!ranger);
  return { html, titre: h`<b>${s.nom}</b>`, infos: `${cotationDe(s, "Voie").mode !== "standard" || cotationDe(s, "Bloc").mode !== "standard" ? "cotation propre à la salle" : ""}` };
}

// --- Glisser-déposer (pointer events) : on prend la tuile par sa poignée ⋮⋮ ; dépôt sur une tuile (avant elle) ou sur un secteur (à la fin) ---
let installe = false;
export function apresRendu(ctx) {
  const racine = document.getElementById("ecran"); if (ctx.state.vue !== "salle" || !racine || installe) return; installe = true;
  let actif = null, fantome = null, bouge = false;
  const nettoyer = () => { if (fantome) fantome.remove(); fantome = null; racine.querySelectorAll(".depot-cible, .en-glisse").forEach(x => x.classList.remove("depot-cible", "en-glisse")); actif = null; document.body.classList.remove("glisse-en-cours"); };
  const cibleSous = (x, y) => { if (fantome) fantome.style.display = "none"; const el = document.elementFromPoint(x, y); if (fantome) fantome.style.display = ""; if (!el) return null;
    const tuile = el.closest(".tuile-voie.glissable"), zone = el.closest(".zone-depot"); return tuile && tuile !== actif ? { tuile, zone: tuile.closest(".zone-depot") } : zone ? { tuile: null, zone } : null; };
  const placer = (x, y) => { if (fantome) { fantome.style.left = (x - fantome.offsetWidth / 2) + "px"; fantome.style.top = (y - 30) + "px"; } };
  racine.addEventListener("pointerdown", e => { if (e.button > 0 || ctx.state.vue !== "salle" || ctx.state.classer) return;
    const p = e.target.closest(".poignee") || (ctx.state.ranger && e.target.closest(".tuile-voie.glissable")); if (!p) return; const t = p.closest(".tuile-voie.glissable"); if (!t) return;
    e.preventDefault(); actif = t; bouge = false; t.classList.add("en-glisse"); document.body.classList.add("glisse-en-cours");
    fantome = t.cloneNode(true); fantome.classList.add("fantome"); fantome.style.width = t.offsetWidth + "px"; document.body.appendChild(fantome); placer(e.clientX, e.clientY); try { p.setPointerCapture(e.pointerId); } catch { /* ignore */ } });
  racine.addEventListener("pointermove", e => { if (!actif) return; bouge = true; e.preventDefault(); placer(e.clientX, e.clientY);
    racine.querySelectorAll(".depot-cible").forEach(x => x.classList.remove("depot-cible")); const c = cibleSous(e.clientX, e.clientY); if (c) (c.tuile || c.zone).classList.add("depot-cible"); });
  const lacher = e => { if (!actif) return; const c = cibleSous(e.clientX, e.clientY), id = actif.dataset.id; nettoyer();
    if (!c) return; const secteurId = c.zone.dataset.secteur || null, avantId = c.tuile ? c.tuile.dataset.id : null;
    ctx.modifier("voie rangée", d => { ranger(salleDe(d, ctx.state.salleId), id, secteurId, avantId); }); ctx.rendre(); };
  racine.addEventListener("pointerup", lacher); racine.addEventListener("pointercancel", nettoyer);
  // Un glissement ne doit pas ouvrir la fiche
  racine.addEventListener("click", e => { if (ctx.state.vue === "salle" && (e.target.closest(".poignee") || (ctx.state.ranger && e.target.closest(".tuile-voie.glissable")))) { e.stopPropagation(); e.preventDefault(); } }, true);
}

export const actions = {
  rangerBascule: ctx => { ctx.state.ranger = !ctx.state.ranger; ctx.rendre(); },
  classerDebut: ctx => { ctx.state.ranger = false; ctx.state.classer = new Set(); ctx.rendre(); },
  classerFin: ctx => { ctx.state.classer = null; ctx.rendre(); },
  selectionSecteurTout: (ctx, d) => { const s = salleDe(ctx.doc, ctx.state.salleId), dem = !!ctx.state.filtre.demontees, f = ctx.state.filtre.mur || "";
    const ids = s.voies.filter(v => (v.secteurId || "") === d.secteur && (dem ? v.statut === "demontee" : v.statut !== "demontee") && (!f || v.disc === f)).map(v => v.id), c = ctx.state.classer;
    if (ids.every(id => c.has(id))) ids.forEach(id => c.delete(id)); else ids.forEach(id => c.add(id)); ctx.rendre(); },
  selectionProfil: ctx => ctx.ouvrirModal({ type: "selection", quoi: "profil", titre: `Profil de ${ctx.state.classer.size} voie${ctx.state.classer.size > 1 ? "s" : ""}` }),
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
  filtreMur: (ctx, d) => { ctx.state.filtre.mur = d.valeur; ctx.rendre(); },
  secteurNouveau: ctx => ctx.ouvrirModal({ type: "secteur", salleId: ctx.state.salleId, nom: "", profil: "Vertical" }),
  secteurEditer: (ctx, d) => { const sec = salleDe(ctx.doc, ctx.state.salleId).secteurs.find(x => x.id === d.id); ctx.ouvrirModal({ type: "secteur", salleId: ctx.state.salleId, id: sec.id, nom: sec.nom, profil: sec.profil || "Vertical" }); },
  voieNouvelle: (ctx, d) => { const s = salleDe(ctx.doc, ctx.state.salleId); ctx.ouvrirModal({ type: "voie", salleId: s.id, disc: d.disc, cotSalle: "", chiffre: "", couleur: "", profil: profilHabituel(s, d.secteur || null), nom: "", secteurId: d.secteur || "" }); },
  voieEditer: (ctx, d) => { const v = salleDe(ctx.doc, ctx.state.salleId).voies.find(x => x.id === d.id); ctx.ouvrirModal({ type: "voie", salleId: ctx.state.salleId, ...v, chiffre: (v.cotSalle || "")[0] || "" }); },
};
