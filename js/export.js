// export.js — un seul format d'export : le document JSON, accompagné du programme effectif et du bilan calculé.
// Le même fichier sert de sauvegarde (restauration dans l'app) et d'entrée à l'outil Python (rapport Suivi.xlsx).

export function construireExport({ data, doc, programme, bilan }) {
  return { format: "grimpe-export", formatVersion: 1, exporteLe: new Date().toISOString(), programmeId: data.programmeId, docVersion: doc.version,
           doc, programme: programme.map(s => ({ id: s.id, semaine: s.semaine, jour: s.jour, date: s.date, activite: s.activite, phase: s.phase, contenu: s.contenu, libre: s.libre, modifie: s.modifie })), bilan };
}
export const nomFichier = (aujourdhui) => `grimpe-${aujourdhui}.json`;

// Partage (feuille iOS/Android) ou téléchargement. Résout vrai si le partage a eu lieu.
export async function partager(contenu, nom) {
  const f = new File([JSON.stringify(contenu, null, 1)], nom, { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f], title: nom }); return true; } catch (e) { if (e.name === "AbortError") return false; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = nom; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}
export function lireFichier(file) {
  return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => { try { ok(JSON.parse(r.result)); } catch (e) { ko(new Error("Ce fichier n'est pas un JSON valide.")); } }; r.onerror = () => ko(r.error); r.readAsText(file); });
}
export function verifierImport(obj, data) {
  if (!obj || obj.format !== "grimpe-export" || !obj.doc) throw new Error("Ce fichier n'est pas une sauvegarde de l'app.");
  return { doc: obj.doc, autreProgramme: obj.programmeId && obj.programmeId !== data.programmeId, exporteLe: obj.exporteLe };
}
