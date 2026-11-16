# Grimpe 8.8 — l'app d'escalade

Une app pour iPhone qui suit un programme d'entraînement à l'escalade (voie, bloc, maison, course) :
- **Programme.xlsx** sur le PC décrit le programme ;
- **l'app** sert pendant les séances et garde la mémoire des salles et des voies ;
- **un outil Python** produit le rapport **Suivi.xlsx**.

L'app est une page web installée sur l'écran d'accueil (PWA). Elle est écrite en HTML, CSS et JavaScript, sans dépendance. Elle fonctionne hors ligne, et toutes les données restent sur le téléphone, sauf si tu actives la sauvegarde GitHub.

---

## 1. Ce que fait l'app

**Programme.** L'app s'ouvre sur le programme. La carte « Aujourd'hui » ouvre la séance du jour en un appui ; s'il n'y a pas de séance aujourd'hui, elle montre la prochaine. Si une séance est en cours, l'app s'ouvre directement dessus. Les semaines se déplient. Chaque séance a son menu ⋯ :
- bilan ;
- modifier le plan ;
- déplacer ;
- copier vers une autre date ;
- marquer sautée ;
- supprimer, pour une séance que tu as créée ou copiée.

**Séance.**
- **Commencer** lance la séance, sans questionnaire.
- **📋 Consignes** est sous le bandeau, en évidence et ouvert, avant, pendant et après la séance. Une fois replié, il montre le début de la première consigne.
- **La frise** sous le titre montre le déroulé prévu : une couleur par type d'étape, et la durée de chaque phase en minutes.
- **La carte Maintenant** montre l'étape en cours, ses minuteurs (repos, chrono, fractions, routine guidée) et « ✓ Fait · suivant ». Le **Détail de l'étape** est dans la carte.
- **La forme** se dit en un appui : 🙂 😐 😣.
- **⚠ Douleur** note une douleur pendant la séance.
- **■ Fin de séance** demande l'effort, la douleur après, et, si tu n'as rien noté, « en gros ce que tu as grimpé ». Ça fait trois appuis.
- **Une séance restée ouverte** se ferme toute seule après quatre heures.
- **Le lendemain**, une séance oubliée revient en une carte : faite, sautée, ou plus tard.

**Voies et blocs pendant la séance.** La carte « Voies » (ou « Blocs ») est courte et repliable :
- **Salle : … ›** choisit la salle du jour : une de tes salles, « Salle inconnue » ou « + Nouvelle salle… ». La même règle vaut en voie et en bloc : par défaut, c'est la dernière salle choisie, si elle accepte la discipline. « Salle inconnue » vaut pour la séance.
- **+ Noter un passage** ouvre une fenêtre :
  - en haut, « + Nouvelle voie » et « Sans voie précise » (cotation seule) ;
  - dessous, les voies de la salle, filtrées par couleur et par cotation, avec tes cibles et les voies d'aujourd'hui en premier ;
  - toucher une voie propose ✓ / sec / ✗. Après un échec, la cause se choisit dans une liste, et le choix enregistre le passage.
- **Tes cibles** : les voies ★ à essayer et tes projets, notés en un appui.
- **Voie déjà faite, sans la chercher** : une rangée compacte par cotation de la séance (✓ / sec / ✗). Un appui compte une voie déjà faite, pour aller vite et compter les voies connues. Si c'était une nouvelle voie, touche « Nouvelle voie » dans le message qui s'affiche.
- **Aujourd'hui** : les passages de la séance regroupés par voie (« 5b bleu ✗ ✗ ✓ facile »). Touche un résultat pour le corriger ; « + encore » note un autre passage sur la même voie.
- **Voir tout le mur ›** ouvre la salle.

**Après une réussite**, le passage est déjà enregistré. La fenêtre reste ouverte pour préciser, si tu veux :
- **Comment ?** : À vue · Flash · 2ᵉ · 3ᵉ · 4ᵉ · 5ᵉ+ · Inconnu. Un seul choix donne le style et le nombre d'essais :
  - *À vue* = 1er essai sans rien savoir de la voie ;
  - *Flash* = 1er essai avec des infos ;
  - *2ᵉ et plus* = après travail.

  Si tes échecs sur la voie sont notés, l'essai est présélectionné.
- la date du premier essai, dès le 2ᵉ essai ;
- l'aisance (Facile · Correct · Arraché).

« Fermer » suffit. Si la voie était déjà réussie, l'app indique une répétition et ne demande que l'aisance.

**Salles.**
- **La liste** est en cartes : couleurs présentes, nombre de voies et de blocs, secteurs, dernière séance, ✎.
- **Les cartes de salle** affichent le type et le nombre de voies et de blocs, sur une couleur de fond (automatique, à changer dans ✎).
- **En bref**, en haut d'une salle : un bâtonnet par niveau, dont la hauteur donne le nombre de voies. Sa couleur est celle du niveau dans une salle qui cote par couleurs, sinon la couleur de prises la plus présente. Toucher un bâton filtre le mur (« Niv 5b : 6 voies »).
- **La façon de coter** d'une salle se règle en trois questions :
  1. comment la salle note ses niveaux : cotation française ou Fontainebleau, chiffres, lettres, chiffres et lettres, couleurs, autres, ou pas de niveaux ;
  2. combien de niveaux différents : l'app crée la liste toute seule ;
  3. l'équivalent de chaque niveau dans la cotation de l'app : une liste déroulante, pré-remplie et modifiable.
- **Dans une salle**, une barre reste en haut : Tout / Voies / Blocs, + Voie, + Secteur, Sélectionner, et un filtre par caractéristique. Le reste est dans ⋯ : plusieurs voies d'un coup, voies démontées, modifier la salle.
- **Les secteurs** sont repliés avec un résumé (inclinaison, nombre, couleurs, étendue des cotations). L'app retient ceux que tu ouvres.
- **L'inclinaison d'un secteur** est calculée : c'est la plus fréquente parmi ses voies, en trois catégories (Dalle, Vertical, Dévers). Les nouvelles voies du secteur la prennent par défaut. À la création d'un secteur vide, on la choisit parmi ces trois catégories.
- **Déplacer une voie** : prends-la par ⋮⋮ et lâche-la sur une autre voie, dans un secteur ouvert, ou sur le nom d'un secteur replié. Il n'y a pas de mode à activer ni à quitter.
- **Une voie** a :
  - une couleur : 12 de base, et un appui long montre les nuances (42 teintes) ;
  - une cotation, notée à la façon de la salle : comme l'app, ses propres niveaux, par couleurs, ou aucune ;
  - une **inclinaison** : Dalle, Vertical, Léger dévers, Dévers, Surplomb, Fort dévers, Toit ;
  - des **caractéristiques**, plusieurs possibles : Arête, Traversée, Dièdre, Fissure, Volumes, Réglettes, Bacs, Pinces, Plats, Dynamique, Compression ;
  - un secteur et un nom.
- **La fiche d'une voie** s'ouvre sur une ligne par réglage, et son **historique** est affiché :
  - chaque passage a ✕ pour le supprimer tout de suite (« Annuler » quelques secondes) ;
  - « + Ajouter » note une réussite d'un autre jour, ou des échecs sur plusieurs dates d'un coup ;
  - « Noter un passage maintenant » apparaît si une séance est en cours.
- **Supprimer** une voie, un secteur ou une salle se fait tout de suite, avec « Annuler ». Quand il y a un vrai choix (garder ou non les passages, les voies d'un secteur), une fenêtre le pose.

**Passages hors séance.** Pour une voie d'une salle, ils se notent dans sa fiche, onglet Historique. Pour un passage sans voie connue (avant le programme, en extérieur…), passe par ⋯ du Programme › « Passages hors séance ». Un passage sans date compte dans les niveaux, les projets et les feux verts, mais pas dans la charge ni dans le bilan de la semaine.

**Progrès.** D'abord quelques phrases : la semaine, le niveau acquis, l'aisance, le point faible, le prochain cap avec une projection après quatre semaines. Ensuite, des sections repliables :
- les projets (touche-en un pour ouvrir sa fiche) ;
- les feux verts ;
- le niveau consolidé et son détail par cotation ;
- à travailler (inclinaison, caractéristique et cause d'échec les moins réussies) ;
- la charge ;
- la meilleure cotation par semaine ;
- les douleurs, avec la liste des signalements et ✕ pour supprimer une erreur ;
- les mesures.

ⓘ explique chaque calcul.

**Outils d'une semaine** (dans le programme) :
- 📏 Mesures : ⓘ décrit chaque test, et la valeur précédente s'affiche à côté du champ.
- ⏸ Faire une pause : repousse la semaine et les suivantes de 1 à 4 semaines. La fenêtre montre les nouvelles dates, et les séances déjà commencées, faites ou sautées ne bougent pas.
- Copier · répéter.

**Partout.**
- ⋯ en haut de chaque écran regroupe les actions de l'écran et **Annuler** (les 30 derniers gestes).
- Les choix de 4 options ou moins sont des boutons. Au-delà, c'est une liste déroulante, c'est-à-dire le sélecteur de l'iPhone.
- La Bibliothèque, l'Aide, les Réglages et la Sauvegarde ont des sections repliables. La Bibliothèque et l'Aide ont une recherche.
- Le « ? » d'un écran ouvre l'aide de cet écran.
- Changer de page arrive en haut de la page ; le retour ‹ ramène où tu étais.

---

## 2. Installation

### 2.1 Mettre l'app en ligne (GitHub Pages)
1. Crée un compte sur github.com, puis un dépôt, par exemple `grimpe`. Il peut être public : il ne contient que l'app, pas tes données.
2. Dépose le contenu du dossier `grimpe` à la racine du dépôt (Add file › Upload files). Les dossiers `outil/` et `tests/`, ainsi que `Programme.xlsx`, peuvent rester sur le PC.
3. Dans le dépôt, va dans **Settings › Pages**. Choisis Source : *Deploy from a branch*, Branch : *main*, dossier */ (root)*, puis Save.
4. Après une ou deux minutes, l'adresse de l'app s'affiche : `https://ton-pseudo.github.io/grimpe/`.

### 2.2 Installer sur l'iPhone
1. Ouvre l'adresse **https://ton-pseudo.github.io/grimpe/** dans **Safari**. N'ouvre pas la page du dépôt github.com/… : c'est la liste des fichiers, pas l'app.
2. Touche **Partager › Sur l'écran d'accueil**.
3. Lance l'app depuis son icône. Elle fonctionne ensuite hors ligne.

⚠️ **Sur iPhone, les données de l'app sont liées à son icône.** Supprimer l'icône de l'écran d'accueil efface toutes les données de l'app. Avant de supprimer et de rajouter l'icône (par exemple pour corriger son image), fais une sauvegarde et vérifie-la (voir 3). Pour vérifier que Safari a bien la dernière version avant d'ajouter l'icône, regarde le numéro de version en bas de l'onglet Plus.

### 2.3 Mettre à jour
Remplace les fichiers dans le dépôt. À la prochaine ouverture, ou au retour dans l'app, un bandeau « Nouvelle version disponible — mettre à jour » apparaît ; un appui suffit. Tes données ne sont pas touchées.

---

## 3. Sauvegarde

Les données sont dans le téléphone (IndexedDB). Plus › Sauvegarde commence par une ligne d'état, puis trois sections.

**Automatique · GitHub** (recommandé). Après chaque séance, l'app pousse son document dans un dépôt **privé** à toi.
1. Crée un dépôt **privé**, par exemple `grimpe-donnees`.
2. Crée un jeton : photo de profil › **Settings** › tout en bas du menu de gauche, **Developer settings** › **Personal access tokens** › **Fine-grained tokens** › *Generate new token*.
   - *Repository access* : *Only select repositories*, puis ce seul dépôt.
   - *Permissions* › *Repository permissions* › *Contents* : **Read and write**.
3. Dans l'app, remplis le propriétaire, le dépôt, le chemin (par défaut `grimpe/grimpe.json`) et le jeton, puis touche « Enregistrer et tester ».

Le jeton reste sur ce téléphone : il n'est jamais dans le document ni dans les exports. Si tu perds le téléphone, révoque le jeton sur GitHub.

**Fichier.** Pour sauvegarder :
- « Exporter le fichier » partage le document complet (`grimpe-AAAA-MM-JJ.json`, le fichier seul). Dans Mail, vérifie que la pièce jointe est bien là avant d'envoyer : la taille de la sauvegarde est affichée à côté du bouton.
- « Copier les données » met tout le document dans le presse-papiers, à coller dans Notes ou dans un mail. C'est le plus sûr sur iPhone.

Pour restaurer : « Restaurer depuis un fichier » ou « Restaurer en collant le texte ».

Quand l'app est vide (nouvelle installation), le Programme propose tout de suite de restaurer. Sans sauvegarde GitHub, un rappel « Sauvegarder » apparaît en fin de séance si la dernière sauvegarde a plus de 7 jours. L'app demande aussi à l'iPhone de ne pas effacer son stockage de lui-même.

**Tout effacer.** Efface toutes les données de ce téléphone.

---

## 4. Calendrier

Plus › Calendrier donne un lien `webcal://…/programme.ics` : abonne-toi une fois, et les séances apparaissent dans le calendrier de l'iPhone.

Les alarmes d'un calendrier abonné sont désactivées par défaut : dans le compte de l'abonnement, décoche « Supprimer les alarmes ». Les heures et durées par défaut se règlent dans la feuille Paramètres de Programme.xlsx (`heure_voie`, `duree_voie`, `heure_bloc`…).

---

## 5. L'outil PC et Programme.xlsx

Installe d'abord la bibliothèque : `pip install openpyxl`. Ensuite, deux commandes :

```
python outil/grimpe.py app
    Programme.xlsx → data.js + programme.ics (+ version de sw.js). À pousser ensuite sur GitHub Pages.

python outil/grimpe.py rapport export.json
python outil/grimpe.py rapport --github proprietaire/depot/chemin/grimpe.json
    export de l'app → Suivi.xlsx ; reporte dans Programme.xlsx les séances modifiées ou créées dans l'app ;
    régénère data.js, sw.js et programme.ics aux dates réelles.
    Avec --github : GRIMPE_TOKEN=github_pat_… dans l'environnement (ou GRIMPE_GITHUB=… pour le chemin).
```

**Suivi.xlsx** met en page le bilan calculé par l'app, sans rien recalculer. Il contient :
- les séances et les tentatives (avec aisance, essais avant réussite, premier essai ; « inconnue » pour un passage sans date) ;
- les voies ;
- les niveaux, les feux verts, les douleurs, la charge et les mesures ;
- le programme.

**Nouveau programme** : change `date_debut` dans Paramètres, régénère, puis pousse. L'app propose d'exporter, puis de repartir. Les réglages, salles, passages hors séance et favoris sont gardés.

### La grammaire d'une séance
Une ligne par étape. Tout ce qui n'est pas entre accolades est du texte. Dans l'app, l'éditeur (⋯ › Modifier le plan, ou + Séance) écrit ces lignes pour toi.

```
## Voie (avec partenaire)                      variante (les lignes avant le premier ## sont communes)
> Échauffement voie                            routine (étapes dans l'onglet Routines)
! Thème de la semaine : pieds silencieux.      consigne (affichée dans « Consignes ›»)
3× Voie en 5b · « Travail au point » {voie 5b} {repos 4min} {effort}
2× « Gainage » {chrono 30s} {côté}
6× course lente {fractions 2min/2min}
Planche sur les coudes (s) {mesure planche}    un champ de mesure directement dans le plan
```

| Marqueur | Effet |
|---|---|
| `{voie 5b}` `{bloc 5}` `{voie}` | étape de grimpe et cotation visée ; les passages notés s'y rattachent, et ses cotations sont les « rangées rapides » de la carte Voies |
| `{repos 4min}` | repos entre passages (sinon le repos par défaut de l'activité, dans Réglages) |
| `{chrono 30s}` | bouton chrono |
| `{fractions 2min/2min}` | course / marche, répétée N fois |
| `{durée 15min}` | durée prévue (sinon estimée) |
| `{série 4}` | circuit : 4 blocs ou voies par passage |
| `{effort}` `{facile}` `{récup}` `{échauffement}` `{sécurité}` | couleur de l'étape (par défaut : facile) |
| `{feu 5c}` | rappelle l'état du feu vert correspondant |
| `{côté}` | chrono de chaque côté |
| `{mesure planche}` | champ de mesure dans le plan, enregistré dans les mesures de la semaine |

Un `« Nom d'exercice »` entre guillemets français devient un lien vers sa fiche dans la Bibliothèque. Un marqueur inconnu est signalé par l'outil et affiché tel quel.

---

## 6. Ce que calcule Progrès

Tous les calculs sont dans `js/analyse.js`, en fonctions pures et testées. Le téléphone calcule ; l'outil PC ne fait que mettre en page.

- **Voies différentes.**
  - Une voie de salle compte une fois, quel que soit le nombre de passages.
  - Sans voie de salle, la cotation, la couleur et le nom identifient la voie.
  - Un passage noté sur une ligne de cotation, sans voie, est une **voie déjà faite** : il ne gonfle pas le nombre de voies différentes, sauf s'il est marqué « nouvelle voie ».
- **Taux de réussite.**
  - « Avec sec » n'est pas une réussite.
  - Les essais indiqués après une réussite (« 4ᵉ essai » = 3 échecs) comptent dans les taux, sans doublon avec les échecs déjà notés.
  - Une deuxième réussite est une répétition : seuls les échecs depuis la dernière réussite comptent.
- **Niveau consolidé** : la cotation la plus haute réussie à au moins `consolide_taux` (70 %) sur au moins `consolide_essais` essais (5).
  - Il est calculé séparément en voie et en bloc, en vertical et en dévers (léger dévers, dévers, surplomb, fort dévers, toit).
  - 5b+ compte comme 5b.
- **Feux verts** : projet en 5c, premier essai en 6a, projet de bloc 6A, plus de volume. Chaque feu a ses critères et passe au vert quand tous sont atteints. La projection « à ce rythme » compare avec il y a quatre semaines, et n'apparaît qu'après quatre semaines de programme.
- **À travailler** (sur les `faible_semaines` dernières semaines) : l'inclinaison, la caractéristique et la cause d'échec les moins réussies, avec des exercices conseillés.
- **Charge** : minutes × effort (5 si l'effort n'est pas noté). Le rapport compare les 4 dernières semaines complètes aux 4 précédentes ; au-dessus de 1,3, un signal de vigilance s'affiche.
- **Forme, douleurs, vigilance** : elles utilisent le jour où la séance a vraiment été faite. Les épisodes de douleur se regroupent par zone et se closent après `episode_ecart` jours sans signalement.
- **Aisance** : sur tes 10 dernières réussites notées, l'app dit si une cotation passe facilement (« le 5c est à portée ») ou encore à l'arraché.

Les seuils se règlent dans la feuille Paramètres de Programme.xlsx.

---

## 7. Pour développer

```
index.html  style.css  sw.js  manifest.webmanifest  icone*.{svg,png}  apple-touch-icon.png
data.js  programme.ics          générés par l'outil, ne pas modifier à la main
js/
  app.js        démarrage, état d'écran, rendu, routage des actions, menu ⋯, nuancier, mise à jour
  store.js      document unique versionné, migrations, IndexedDB, annulation (30 gestes)
  dates.js      dates « AAAA-MM-JJ », semaines du programme
  parseur.js    grammaire d'une séance ↔ étapes structurées
  programme.js  programme effectif (data.js + opérations), durées, états, clôture automatique
  analyse.js    tous les calculs de Progrès
  salles.js     salles, secteurs, voies, palette, caractéristiques, façon de coter
  infos.js      textes des explications ⓘ
  sync.js       sauvegarde GitHub ; export.js : export / import JSON
  minuteur.js   repos, chrono, fractions, routine guidée
  html.js       gabarit qui échappe tout ; blocs repliables mémorisés ; listes déroulantes ; ligne de choix
  ecrans/       seance  programme  progres  plus  mur  editeur  fenetres
outil/grimpe.py
tests/          *.test.js (node --test) ; navigateur/smoke.py ; navigateur/mise_a_jour.py
```

**Le document** (stocké sur le téléphone, et exporté tel quel) :

```js
{ version: 2, programmeId,
  reglages: { dateDebut, repos, son, reposAuto, ecranAllume, grand, raccourciRepos, salleDuJour, salleParDefaut, sync: { owner, repo, chemin, auto }, params },
  seances: { "<id>": { version, debut, fin, pauseTotale, dateReelle, statut, raison, salle,
      tentatives: [ { t, k, disc, cot, cotSalle, profil, res: "ok"|"sec"|"ko", sec, style, cause, couleur, nom, salle, voieId,
                      aisance, essaisAvant, premierEssai, nouvelle, approx } ],     // style + essaisAvant viennent de « Comment ? »
      effort, duree, notes, mesures, douleur: { avant, zoneAvant, pendant: [ { zone, niveau } ], apres, zone }, recup } },
  ops: [ { id, op: "set"|"del"|"pause"|"date", cible, … } ],
  mesures: { "<semaine>": { planche, course, tractions, genou, squat, notes } },
  salles: [ { id, nom, type, couleurs, cotation, secteurs: [ { id, nom, profil } ],
              voies: [ { id, disc, cot, cotSalle, couleur, nom, profil, carac: [], secteurId, ordre, statut, etoile, ouverte, demontee } ] } ],
  passagesAnciens: [ { id, t, date, dateInconnue, disc, cot, cotSalle, profil, res, couleur, nom, salle, voieId, aisance, essaisAvant, premierEssai, nouvelle } ],
  feuxVus, favoris, dernierExport, derniereSync }
```

Le jeton GitHub et l'état des blocs repliés sont dans le stockage local du navigateur, pas dans le document. Pour changer le schéma, ajoute une entrée dans `MIGRATIONS` de `store.js` et incrémente `VERSION_DOC`.

**Tests**

```
npm test                                  # 55 tests : parseur, dates, programme, analyse (voies, essais, caractéristiques…), store, sync, salles
python tests/navigateur/smoke.py          # parcours complet dans Chrome (CHROME=/chemin/vers/chrome si besoin), captures dans tests/navigateur/captures
python tests/navigateur/mise_a_jour.py    # nouvelle version publiée → bandeau → mise à jour
```

Pour simuler un jour donné, tape dans la console : `(await import('./js/app.js')).ctx.state.dateSimulee = '2026-11-11'`.

---

## 8. Limites connues

- Une app web ne sonne pas quand l'écran est verrouillé. Le repos est fait pour être regardé : plein écran, heure de fin affichée, écran maintenu allumé. Pour une vraie sonnerie, crée dans Raccourcis un raccourci « Repos » (*Obtenir les nombres dans l'entrée* → *Démarrer le minuteur*) et indique son nom dans Réglages : un bouton 🔔 iPhone apparaît alors à côté du repos.
- Le glisser-déposer du mur se fait par la poignée ⋮⋮, pour que le reste de la tuile fasse défiler la page.
- Suivi.xlsx contient les chiffres ; les graphiques au-delà de la charge sont à faire dans le tableur.
- Les tests tournent dans Chrome ; vérifie sur l'iPhone le partage de fichier, l'abonnement au calendrier et les listes déroulantes multiples.
