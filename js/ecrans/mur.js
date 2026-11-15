// ecrans/mur.js — le mur d'une salle : les voies par secteur, en tuiles, rangées au doigt (glisser-déposer).
import { h, si } from "../html.js";
import { salleDe, hexDe, texteSur, ranger, cotationDe } from "../salles.js";
import { parVoie, tentatives as toutesTentatives, reussi } from "../analyse.js";
import { court } from "../dates.js";

export function rendre(ctx) {
  const { doc, state } = ctx, s = salleDe(doc, state.salleId); if (!s) return { html: h`<p class="carte">Salle introuvable.</p>`, titre: "Salle" };
  const filtre = state.filtre.mur || "", demontees = !!state.filtre.demontees, voies = parVoie(toutesTentatives(ctx.programme, doc));
  const liste = s.voies.filter(v => (demontees ? v.statut === "demontee" : v.statut !== "demontee") && (!filtre || v.disc === filtre)).sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const groupes = [...s.secteurs.map(sec => ({ id: sec.id, nom: sec.nom, profil: sec.profil, voies: liste.filter(v => v.secteurId === sec.id) })), { id: "", nom: "Sans secteur", profil: "", voies: liste.filter(v => !v.secteurId || !s.secteurs.some(x => x.id === v.secteurId)) }];
  const tuile = v => { const hv = voies.find(x => x.voieId === v.id), hex = hexDe(doc, v.couleur, s);
    return h`<div class="tuile-voie glissable" draggable="false" data-id="${v.id}" data-act="voieEditer" style="background:${hex};color:${texteSur(hex)}"><b>${v.cotSalle || v.cot || "?"}</b><span>${v.nom || (v.profil || "").toLowerCase()}</span><span class="histo">${hv ? `${hv.reussies ? "✓" + (hv.reussies > 1 ? hv.reussies : "") : ""}${hv.essais - hv.reussies ? " ✗" + (hv.essais - hv.reussies) : ""}` : ""}${v.statut === "demontee" ? ` démontée ${v.demontee ? court(v.demontee) : ""}` : ""}</span>${si(!demontees, h`<span class="poignee" aria-label="Déplacer">⋮⋮</span>`)}</div>`; };
  const html = h`<div class="barre-prog"><button class="petit-btn" data-act="salleEditer">✎ Salle</button><button class="petit-btn" data-act="secteurNouveau">+ Secteur</button>
      ${si(s.type === "Bloc et voie", h`<div class="choix compact" style="margin:0">${[["", "Tout"], ["Voie", "Voies"], ["Bloc", "Blocs"]].map(([v, l]) => h`<button data-act="filtreMur" data-valeur="${v}" class="${filtre === v ? "choisi" : ""}">${l}</button>`)}</div>`)}
      <button class="petit-btn ${demontees ? "choisi" : ""}" data-act="filtreDemontees">${demontees ? "En place" : "Démontées"}</button></div>
    <p class="petit">Touche une voie pour sa fiche. Prends-la par ⋮⋮ pour la déplacer dans un autre secteur ou changer l'ordre.</p>
    ${groupes.filter(g => g.voies.length || g.id).map(g => h`<div class="secteur" data-secteur="${g.id}"><div class="secteur-tete"><b>${g.nom}</b> <span class="petit">${g.profil ? g.profil.toLowerCase() + " · " : ""}${g.voies.length} voie${g.voies.length > 1 ? "s" : ""}</span>
        <span class="ed-outils">${si(!demontees, h`<button data-act="voieNouvelle" data-secteur="${g.id}" data-disc="${filtre || (s.type === "Bloc" ? "Bloc" : "Voie")}">+ voie</button>`)}${si(g.id, h`<button data-act="secteurEditer" data-id="${g.id}">✎</button>`)}</span></div>
        <div class="tuiles zone-depot" data-secteur="${g.id}">${g.voies.map(tuile)}${si(!g.voies.length, h`<span class="petit depot-vide">déposer ici</span>`)}</div></div>`)}
    ${si(!s.voies.length, h`<p class="petit">Aucune voie. Ajoute-les ici, ou directement pendant une séance avec « + Nouvelle voie ».</p>`)}`;
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
  racine.addEventListener("pointerdown", e => { const p = e.target.closest(".poignee"); if (!p || e.button > 0 || ctx.state.vue !== "salle") return; const t = p.closest(".tuile-voie.glissable"); if (!t) return;
    e.preventDefault(); actif = t; bouge = false; t.classList.add("en-glisse"); document.body.classList.add("glisse-en-cours");
    fantome = t.cloneNode(true); fantome.classList.add("fantome"); fantome.style.width = t.offsetWidth + "px"; document.body.appendChild(fantome); placer(e.clientX, e.clientY); try { p.setPointerCapture(e.pointerId); } catch { /* ignore */ } });
  racine.addEventListener("pointermove", e => { if (!actif) return; bouge = true; e.preventDefault(); placer(e.clientX, e.clientY);
    racine.querySelectorAll(".depot-cible").forEach(x => x.classList.remove("depot-cible")); const c = cibleSous(e.clientX, e.clientY); if (c) (c.tuile || c.zone).classList.add("depot-cible"); });
  const lacher = e => { if (!actif) return; const c = cibleSous(e.clientX, e.clientY), id = actif.dataset.id; nettoyer();
    if (!c) return; const secteurId = c.zone.dataset.secteur || null, avantId = c.tuile ? c.tuile.dataset.id : null;
    ctx.modifier("voie rangée", d => { ranger(salleDe(d, ctx.state.salleId), id, secteurId, avantId); }); ctx.rendre(); };
  racine.addEventListener("pointerup", lacher); racine.addEventListener("pointercancel", nettoyer);
  // Un glissement ne doit pas ouvrir la fiche
  racine.addEventListener("click", e => { if (e.target.closest(".poignee")) { e.stopPropagation(); e.preventDefault(); } }, true);
}

export const actions = {
  filtreMur: (ctx, d) => { ctx.state.filtre.mur = d.valeur; ctx.rendre(); },
  secteurNouveau: ctx => ctx.ouvrirModal({ type: "secteur", salleId: ctx.state.salleId, nom: "", profil: "Vertical" }),
  secteurEditer: (ctx, d) => { const sec = salleDe(ctx.doc, ctx.state.salleId).secteurs.find(x => x.id === d.id); ctx.ouvrirModal({ type: "secteur", salleId: ctx.state.salleId, id: sec.id, nom: sec.nom, profil: sec.profil || "Vertical" }); },
  voieNouvelle: (ctx, d) => { const s = salleDe(ctx.doc, ctx.state.salleId), sec = s.secteurs.find(x => x.id === d.secteur); ctx.ouvrirModal({ type: "voie", salleId: s.id, disc: d.disc, cotSalle: "", chiffre: "", couleur: "", profil: (sec && sec.profil) || "Vertical", nom: "", secteurId: d.secteur || "" }); },
  voieEditer: (ctx, d) => { const v = salleDe(ctx.doc, ctx.state.salleId).voies.find(x => x.id === d.id); ctx.ouvrirModal({ type: "voie", salleId: ctx.state.salleId, ...v, chiffre: (v.cotSalle || "")[0] || "" }); },
};
