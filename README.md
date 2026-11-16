# Grimpe 8.4 — l'app d'escalade, version complète

Même usage que l'app 6.5 : le programme s'écrit dans **Programme.xlsx**, l'app sur l'iPhone sert à faire les séances, un outil Python sur le PC fait le rapport. Même stack : HTML/CSS/JS sans dépendance, PWA sur GitHub Pages, données sur le téléphone, Python + openpyxl.

Deux couches ont été refaites, dans cet ordre :

1. **La structure** (v7) — un seul document versionné, un seul format d'export, les règles de calcul écrites une seule fois, une grammaire explicite, un identifiant stable par séance, des dates en jours entiers, des modules et des tests.
2. **Le point de vue du grimpeur** (v8) — pendant la séance l'app ne demande rien, une voie se note en la touchant, l'app se souvient des voies et des projets, la sauvegarde se fait toute seule, le programme est dans le calendrier, les progrès tiennent en trois phrases.

## Version 8.4 — ouverture sur le programme, choix en lignes, salles repliées, aisance

**Ouverture.** L'app s'ouvre sur le Programme, avec une carte **Aujourd'hui** en haut (la séance du jour, sinon la prochaine) : un appui l'ouvre. Une séance en cours s'ouvre directement.

**Programme.** ⋯ à droite de chaque séance : bilan, modifier le plan, déplacer, copier, sautée, et Supprimer pour une séance créée ou copiée. « + Passage hors séance » à côté de « + Séance ». Une séance de voie faite en variante bloc s'affiche « Bloc » partout (`activiteAffichee`).

**Séance.** La carte Voies (ou Blocs) a trois parties : la ligne « Salle : … › » (tes salles du bon type, « Salle inconnue », « + Nouvelle salle… »), les cotations de la séance toujours présentes (✓ / sec / ✗ en voie, ✓ / ✗ en bloc ; autour du niveau consolidé si la séance n'en prévoit pas), puis les voies de la salle en groupes repliables (★ À essayer, Projets, En 5b…, Autres). Sous la carte Maintenant : « Consignes › » (toujours là, « Pas de consigne pour cette séance » sinon) et « Détail de l'étape › ».

**Après une réussite.** ✓ reste un seul appui : le passage est enregistré, la fenêtre reste ouverte avec des lignes facultatives : aisance (Facile · Correct · Arraché), essais avant réussite (calculés d'après tes passages s'ils sont connus, sinon 1 / 2 / 3 / 4 / 5+ / Inconnu) et date du premier essai (ou « inconnue »). « Fermer » suffit. La tuile affiche « ✓ facile » ; la fiche de la voie montre aisance et essais dans son historique, et une phrase de Progrès dit si tes réussites sont souvent arrachées.

**Passages hors séance** (ex-« Hors app ») : « + Passage hors séance » dans le Programme et dans Progrès (où vit la liste) ; « + Passage d'un autre jour » dans la fiche d'une voie, pré-rempli. Date ou « Date inconnue » : sans date, le passage compte dans les niveaux, les projets et les feux verts, pas dans la charge ni dans le bilan de la semaine.

**Choix en lignes.** Partout où il y a plusieurs options : une ligne « Libellé : valeur › » qui s'ouvre au toucher et se referme au choix (salle, zone de douleur, cause, raison d'une séance sautée, profil, secteur, type de salle, façon de coter, discipline, style). Les choix rapides restent des boutons (✓ / sec / ✗, échelles 0–10, forme).

**Salles.** La liste est en cartes : couleurs présentes, nombre de voies et de blocs, secteurs, dernière séance, ✎. Dans une salle : barre collante (Tout / Voies / Blocs, + Voie, Sélectionner) ; le reste dans ⋯ (plusieurs voies, + Secteur, Ranger, démontées, modifier la salle). Les secteurs sont repliés avec un résumé (nombre, pastilles de couleur, étendue des cotations) ; l'app retient ceux que tu as ouverts et rouvre celui où tu viens d'ajouter une voie.

**Couleurs.** 12 couleurs de base ; un appui long montre leurs nuances (42 teintes, tous les anciens noms gardés).

**Harmonie.** ⋯ en haut sur chaque écran (actions de l'écran + Annuler ; la tuile Annuler quitte Plus). Progrès en sections repliables (les phrases restent ouvertes). Bibliothèque : recherche et catégories repliables. Plus : Sauvegarde, Salles, Calendrier (inchangé), Bibliothèque, Réglages, Aide.

**Inchangé, comme demandé** : l'abonnement calendrier et tout ce qui touche à la sauvegarde (fichier, GitHub, jeton).

**Outil PC** : la feuille Tentatives de Suivi.xlsx a trois colonnes de plus (Aisance, Essais avant réussite, Premier essai) ; un passage sans date y figure « inconnue ».

## Version 8.3 — modifier et supprimer salles, secteurs et voies

**Une règle pour supprimer** : l'action est faite tout de suite et un message « Annuler » reste 8 secondes (puis Plus › Annuler). Plus de boîte de confirmation. Quand il y a un vrai choix à faire, une fenêtre le pose :
- **une voie avec des passages** : supprimer la voie en gardant ses passages (détachés de la voie, avec leur couleur et leur cotation) ou avec ses passages ;
- **un secteur avec des voies** : garder les voies (sans secteur), ou les supprimer aussi, en gardant ou non leurs passages ;
- **une salle avec des passages** : ses voies partent avec elle ; ses passages sont gardés ou supprimés ;
- plusieurs voies sélectionnées : même choix que pour une voie.

**Fiche de voie** : un résumé en haut, puis une ligne par réglage (discipline, couleur, cotation, profil, secteur, nom, salle, historique) qu'on touche pour la modifier. En bas : ★ À essayer, ⧉ Dupliquer, Démontée (Remonter en tête pour une voie démontée), et Supprimer à part. « Salle » permet de déplacer une voie notée dans la mauvaise salle : ses passages suivent. Depuis la séance : « Modifier la voie ».

**Secteurs** : toucher l'en-tête d'un secteur l'ouvre ; ↑ Monter / ↓ Descendre ; Renouveler et Supprimer dans une zone séparée.

**Salles** : ✎ à côté de chaque salle dans la liste ; nom et type en haut, « Façon de coter » et « Couleurs propres » repliées ; une couleur propre se renomme ou change de teinte (voies, passages et équivalences suivent) et se supprime si plus aucune voie ne l'utilise.

**Sélectionner** (ex-Classer) : plusieurs voies → Secteur, Profil, Cotation, Démonter, Supprimer ; « Tout » par secteur.

Fonctions dans `js/salles.js` (`supprimerVoies`, `supprimerSecteur`, `supprimerSalle`, `dupliquerVoie`, `deplacerVoieSalle`, `deplacerSecteur`, `renommerCouleur`, `supprimerCouleur`), testées dans `tests/salles.test.js`.

## Version 8.2 — ce qui revient de la 6.4, sans rien retirer de la 8

**Protections.** La pause ne décale que les séances pas encore commencées (l'opération garde la liste `ids`, l'outil PC fait de même dans Programme.xlsx). Modifier le plan d'une séance commencée fait suivre chaque saisie à sa ligne (même texte, sinon même titre : `correspondanceCles`, `remapperSaisie`).

**Séance.** Une case ✓ par étape, des ronds pour une étape répétée hors grimpe (3× gainage = 3 ronds) ; une étape de voie est faite quand on la coche ou quand tous ses passages sont notés, et peut être décochée. « ✓ Fait · suivant » coche l'étape en cours et passe à la prochaine pas encore faite. Rien n'est obligatoire et aucune analyse n'en dépend (champ `faites` de la saisie, -1 = décochée à la main). Frise du déroulé sous le bandeau. Pendant une séance de grimpe, le plan est replié sous la carte Maintenant. Le bilan donne les heures de début et de fin, et ne montre que les cotations de la séance (« Une autre cotation » pour le reste). Après « Plus tard », la carte « hier » reste repliée en une ligne jusqu'au lendemain. ★ « À essayer » sur une voie (fiche ou fenêtre rapide) : en tête de la carte des voies, retirée d'office quand la voie est réussie.

**Navigation.** Glisser vers la gauche ou la droite pour changer de séance (pas pendant une séance en cours). Une séance ouverte depuis le programme a « ‹ Programme » pour y revenir. « ? » dans l'en-tête ouvre l'aide à la section de l'écran affiché, et le retour rend l'écran tel quel.

**Programme.** ⋯ › Copier vers une autre date ; outils de semaine › Copier · répéter (une semaine qui contient une séance commencée n'est jamais écrasée). Encadré « À faire » dans la semaine en cours (séances à régler, mesures du week-end) et bilan de la semaine dès qu'une séance est faite.

**Salles.** + Plusieurs voies (une série d'un coup), Classer (sélection multiple → secteur ou démontées), Ranger (toute la tuile se déplace ; la poignée ⋮⋮, agrandie, reste). Le profil proposé est celui du secteur, sinon le plus fréquent parmi ses voies.

**Apparence.** Couleurs au contraste ≥ 4,5:1 (vert #2E7D32, gris #6B7780, texte foncé sur l'orange). Échelles 0–10 sur une ligne. Icônes dessinées à la place de ▶ ⏱ ⚠ (que l'iPhone affiche en émojis). En-tête et onglets à la couleur de l'app. Étapes sur fond pastel de leur type. Pictogramme d'inclinaison sur les tuiles. Grand affichage limité à la carte Maintenant, aux tuiles de la séance et au minuteur. Le message du bas passe en haut quand le minuteur est plein écran. « À ce rythme… » seulement après 4 semaines de programme.

**Corrigé au passage.** Les tuiles de voies étaient très hautes (classe `histo` partagée avec l'histogramme de charge) ; une étape de voie terminée par ses passages ne pouvait pas être décochée.

## Ce que l'app fait, vu du mur

**Avant.** L'écran d'accueil est la séance du jour : ▶ Commencer, et c'est parti. Pas de questionnaire. S'il existe une variante (« Remplacement bloc », « Allégée »), elle est à un appui, et l'app la propose d'elle-même quand une douleur récente ou une forme basse le justifie.

**Pendant.** La carte « Maintenant » montre l'étape où tu en es, ses minuteurs (repos, chrono, fractions, routine guidée) et « Suivant » ; ⤵ sur n'importe quelle étape veut dire « j'en suis là ». Rien à cocher, jamais. La forme du jour se dit d'un appui (🙂 😐 😣), et seulement « pas top » demande quoi. Une voie se note en touchant sa tuile dans la carte des voies : ✓, ou ✗ puis la cause en un appui. Une voie que la salle ne connaît pas encore : couleur, niveau, « Créer et ✓ ». Sans salle configurée, une rangée de cotations avec ✓ / sec / ✗ fait le même travail. ⚠ Douleur, ■ Fin.

**Les projets.** La carte des voies commence par les voies tentées et pas encore enchaînées, avec le nombre d'essais et la cause principale ; puis les voies de la salle à la cotation visée par la séance. Au fil des semaines, l'app devient la mémoire du mur.

**Après.** ■ Fin : effort, douleur après, et « en gros ce que tu as grimpé » si tu n'as rien noté — trois appuis. Une séance restée ouverte se ferme toute seule après quatre heures. Le lendemain, une séance oubliée revient en une carte : faite, sautée, plus tard. L'app ne remonte jamais plus loin que la dernière séance passée, et il n'y a plus de point d'exclamation orange.

**Les progrès.** D'abord trois ou quatre phrases : la semaine, le niveau acquis, le point faible, le prochain cap avec une projection (« à ce rythme, dans trois semaines »). Quand un feu passe au vert, une carte le dit une fois. Le détail (feux verts, niveaux, charge, douleurs, mesures) reste dessous.

**Les salles.** Une salle garde ses voies par secteur, en tuiles qu'on range au doigt (poignée ⋮⋮, glisser-déposer), avec sa façon de coter : comme l'app, ses propres niveaux, par couleurs (la couleur est le niveau), ou aucune. « Renouveler » un secteur passe ses voies en démontées sans rien effacer. L'historique de chaque voie est dans sa fiche.

**La sauvegarde.** Avec un dépôt GitHub privé et un jeton, le document part tout seul après chaque séance ; l'historique git fait les versions ; le PC le lit directement. Sinon, l'export fichier reste à deux appuis, et c'est le même document.

**Le calendrier.** L'outil écrit `programme.ics` ; tu t'y abonnes une fois, les rappels viennent de l'iPhone.

## Arborescence

```
index.html  style.css  sw.js  manifest.webmanifest  icone*.{svg,png}
data.js  programme.ics        générés par l'outil — ne pas modifier à la main
js/
  app.js        démarrage, état d'écran, rendu, routage des actions, synchronisation (aucune règle métier)
  store.js      document unique (v2), migrations numérotées, IndexedDB, annulation
  dates.js      dates « AAAA-MM-JJ », semaines du programme
  parseur.js    grammaire d'une séance ↔ étapes structurées (dans les deux sens)
  programme.js  programme effectif (data.js + opérations), durées, états, séance à régler, clôture automatique
  analyse.js    feux verts, forme, niveaux, douleurs, charge, points faibles, voies, projets, projection, phrases
  salles.js     salles, secteurs, voies, façon de coter, rangement
  sync.js       sauvegarde GitHub (API contents), jeton hors document
  export.js     export/import JSON
  minuteur.js   repos, chrono, fractions, routine guidée
  html.js       gabarit HTML qui échappe tout
  ecrans/       seance.js  programme.js  progres.js  plus.js  mur.js  editeur.js  fenetres.js
outil/grimpe.py Programme.xlsx → data.js + programme.ics ; export (fichier ou --github) → Suivi.xlsx, report des modifs, ics aux dates réelles
tests/          *.test.js (node --test, 47 tests) ; navigateur/smoke.py (parcours complet dans Chrome) ; navigateur/mise_a_jour.py
Programme.xlsx  ton programme (identifiants et syntaxe convertis au premier passage de l'outil)
```

## Mise en route

**PC** : `pip install openpyxl`, puis `python outil/grimpe.py app`. Le premier passage attribue un identifiant à chaque séance (colonne `Id`, masquée) et convertit l'ancienne syntaxe en marqueurs ; il réécrit Programme.xlsx. Lis les avertissements (routines, exercices ou marqueurs inconnus) et relis les lignes où la cotation a été devinée.

**Hébergement** : pousse le dossier sur GitHub Pages (`outil/`, `tests/` et `Programme.xlsx` peuvent rester hors ligne). iPhone : Safari → Partager → Sur l'écran d'accueil.

**Sauvegarde automatique** : crée un dépôt GitHub **privé** (par exemple `grimpe-donnees`), puis un jeton *fine-grained* limité à ce dépôt avec la permission *Contents : Read and write* ; dans l'app, Plus › Sauvegarde : propriétaire, dépôt, chemin, jeton. Sur le PC : `export GRIMPE_TOKEN=github_pat_…` puis `python outil/grimpe.py rapport --github proprietaire/grimpe-donnees/grimpe/grimpe.json` (ou `GRIMPE_GITHUB=…` dans l'environnement). Le jeton n'est jamais dans le document ni dans les exports.

**Calendrier** : Plus › Calendrier donne le lien `webcal://…/programme.ics`. Les alarmes d'un calendrier abonné sont désactivées par défaut sur iPhone : dans le compte de l'abonnement, décoche « Supprimer les alarmes ». Heures et durées par défaut (18 h ; 90 min en salle, 30 à la maison, 45 de course) se changent dans Paramètres de Programme.xlsx : `heure_voie`, `duree_voie`, `heure_bloc`…

**Chaque semaine** (ou quand tu veux) : `python outil/grimpe.py rapport …` produit `Suivi.xlsx`, reporte dans Programme.xlsx les séances modifiées ou créées dans l'app, régénère `data.js`, `sw.js` et `programme.ics` — à pousser ensuite.

**Nouveau programme** : change `date_debut` dans Paramètres, régénère, pousse. L'app propose d'exporter puis de repartir ; réglages, salles, passages hors app et favoris sont gardés.

**Minuteur qui sonne écran verrouillé** (facultatif) : une app web n'en est pas capable. Crée dans Raccourcis un raccourci « Repos » : *Obtenir les nombres dans l'entrée* → *Démarrer le minuteur* (secondes), et mets son nom dans Réglages. Un bouton 🔔 iPhone apparaît à côté du repos ; il lance le minuteur natif, qui sonne, mais quitte l'app une seconde. Sans ça, le repos est conçu pour être regardé : plein écran, heure de fin affichée, écran maintenu allumé.

## La grammaire d'une séance

Une ligne par étape ; tout ce qui n'est pas entre accolades est de la prose. Dans l'app, l'éditeur de plan (⋯ › Modifier le plan, ou + Séance) écrit ces lignes pour toi ; le « mode texte » est là pour qui préfère.

```
## Voie (avec partenaire)                      variante (les lignes avant le premier ## sont communes)
> Échauffement voie                            routine (étapes dans l'onglet Routines)
! Thème de la semaine : pieds silencieux.      consigne
3× Voie en 5b · « Travail au point » {voie 5b} {repos 4min} {effort}
2× « Gainage » {chrono 30s} {côté}
6× course lente {fractions 2min/2min}
Planche sur les coudes (s) {mesure planche}    un champ de saisie directement dans le plan
```

| Marqueur | Effet |
|---|---|
| `{voie 5b}` `{bloc 5}` `{voie}` | étape de grimpe, cotation visée ; les passages notés s'y rattachent |
| `{repos 4min}` | repos entre passages (sinon le repos par défaut de l'activité) |
| `{chrono 30s}` | bouton chrono |
| `{fractions 2min/2min}` | course / marche, répété N fois |
| `{durée 15min}` | durée prévue (sinon estimée) |
| `{série 4}` | circuit : 4 blocs ou voies par passage |
| `{effort}` `{facile}` `{récup}` `{échauffement}` `{sécurité}` | couleur de l'étape (défaut : facile) |
| `{feu 5c}` | rappelle l'état du feu vert correspondant |
| `{côté}` | chrono de chaque côté |
| `{mesure planche}` | champ de mesure dans le plan, enregistré dans les mesures de la semaine |

`« Nom d'exercice »` entre guillemets français devient un lien vers la fiche. Un marqueur inconnu est signalé par l'outil et affiché tel quel, jamais interprété.

> La feuille « Lisez-moi » de Programme.xlsx décrit encore l'ancienne syntaxe : à remplacer par ce tableau.

## Le document (ce qui est stocké)

```js
{ version: 2, programmeId: "2026-11-09",
  reglages: { dateDebut, repos: { Voie: 300, Bloc: 180, … }, son, reposAuto, ecranAllume, grand, raccourciRepos, salleParDefaut: { Voie: "<salle>" },
              sync: { owner, repo, chemin, auto }, params },          // le jeton GitHub est dans localStorage, pas ici
  seances: { "<id>": { version, debut, fin, pauseTotale, dateReelle, statut: "sautee", raison, approx, salle, curseur,
      tentatives: [ { t, k, disc, cot, cotSalle, profil, res: "ok"|"sec"|"ko", sec, style, cause, couleur, nom, salle, voieId, approx } ],
      effort, duree, notes, mesures: { planche: 52 },
      douleur: { avant, zoneAvant, pendant: [ { t, zone, niveau } ], apres, zone },
      recup: { doigts, coudes, epaules, energie, motivation } } },
  ops: [ { id, op: "set"|"del"|"pause"|"date", cible, … } ],
  mesures: { "<semaine>": { planche: 52 } },
  salles: [ { id, nom, type, couleurs: [ { nom, hex } ], cotation: { Voie: { mode: "standard"|"liste"|"couleurs"|"aucune", liste: [ { salle, app } ] }, Bloc },
             secteurs: [ { id, nom, profil } ], voies: [ { id, disc, cot, cotSalle, couleur, nom, profil, secteurId, ordre, statut, ouverte, demontee } ] } ],
  passagesAnciens: [ { id, date, disc, cot, profil, res, couleur, nom, salle } ],
  feuxVus: { voie5c: "2026-12-03" }, favoris: [], dernierExport, derniereSync: { quand, ok, erreur } }
```

Changer le schéma = ajouter une entrée dans `MIGRATIONS` de `store.js` et incrémenter `VERSION_DOC` (la migration 1 → 2 retire la comptabilité d'étapes et ajoute la façon de coter des salles). L'export est `{ format: "grimpe-export", doc, programme, bilan }` ; `grimpe.py rapport` met en page `bilan` tel quel, voies et phrases comprises, sans rien recalculer.

## Tests

```
npm test                                 # 47 tests : parseur (aller-retour), dates, programme effectif, états, clôture, analyse, projection, phrases, store, migrations, sync
python tests/navigateur/smoke.py         # Chrome : salle avec cotation par couleurs, secteurs, voies, glisser-déposer ; séance sans questionnaire, forme en un appui,
                                         # voies en un appui, nouvelle voie, curseur, repos, douleur, bilan ; carte « hier » ; éditeur structuré et {mesure} ;
                                         # progrès (phrases, projets) ; passages hors app ; grand affichage ; calendrier ; export, rechargement, effacement, restauration
```

Pour tester un jour donné : console → `(await import('./js/app.js')).ctx.state.dateSimulee = '2026-11-11'`.

## Décisions prises, et pourquoi

- **Rien à cocher pendant la séance.** Les coches d'étape n'alimentaient aucune analyse ; le rapport 6.5 ne les a jamais lues. Ce qui compte est noté par les voies et le bilan. Le curseur est une aide, pas une obligation : un passage noté sans curseur se rattache tout seul à la première étape de grimpe qui n'a pas son compte.
- **Les passages « en gros » comptent comme des voies différentes.** C'est ce qui permet au feu vert 5c d'avancer sans noter chaque voie. Pour un feu vert strict, note les voies dans la salle.
- **Une tentative garde la cotation de la salle et son équivalent app.** Niveaux et feux verts raisonnent sur l'équivalent ; les tuiles affichent ce que la salle affiche. Sans équivalent, la tentative compte dans les totaux et les projets, pas dans les niveaux.
- **Le repos est fait pour être regardé.** Une PWA ne sonne pas écran verrouillé ; plutôt que faire semblant, l'écran de repos affiche l'heure de fin, et le raccourci iOS est là pour qui veut une vraie sonnerie.
- **Un jeton sur le téléphone, des douleurs dans un dépôt privé.** C'est le prix de la sauvegarde sans corvée. Le jeton ne peut écrire que dans ce dépôt ; révoque-le sur GitHub si le téléphone disparaît. Celui qui ne veut pas de ça garde l'export fichier.
- **Pas de reprise des données 6.5.** Une semaine de programme, c'est trois ou quatre séances : Plus › Hors app les ressaisit en deux minutes, et Suivi.xlsx 6.5 garde l'historique sur le PC. Un convertisseur aurait coûté plus qu'il ne rapportait.
- **Pas de bilan de compétences.** Huit échelles subjectives par bloc, que les voies disent mieux. Les anciennes valeurs, s'il y en a, restent lisibles dans le rapport.

## Ce qui n'y est pas

Le rapport Suivi.xlsx n'a pas de courbes au-delà de la charge (les chiffres y sont, le tableur fait le reste). Les rappels ne passent que par le calendrier. Le glisser-déposer du mur demande la poignée ⋮⋮ (c'est voulu : le reste de la tuile défile la page). Rien n'est testé sur un vrai iPhone : le parcours tourne dans Chrome ; Safari peut réserver une surprise sur la feuille de partage ou le webcal, à vérifier à la première semaine.
