// export.js — un seul format d'export : le document JSON, accompagné du programme effectif et du bilan calculé.
// Le même fichier sert de sauvegarde (restauration dans l'app) et d'entrée à l'outil Python (rapport Suivi.xlsx).

export function construireExport({ data, doc, programme, bilan }) {
  return { format: "grimpe-export", formatVersion: 1, exporteLe: new Date().toISOString(), programmeId: data.programmeId, docVersion: doc.version,
           doc, programme: programme.map(s => ({ id: s.id, semaine: s.semaine, jour: s.jour, date: s.date, activite: s.activite, phase: s.phase, contenu: s.contenu, libre: s.libre, modifie: s.modifie })), bilan };
}
// Nom lisible : Grimpe-sauvegarde-2026-11-16-14h30.json
export const nomFichier = (aujourdhui) => { const d = new Date(); return `Grimpe-sauvegarde-${aujourdhui}-${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}.json`; };

export const texteExport = contenu => JSON.stringify(contenu, null, 1);
export const tailleKo = contenu => Math.max(1, Math.round(new Blob([texteExport(contenu)]).size / 1024));
// Partage (feuille iOS/Android) ou téléchargement. Résout vrai si le partage a eu lieu.
// Le fichier part SEUL : avec un titre ou un texte, Mail sur iPhone garde le texte et laisse tomber la pièce jointe.
export async function partager(contenu, nom) {
  const f = new File([texteExport(contenu)], nom, { type: "text/plain" });          // .json, mais annoncé en texte : accepté par Mail, Fichiers, WhatsApp…
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f] }); return true; } catch (e) { if (e.name === "AbortError") return false; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(f); a.download = nom; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return true;
}
// Copie de secours : tout le document dans le presse-papiers (à coller dans Notes ou un mail)
export async function copierTexte(contenu) {
  const t = texteExport(contenu);
  try { await navigator.clipboard.writeText(t); return true; }
  catch { const z = document.createElement("textarea"); z.value = t; z.setAttribute("readonly", ""); z.style.position = "fixed"; z.style.opacity = "0"; document.body.appendChild(z); z.select(); z.setSelectionRange(0, t.length);
    const ok = document.execCommand("copy"); z.remove(); return ok; }
}
// Restauration depuis du texte collé (même contenu qu'un fichier d'export)
export function lireTexte(t) { try { return JSON.parse(t); } catch { throw new Error("Ce texte n'est pas une sauvegarde de l'app."); } }
export function lireFichier(file) {
  return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => { try { ok(JSON.parse(r.result)); } catch (e) { ko(new Error("Ce fichier n'est pas un JSON valide.")); } }; r.onerror = () => ko(r.error); r.readAsText(file); });
}
export function verifierImport(obj, data) {
  if (!obj || obj.format !== "grimpe-export" || !obj.doc) throw new Error("Ce fichier n'est pas une sauvegarde de l'app.");
  return { doc: obj.doc, autreProgramme: obj.programmeId && obj.programmeId !== data.programmeId, exporteLe: obj.exporteLe };
}
