// sync.js — sauvegarde automatique du document dans un dépôt GitHub privé, via l'API « contents ».
// Rien à installer : un fichier JSON dans le dépôt, l'historique git fait les versions.
// Le jeton (fine-grained, « Contents : read and write » sur ce seul dépôt) est gardé dans localStorage,
// jamais dans le document ni dans l'export.

const CLE_JETON = "grimpe-jeton-github";
export const lireJeton = () => { try { return localStorage.getItem(CLE_JETON) || ""; } catch { return ""; } };
export const ecrireJeton = j => { try { j ? localStorage.setItem(CLE_JETON, j) : localStorage.removeItem(CLE_JETON); } catch { /* ignore */ } };

const utf8versBase64 = txt => { const o = new TextEncoder().encode(txt); let b = ""; for (let i = 0; i < o.length; i += 0x8000) b += String.fromCharCode(...o.subarray(i, i + 0x8000)); return btoa(b); };
const base64versUtf8 = b64 => { const b = atob(b64.replace(/\s/g, "")); const o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return new TextDecoder().decode(o); };

export const configValide = c => !!(c && c.owner && c.repo && c.chemin);

export function creerSync({ config, jeton, fetchFn = (...a) => fetch(...a) }) {
  if (!configValide(config)) throw new Error("Synchronisation non configurée (dépôt, chemin).");
  if (!jeton) throw new Error("Jeton GitHub manquant.");
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.chemin.replace(/^\/+/, "")}`;
  const entetes = { Authorization: `Bearer ${jeton}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  async function appel(methode, corps) {
    let r; try { r = await fetchFn(url, { method: methode, headers: { ...entetes, ...(corps ? { "Content-Type": "application/json" } : {}) }, body: corps ? JSON.stringify(corps) : undefined }); }
    catch (e) { throw new Error("Pas de réseau, ou GitHub injoignable."); }
    if (r.status === 404) return null;
    if (r.status === 401 || r.status === 403) throw new Error("GitHub refuse le jeton (expiré, ou sans droit d'écriture sur ce dépôt).");
    if (!r.ok) throw new Error(`GitHub : erreur ${r.status}.`);
    return r.json();
  }
  return {
    // Lit le fichier : { sha, contenu } ou null s'il n'existe pas encore
    async lire() { const j = await appel("GET"); if (!j) return null; return { sha: j.sha, contenu: JSON.parse(base64versUtf8(j.content)) }; },
    // Écrit le fichier (création ou mise à jour) ; renvoie le sha du commit
    async pousser(objet, message = "Grimpe : sauvegarde") {
      const existant = await appel("GET");
      const j = await appel("PUT", { message, content: utf8versBase64(JSON.stringify(objet, null, 1)), ...(existant ? { sha: existant.sha } : {}) });
      return j && j.commit ? j.commit.sha : null;
    },
    url,
  };
}
