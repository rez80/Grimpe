// csv.js — export « pour analyse » : un zip de 5 fichiers CSV (Excel, LibreOffice, Python…), chargé seulement à la demande.
// Tout se fait sur le téléphone : rien ne part sur Internet. Le jeton GitHub n'est jamais dans le document, donc jamais ici.
// Séparateur « ; » et BOM UTF-8 : Excel en français ouvre les fichiers directement, accents compris. La sauvegarde reste le JSON.

import { tentatives, signalements, dureeMinutes } from "./analyse.js";
import { etatSeance } from "./programme.js";
import { salleDe, secteurDe } from "./salles.js";

const BOM = "﻿";
const cellule = v => { if (v == null) return ""; if (typeof v === "boolean") return v ? "oui" : "non"; if (typeof v === "number") return String(v).replace(".", ",");
  const t = String(v); return /[;"\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
export const versCSV = (colonnes, lignes) => BOM + [colonnes.join(";"), ...lignes.map(l => colonnes.map(c => cellule(l[c])).join(";"))].join("\r\n") + "\r\n";
const heure = ms => { if (!ms) return ""; const d = new Date(ms), p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };

// Les 5 tables, à partir du programme effectif et du document. notes = false : sans les textes libres.
export function tables({ programme, doc, aujourdhui, notes = true }) {
  const nomSalle = id => (salleDe(doc, id) || {}).nom || (id ? "?" : "");
  const passages = tentatives(programme, doc).sort((a, b) => (a.date || "") < (b.date || "") ? -1 : (a.date || "") > (b.date || "") ? 1 : (a.t || 0) - (b.t || 0)).map(t => ({
    date: t.date || "", heure: heure(t.t).slice(11), seance: String(t.seanceId || "").startsWith("ancien-") ? "hors séance" : t.seanceId, discipline: t.disc, cotation: t.cot, cotation_salle: t.cotSalle,
    profil: t.profil, resultat: t.res, aisance: t.aisance, style: t.style, essais_avant: t.essaisAvant, premier_essai: t.premierEssai, cause: t.cause, couleur: t.couleur, nom: t.nom, salle: nomSalle(t.salle),
    voie_id: t.voieId, nouvelle: t.nouvelle ? true : "", date_approx: t.approx ? true : "", ...(notes ? { note: t.note || "" } : {}) }));
  const seances = programme.map(s => { const sa = doc.seances[s.id] || {}, d = sa.douleur || {};
    return { id: s.id, semaine: s.semaine, jour: s.jour, date_prevue: s.date, date_reelle: sa.dateReelle || "", activite: s.activite, phase: s.phase, bloc: s.bloc || "", bonus: s.bonus ? true : "",
      etat: etatSeance(s, sa, aujourdhui), version: sa.version ?? "", debut: heure(sa.debut), fin: heure(sa.fin), duree_min: dureeMinutes(sa) || "", effort: sa.effort ?? "", forme: sa.forme || "",
      douleur_avant: d.avant ?? "", douleur_apres: d.apres ?? "", zone_apres: d.zone || "", passages: (sa.tentatives || []).length || "", salle: nomSalle(sa.salle), raison: sa.raison || "",
      ...(notes ? { notes: sa.notes || "" } : {}) }; });
  const nbPassages = {}, reussies = {}; for (const t of tentatives(programme, doc)) if (t.voieId) { nbPassages[t.voieId] = (nbPassages[t.voieId] || 0) + 1; if (t.res === "ok") reussies[t.voieId] = true; }
  const voies = (doc.salles || []).flatMap(sl => (sl.voies || []).map(v => { const sec = secteurDe(sl, v) || {};
    return { salle: sl.nom, secteur: sec.nom || "", discipline: v.disc, couleur: v.couleur, cotation_salle: v.cotSalle, cotation: v.cot, nom: v.nom, profil: v.profil || sec.profil || "",
      caracteristiques: (v.carac || []).join(", "), statut: v.statut || "en place", ouverte: v.ouverte || "", demontee: v.demontee || "", passages: nbPassages[v.id] || 0, reussie: !!reussies[v.id], voie_id: v.id }; }));
  const mesures = Object.entries(doc.mesures || {}).flatMap(([w, m]) => Object.entries(m || {}).map(([cle, valeur]) => ({ semaine: +w, mesure: cle, valeur })));
  const douleurs = signalements(programme, doc).map(x => ({ date: x.date, seance: x.seanceId, moment: x.quand, zone: x.zone, niveau: x.niveau }));
  return {
    "passages.csv": versCSV(["date", "heure", "seance", "discipline", "cotation", "cotation_salle", "profil", "resultat", "aisance", "style", "essais_avant", "premier_essai", "cause", "couleur", "nom", "salle", "voie_id", "nouvelle", "date_approx", ...(notes ? ["note"] : [])], passages),
    "seances.csv": versCSV(["id", "semaine", "jour", "date_prevue", "date_reelle", "activite", "phase", "bloc", "bonus", "etat", "version", "debut", "fin", "duree_min", "effort", "forme", "douleur_avant", "douleur_apres", "zone_apres", "passages", "salle", "raison", ...(notes ? ["notes"] : [])], seances),
    "voies.csv": versCSV(["salle", "secteur", "discipline", "couleur", "cotation_salle", "cotation", "nom", "profil", "caracteristiques", "statut", "ouverte", "demontee", "passages", "reussie", "voie_id"], voies),
    "mesures.csv": versCSV(["semaine", "mesure", "valeur"], mesures),
    "douleurs.csv": versCSV(["date", "seance", "moment", "zone", "niveau"], douleurs),
  };
}

// --- Zip « stocké » (sans compression : les CSV sont petits) ---
const TABLE_CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export const crc32 = octets => { let c = 0xFFFFFFFF; for (let i = 0; i < octets.length; i++) c = TABLE_CRC[(c ^ octets[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
export function zip(fichiers, date = new Date()) {
  const enc = new TextEncoder(), parts = [], centrale = []; let decalage = 0;
  const heureDos = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1), jourDos = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  for (const [nom, contenu] of Object.entries(fichiers)) {
    const n = enc.encode(nom), d = typeof contenu === "string" ? enc.encode(contenu) : contenu, crc = crc32(d);
    const loc = new DataView(new ArrayBuffer(30)); loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true); loc.setUint16(8, 0, true);
    loc.setUint16(10, heureDos, true); loc.setUint16(12, jourDos, true); loc.setUint32(14, crc, true); loc.setUint32(18, d.length, true); loc.setUint32(22, d.length, true); loc.setUint16(26, n.length, true); loc.setUint16(28, 0, true);
    parts.push(new Uint8Array(loc.buffer), n, d);
    const c = new DataView(new ArrayBuffer(46)); c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
    c.setUint16(12, heureDos, true); c.setUint16(14, jourDos, true); c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, n.length, true); c.setUint32(42, decalage, true);
    centrale.push(new Uint8Array(c.buffer), n); decalage += 30 + n.length + d.length;
  }
  const tailleC = centrale.reduce((t, x) => t + x.length, 0), fin = new DataView(new ArrayBuffer(22)), nb = Object.keys(fichiers).length;
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, nb, true); fin.setUint16(10, nb, true); fin.setUint32(12, tailleC, true); fin.setUint32(16, decalage, true);
  return new Blob([...parts, ...centrale, new Uint8Array(fin.buffer)], { type: "application/zip" });
}
export const nomZip = aujourdhui => { const d = new Date(); return `Grimpe-analyse-${aujourdhui}-${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}.zip`; };

// Partage (« Enregistrer dans Fichiers ») ou téléchargement. Vrai si le fichier est parti.
export async function partagerZip(blob, nom) {
  const f = new File([blob], nom, { type: "application/zip" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return true; } catch (e) { if (e.name === "AbortError") return false; } }
  const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = nom; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}
