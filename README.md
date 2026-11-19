# Grimpe 8.33 — l'app d'escalade

Une app pour iPhone qui suit un programme d'entraînement à l'escalade (voie, bloc, maison, course) :
- **Programme.xlsx** sur le PC décrit le programme ;
- **l'app** sert pendant les séances et garde la mémoire des salles et des voies ;
- **un outil Python** produit le rapport **Suivi.xlsx**.

L'app est une page web installée sur l'écran d'accueil (PWA). Elle est écrite en HTML, CSS et JavaScript, sans dépendance. Elle fonctionne hors ligne, et toutes les données restent sur le téléphone, sauf si tu actives la sauvegarde GitHub.

---

## 1. Ce que fait l'app

**Onglets.** En bas : **Programme · Salles · Progrès · Plus**. Une séance s'ouvre depuis la carte « Aujourd'hui » du Programme (et l'app s'ouvre directement sur une séance en cours). Pendant une séance, une **bande « En cours »** dans la couleur de l'activité reste au-dessus des onglets sur tous les écrans, par exemple « ▶ Bloc · étape 3/7 · 42 min », avec le repos ou le chrono qui tourne : un appui ramène à la séance.

**Plus** regroupe le reste en trois parties : Contenu (Bibliothèque), Mes données (Sauvegarde, Calendrier), L'app (Réglages, Aide).

**Nouveautés 8.33** (fin de l'audit).
- **Boutons** : tous les « + … » ont le style Ajout (ocre clair) ; un seul bouton principal par écran ou fenêtre (« Faite › » des séances à régler et « Sauvegarder › » passent en secondaire/ajout).
- **Plus** : les entrées ont le même modèle que les autres cartes (pleine largeur, liseré, titre + résumé, icône sans carré). La carte de salle turquoise de « Salles » ne change pas.
- **Assistant** : une seule sortie, la flèche ‹ en haut (plus de « Fermer » en bas à la 1re étape).
- **Programme** : sous la bande des jours, le détail des séances de la semaine est replié (« ▸ Détail des 5 séances »).
- **Progrès** : la courbe du niveau consolidé vérifiée à l'écran (clair et sombre).
- Arrondis et hauteurs : unifiés partout, sauf, volontairement, la frise et les éléments ronds ou carrés de taille fixe (ronds, cases ✓, pastilles), qui seraient déformés.

**Nouveautés 8.32** (audit : style, organisation, séance allégée).
- **Séance** : un seul élément blanc dans la carte colorée (« Suivante ›») ; lignes de cotes, outils et plan en voile translucide ; ✓ ✗ plus compacts ; cotes triées de la plus facile à la plus dure ; « Une autre cotation » en grille, un appui ajoute ou retire ; étape sans cote : une seule ligne « + Noter un passage ».
- **Corrections** : le message sur une fenêtre ouverte ne remplit plus l'écran ; bouton « mettre à jour » lisible en sombre ; titre du menu de séance au jour réel.
- **Style** : une seule échelle (7 tailles de texte, 3 arrondis, 2 hauteurs de bouton, 3 couleurs de résultat) ; « Grand affichage » agrandit tout ; rôles des boutons (principal, secondaire, + ajout ocre clair, danger, lien) ; filtres à 2–3 choix en segments ; « Aujourd'hui » sans double cadre ; textes explicatifs courts + « ▸ Pourquoi ? » ; contrastes du mode sombre.
- **Organisation** : « + Séance » à côté de « Cette semaine · Prochaine séance » ; Options du mur : « + Ajouter plusieurs voies… » (par niveau, ou une par une) ; écran sans action à lui : « ↶ Annuler » à la place d'« Options » ; onglet Salles : une seule salle → son mur ; « N séances passées sans nouvelles · régler › » ; éditeur de séance plein écran ; Calendrier dans Sauvegarde ; bilan : « Effort : à choisir ».
- **Progrès** : courbe du niveau consolidé (voie, bloc) dans « Niveau consolidé » ; douleur légère (≤ 3/10) en orange ; « Prochaine séance dure : Ven. 20/11 ».
- **Expérience** : la séance du jour s'ouvre toute seule à la première ouverture du jour ; rappel de sauvegarde après 3 séances (ouvre la page Sauvegarde, la sauvegarde elle-même ne change pas) ; jours de la bande de la semaine à toucher ; écran de fin de séance (durée, passages, meilleure réussite, feux verts). Le thème « Automatique (comme l'iPhone) » existe déjà dans Réglages › Affichage.
- La carte de salle turquoise de « Salles » ne change pas.

**Nouveautés 8.31** (retours de la première séance en 8.30).
- **Programme** : « Prochaine séance » est un bouton à côté de « Cette semaine » (la vraie prochaine à faire) ; la carte « Aujourd'hui » ne montre que les séances du jour, y compris une séance faite en avance (« prévue ven. 20/11 · ✓ faite en 1 h 12 ») ; « semaine 1 » au lieu de « semaines 1 → 1 » ; l'en-tête ocre du bloc en cours remplit la carte.
- **Séance faite un autre jour** : datée du jour réel partout (titre, bilan), avec « prévue … ».
- **Routines** : leur genre vient de la bibliothèque (Contrôle des doigts = sécurité, Coudes après la séance = récupération) : bonnes couleurs, et plus de lignes de cotes pendant ces routines.
- **Étapes** : « Suivante » marque l'étape **sautée** (ou « 1/3 · arrêtée ») dans le plan et la frise ; « ✓ Fait » sur une étape de grimpe note un passage réussi (« ✓ Fait · 1/2 »).
- **Cote absente de la salle** (6A dans une salle 1–9) : les deux niveaux de la salle qui l'encadrent, avec leurs tuiles ; idem dans le bilan.
- Tête de la carte : nom, puis chrono et forme, puis la salle sur toute la largeur ; ⓘ fixé à droite du titre ; rappel de consigne seulement s'il n'est pas déjà visible ; étape « Essai sur Projet » : tes projets et ★ visibles d'office ; plan plus compact (ronds sur une ligne).

**Nouveautés 8.30** (séance plus lisible).
- **Avant** : plus de cartes « Blocs » et « Plan de séance » : la **salle** se choisit dans une liste en tête de la bannière, le **plan** est dans la bannière (dépliable).
- **Pendant** : ce qu'il faut faire **maintenant** en grand ; ⓘ à côté du titre pour le détail ; « Guidée » devient **Chrono** ; **✓ Fait** (vert, à gauche) et **Suivante ›** (blanc, à droite) toujours à la même place ; les **cotes à noter sous les boutons**, leurs voies **repliées** (un appui sur la cote) ; le plan de séance d'origine en bas de la carte, replié ; une consigne qui parle de la cote de l'étape est rappelée sous le titre.
- **Correction** : à la dernière étape, l'app ne revient plus au début (« Terminer › » mène au bilan).
- « Aujourd'hui » : une carte repliée sous la séance (corriger, « + encore », après la séance « + Un passage oublié… »).
- **Options du Programme** : « Hors séance… » (la liste et « + Passage hors séance ») remplace les deux entrées.
- Mise à jour : si la feuille de style est restée d'une ancienne version (boutons blancs sur blanc), l'app vide son cache et se recharge une fois — jamais les données ; sinon elle le dit.

**Nouveautés 8.29** (Programme allégé, séance tout-en-un).
- **Programme** : l'en-tête du bloc en cours en couleur de l'app ; un seul bouton « Cette semaine » ; **Options** : + Séance, + Hors séance, Passages hors séance, **Modifier une semaine…** (bloc et semaine en listes, raccourcis « Cette semaine » / « Semaine ouverte » : Mesures, Faire une pause, Copier · répéter) et **Modifier un bloc…** (Modifier, Retirer).
- **Nouvelle séance** : comme l'assistant, une ligne « libellé · réglage » de même largeur, listes déroulantes.
- **Séance – Maintenant** : le plan est dans la carte (étapes faites au-dessus, à venir dessous, un appui pour y aller) ; une étape répétée ou une routine se fait une fois après l'autre (« ✓ Fait · 2/3 », sous-étape affichée) avec « Étape suivante » toujours à part ; une étape de grimpe propose sa cote avec ✓ (sec) ✗ et les tuiles de cette cote (et de cette inclinaison), chaque passage compte (1/5 → 2/5), étape suivante d'elle-même quand tout est noté ; l'échauffement propose les cotes sous ton niveau.
- **Voies et blocs** (pendant la séance) : salle, Voie | Bloc, les cotes ajoutées, « Aujourd'hui ».
- Tuiles : le repère ✓ ↑ ✗ en haut, le secteur reste lisible.

**Nouveautés 8.28** (séance : une cote, ses voies dessous).
- Chaque cote : une ligne (cote, puis ✓ · sec · ✗ toujours de même taille, pour une voie pas dans l'app), et dessous les **tuiles** de ses voies ou blocs en place, 5 par ligne : couleur, cote, ≈, **secteur** (et nom), repère ✓ ↑ ✗ ★, contour si grimpée aujourd'hui.
- Ordre : grimpées aujourd'hui, projets et « à essayer », puis par secteur ; au-delà de 10, « + N autres ».

**Nouveautés 8.27** (les « sec »).
- Un « sec » est toujours **un seul passage** avec son nombre de repos : dans les lignes rapides, « sec » demande « Combien de sec ? 1 à 6 » (comme sur une pastille).
- Une voie arrivée en haut avec des sec, pas encore enchaînée, affiche **↑** (pastille, mur, fiche) au lieu de ✗ ; repères : « ✓ », « ↑ 3 sec », « ✗2 ».
- Taux de réussite inchangé : un sec compte comme un essai non enchaîné.
- Les petits boutons en bout de ligne ont aussi « sec » en voie.

**Nouveautés 8.26** (noter plus vite en séance).
- **Voies et blocs** : en-tête sur une ligne (salle › et Voie | Bloc) ; une ligne par cotation avec les **pastilles des voies en place** (✓ réussie, ✗n projet, ★ à essayer) : un appui → Réussi / Échec, rangé dans l'historique de la voie ; petits ✓ ✗ en bout de ligne pour une voie pas encore dans l'app ; « + une autre cotation » · « + Nouvelle voie » · « Autre voie… » en petits boutons ; plus de lien « Voir tout le mur ».
- **Ligne de temps** en haut du bandeau dès avant le départ ; **consignes** repliées en une ligne (aperçu) ; **Forme ?** en émojis sur la ligne du chrono.
- **Couleurs** : Consignes en ocre, Voies et blocs à la couleur de la discipline, Plan de séance à la couleur de l'activité.

**Nouveautés 8.25** (équivalences partout).
- **Consignes** toujours tout en haut de la séance, avant comme pendant.
- **Bilan** : la grille et « Une autre cotation » retrouvent la salle comme la séance (salle du jour ou habituelle) et montrent « 4 · ≈ 5+ ».
- **Passage hors séance** : la cotation se choisit sur l'échelle de la salle choisie (ou l'officielle).
- **Listes** (Aujourd'hui, Projets, hors séance, fiches) : « 7 · ≈ 6B+ » ; message des lignes rapides : « Réussi · 4 · ≈ 5+ · bloc déjà fait ».
- **Progrès** reste sur l'échelle de l'app, avec l'équivalent de ta salle habituelle entre parenthèses (« 5+ (salle : 4) »).

**Nouveautés 8.24** (harmonie).
- **Séance commencée** : la carte « En cours » garde la couleur de l'activité ; ordre : Consignes (repliées) tout en haut, puis l'étape en cours, puis Voies et blocs, puis le plan.
- **Avant la séance** : « Sautée » et « Déjà faite → bilan » en petits boutons blancs sur le bandeau.
- **Lignes rapides** : colonne de cotation de largeur fixe, boutons tous de la même taille ; « 5 · ≈ 6A+ » sur une ligne (aussi dans le bilan).
- **Couleurs** : Réglages et Sauvegarde prennent la couleur de l'app (seul « Tout effacer » reste rouge) ; Progrès garde ses couleurs (chaque tuile a la couleur de sa section).
- Textes : « Bilan · Ven. 20/11 · Bloc » ; « Avant le bloc · passé » ; la forme se note « au début ou au bilan ».

**Nouveautés 8.23** (après le test complet « de zéro »).
- **Écran** : correctif pour iOS 26 (titre et onglets qui se décalaient après le clavier) ; la barre « Cette semaine · + Séance · + Hors séance » est tout en haut du Programme.
- **Programme** : la semaine du programme de départ avant un bloc est à part (« Avant le bloc ») ; « Autre sport » s'affiche avec son nom (Vélo…) et le même gris partout.
- **Options** : n'y figure plus ce qui est déjà sur la page.
- **Assistant** : niveaux au format de la salle (« 4 · ≈ 5+ ») ; « B1 réussi ? » pour préparer la suite d'un bloc pas encore fini ; durée d'un exercice ajouté.
- **Thèmes** : pas deux fois le même thème dans un bloc, les moins utilisés d'abord.
- **Exercices** : « Durée habituelle » sur la fiche, utilisée pour estimer les séances, reportée dans Programme.xlsx (colonne « Durée (min) »).
- **Séance** : dans une salle avec voies et blocs, choix **Voie | Bloc** pour noter ; « + une autre cotation » ajoute une ligne aux passages rapides ; lignes rapides en bloc au format de la salle.
- **Bilan** : « Forme du jour » (si oubliée au début) ; grille au format de la salle, avec Voie | Bloc.
- Textes : « 1 voie », « Options › Modifier la salle », « bloc 6A+ » (et non 6a+).

**Nouveautés 8.22** (assistant plus souple, équivalences de cotation partout).
- **Assistant de bloc** : objectif secondaire et fil rouge « Autre (à définir)… » (titre, séance, validation par case à cocher ou seuil) ; disponibilités par jour en liste déroulante avec « Autre sport… » (nom, durée, intensité facile/soutenue) ; case « séance bonus » par jour ; durée de séance et phase de chaque semaine en liste déroulante.
- **Fatigue** : un autre sport « soutenu » déclenche des alertes (veille ou lendemain de la séance dure, deux jours chargés d'affilée, trop de jours chargés pour le profil) et un conseil dans Progrès si la forme est basse.
- **Étape 5** : chaque chiffre explique d'où il vient (profil et phase), avec la valeur proposée, la fourchette conseillée et un avertissement hors fourchette. **Étape 6** : chaque feu vert a un conseil, et des alertes (non bloquantes) sur les seuils incohérents.
- **Plan B** (voie → bloc) : consignes équivalentes en bloc, plus les consignes de la voie.
- **Équivalences salle ↔ app** partout : tableau « Échelle de la salle » sur le mur, cibles de séance « 3 · ≈ 5 », Nouvelle voie, saisie des passages (lignes rapides, filtres, résultat « sans voie précise » sur l'échelle de la salle).
- **Progrès** : tuile « Escalade cette semaine » (heures de grimpe, hors course et autres sports) ; le conseil n'a un bouton que s'il mène ailleurs (prochaine séance dure) ; la ligne Forme est colorée.
- **Options allégé** : plus rien n'y double un bouton de la page (Programme : « + Séance » et « Aller à cette semaine » retirés, l'assistant seulement si sa carte est écartée ; séance : « Bilan » et « Séance sautée » retirés quand ils sont déjà sur l'écran ; mur : « + Secteur » retiré).
- **Cohérence** : barre fixe en haut de la Bibliothèque (recherche + « + ») et des Passages hors séance ; liens « ▸ Pourquoi ? ».
- Les blocs construits sont réécrits automatiquement à l'ouverture ; les séances déjà notées gardent leurs saisies.

**Nouveautés 8.21** (après la vérification de ta sauvegarde).
- **Correction** : un exercice ajouté aux séances voie (ex. « Mousquetonnage efficace (tête) » dans B2 et B3) était aussi recopié avant « ## Voie », donc en double dans la voie et présent dans le plan B. Les blocs concernés sont réécrits automatiquement à l'ouverture (ou après une restauration) ; les séances déjà notées gardent leurs saisies.

**Nouveautés 8.20** (après le test du bloc 3).
- **Niveau consolidé en bloc avec « + »** : en bloc, 5+ est un niveau à part entière (cotation Fontainebleau) ; en voie, 5b+ compte toujours comme 5b. Le bilan de fin de bloc et Progrès affichent donc « 5 → 5+ ».
- **Blocs terminés** : ils se replient d'eux-mêmes (ta mémoire d'ouverture repart de zéro à la fin du bloc).
- **Consignes dévers nouvelles** : « Proposer des thèmes nouveaux » (et « Partir de B… ») choisit aussi les consignes dévers parmi les exercices de la catégorie Dévers pas encore utilisés.
- **Exercices en double** : un exercice ajouté (ou mis en remplacement) qui apparaît déjà dans la même séance est signalé à l'étape Séances et au récapitulatif (un conseil, rien n'est bloqué).

**Nouveautés 8.19** (après l'audit).
- **Programme en trois niveaux** : le bloc est une carte dont l'état se voit (en cours : bord ocre ; terminé : atténué, avec « feux 3/4 » ; à venir : pointillés), avec son titre et son objectif. Une ligne par semaine, la phase en pastille de couleur (Base bleu, Construction ocre, Respiration vert, Réalisation rouge, Décharge gris). « Modifier le bloc · Retirer » en bas de la carte.
- **Bilan de fin de bloc** : pendant 2 semaines après la fin d'un bloc construit, une carte montre les séances faites, le niveau avant → après et les feux atteints, avec « Construire le bloc suivant ».
- **Assistant : « Partir de B1 · … »** : mêmes jours, réglages et exercices ; niveaux mis à jour ; objectif suivant s'il est atteint, sinon le même ; consignes nouvelles.
- **Progrès** : la carte Conseil (icône, phrase, barre vers le prochain cap, « Voir le feu vert ») ; la forme sur sa ligne ; la tuile « Cette semaine » donne le temps grimpé sur le temps prévu (fini le « 0 ↓ moyenne 1363 »).
- **Corrections** : feux verts « 1/3 » dans la section alors que la tuile disait « 0/3 » (le garde-fou était compté) ; jauge des blocs sans les séances bonus ; la carte « Aujourd'hui » marque les séances bonus et montre aussi la prochaine vraie séance ; noms de secteur longs sur deux lignes ; les messages ne cachent plus les boutons du bas.
- **Export CSV** : 7 tableaux (en plus : blocs et leurs feux verts, tes fiches d'exercice).
- **Harmonie** : les actions sont des boutons (ajouter en ocre, retirer en rouge), les liens servent à naviguer ; petits titres en minuscules (sauf les groupes de Plus).

**Nouveautés 8.18.**
- **Assistant au style de l'app** : les 7 étapes restent en haut, Précédent / Suivant en bas. Chaque réglage est une ligne « libellé ……… valeur › » ; un appui ouvre ses choix (puces, − / +) dans un cadre ocre, choisir referme. Les chiffres de chaque semaine se règlent en touchant la semaine.
- **Objectif** : toutes les cotations, « + » compris (5+, 6A+, 5c+…). La pyramide et le volume restent sous l'objectif (objectif 5+ : pyramide 4+ puis 5, volume en 4+ et 5).
- **Jusqu'à 2 objectifs secondaires** : dévers, dalle / adhérence, endurance en voie, à vue, niveau en voie, gainage. Chacun ajoute son contenu dans la bonne séance et son feu vert (titre au bon niveau : « Dévers en 5 »).
- **Fils rouges** : hauteur, réceptions en bloc, mouvements dynamiques, **découvrir la tête** (cours avec un moniteur, tête simulée en moulinette en attendant, deux cases à cocher).
- **Exercices** : une fenêtre avec recherche et filtres (famille, niveau) pour ajouter (fois, quand, facile / effort, précision), remplacer ou choisir une consigne. Les consignes dévers ne sont plus mélangées aux exercices : elles ont leur propre liste, une par semaine.
- **Consignes de la semaine** sur toutes les semaines du bloc, et « Proposer des thèmes nouveaux » (exercices de technique pas encore utilisés dans tes blocs).
- **Feu vert libre** : « + Ajouter un feu vert » (un seuil sur tes passages — réussis différents, essais, réussite %, à vue — ou une case à cocher).
- **Programme** : Options n'a plus que 4 lignes ; Modifier et Retirer sont sur la carte du bloc construit. Le récapitulatif d'un bloc ajouté n'affiche plus « 0 → … ».
- **Programme** : la barre « Cette semaine · + Séance · + Hors séance » reste visible en faisant défiler ; « Cette semaine » ouvre le bon bloc même si un autre est déplié.
- **Bibliothèque modifiable** : « + Nouvel exercice », « Modifier » sur chaque fiche, « Rétablir la fiche d'origine », « Supprimer » pour tes fiches. `grimpe.py rapport` les reporte dans la feuille Exercices de Programme.xlsx (et renomme la fiche dans les séances qui la citent).

**Nouveautés 8.17.**
- **Construire un bloc** (Programme › Options › « + Nouveau bloc (assistant) ») : 7 étapes — Départ, Objectif, Disponibilités, Phases, Séances, Feux verts, Récapitulatif. Chaque étape a son « Pourquoi ? » ; le guide complet est dans Aide › Construire un bloc. Les alertes (objectif à plus d'un cran, moins de 48 h après la séance dure, charge qui monte de plus de 10 points, pas de décharge, pas de garde-fou…) sont des **conseils** : « Suivant » et « Créer » restent toujours possibles, c'est toi qui décides.
  - Profil **Débutant / Intermédiaire / Avancé** : il ne change que les valeurs proposées (essais, volume, suspensions courtes à partir d'Intermédiaire) ; tout reste modifiable.
  - Étape Séances : un tableau par semaine (essais à la séance dure, volume, dévers, voies, course), l'aperçu des séances, et les **exercices** par type de séance (dure, volume, voie, plan B) : retirer, remplacer par un exercice de la bibliothèque, ajouter (nombre de fois, précision, toutes les semaines ou une seule phase). La consigne technique de chaque semaine se choisit aussi.
  - Chaque séance voie contient son **plan B sans partenaire** (« Remplacement bloc ») : une séance bloc modérée, sans maximum.
  - Le bloc **remplace** les semaines choisies (les séances déjà commencées ou faites restent) ou s'ajoute **après** le programme. Options › Modifier (assistant) ou Retirer ; « Annuler » défait la création. Les séances du bloc se modifient ensuite comme les autres (⋯ › Modifier le plan).
  - Le récapitulatif compare, semaine par semaine, ce qui était prévu et le nouveau bloc (séances, temps estimé, essais sur l'objectif).
- **Ton bloc 1 refait** (« Le 5 en bloc ») est prêt : une carte en haut du Programme propose de le créer. Il remplace les semaines 2 à 8 ; la semaine 1 reste. Mar. course (bonus) · Mer. voie (plan B bloc) · Jeu. prévention (bonus) · Ven. séance dure · Dim. volume et dévers.
- **Feux verts du bloc** : Progrès suit les feux du bloc en cours (« Feux verts · B1 Le 5 en bloc ») : bloc 5 consolidé (≥ 10 essais, ≥ 70 %, ≥ 5 blocs différents), dévers facile (5 blocs 4 différents en dévers), hauteur (une case à cocher dans Progrès), garde-fou douleur ≤ 2/10 sur 4 semaines. Comptés depuis le début du bloc.
- **Séances bonus** : marquées « bonus », jamais dans « À faire » quand elles sont passées.
- **Export pour analyse (CSV)** : Plus › Sauvegarde › « Pour analyse · CSV ». Un zip de 5 tableaux (passages, séances, voies, mesures, douleurs), séparateur « ; », accents lisibles dans Excel. Fabriqué sur le téléphone (rien ne passe par Internet), notes incluses ou non, jamais le jeton GitHub. Sur PC : `python outil/grimpe.py csv Grimpe-analyse-….zip` → **Analyse.xlsx** (une synthèse par cotation + un onglet par tableau). La sauvegarde à restaurer reste le JSON.
- **Ouverture plus rapide** : la page vient tout de suite du cache, sans attendre le réseau (avant : jusqu'à 3 s). Le temps d'ouverture s'affiche en bas de Plus (« ouverture : 0,4 s »). L'assistant et l'export CSV ne sont chargés qu'à la demande.

**Nouveautés 8.16.**
- **Programme** : chaque bloc (Bloc 1, Bloc 2…) est une carte repliable avec une jauge d'avancement (« 3/48 ») ; le bloc en cours est ouvert, ses phases (« S1-2 Consolider le 5b »…) en sous-titres. **« + Hors séance »** est dans la barre du Programme ; ces passages apparaissent dans leur semaine (« Hors séance · 2 passages ») et la liste complète est dans Options du Programme. Repères d'état partout : ✓ faite, ✗ sautée, ● en cours ou aujourd'hui, ? passée sans nouvelles.
- **Progrès** : un tableau de bord de 4 tuiles (Niveau avec ↑, Feux verts, Charge de la semaine comparée à la moyenne, Projets) ; un appui ouvre la section. Une douleur récente (en cours ou de moins de 14 jours) s'affiche au-dessus en bandeau rouge. Dessous, une seule ligne « Conseil ».
- **Bibliothèque** : 6 familles repliables (Routines, Technique, Méthode, Endurance, Renfort, Soin) au lieu de 23 catégories ; les catégories deviennent des sous-titres.
- **Salles** : cartes compactes (nom, et « 8 voies · 2 blocs ») ; secteurs sur une seule ligne (« Mur 2 vertical ……… 7 blocs · 1 → 9 »), sans pastilles de couleur.
- **Inventaire rapide** : un rond de couleur par niveau ; les voies créées prennent cette couleur.
- **Voie sans couleur** : fond gris clair, bord en pointillés, lisible en clair comme en sombre.
- **Fenêtres** : chaque titre repliable est en gras sur sa ligne, son contenu ouvert dans un cadre à liseré ocre (Nouvelle voie, fiche, bilan). Pied de fenêtre : Annuler à gauche, le bouton principal à droite ; Supprimer à part, dessous.
- **Listes de niveaux** dans l'ordre de la salle, avec le nombre de voies (« 5a (3) »).
- **Barre du haut** : Options collé au bord droit ; dans une séance, la flèche « ‹ » seule ramène au Programme. Listes et champs à 44 px de haut.

**Programme.** L'app s'ouvre sur le programme. La carte « Aujourd'hui » (ou « Prochaine séance ») est un bouton teinté de la couleur de son activité : un appui ouvre la séance. Si une séance est en cours, l'app s'ouvre directement dessus. Les semaines se déplient. Les pastilles des jours et les cartes de séance sont teintées, en transparence, de la couleur de l'activité (la même que le bandeau de la séance). En haut, le rappel de la séance précédente pas encore réglée : Faite → bilan, Sautée ou Plus tard. Chaque séance a son menu ⋯ :
- bilan ;
- modifier le plan ;
- déplacer ;
- copier vers une autre date ;
- marquer sautée ;
- supprimer, pour une séance que tu as créée ou copiée.

**Séance.**
- **Commencer** lance la séance, sans questionnaire.
- **Consignes** : avant et après la séance, sous la bannière, ouvertes. Pendant la séance, sous la carte « En cours », repliées en une ligne qui montre le début de la première consigne.
- **La frise** montre le déroulé prévu : une couleur par type d'étape, et la durée de chaque phase en minutes.
- **Pendant la séance, une seule carte « En cours »**, teintée de la couleur de l'activité. De haut en bas : l'activité, le temps écoulé et la fin estimée ; la frise, avec un repère sur l'étape en cours ; « Étape 2 sur 7 » et son nom ; ses minuteurs (repos, chrono, fractions, routine guidée) ; le gros bouton « ✓ Fait · suivant : … » ; le **Détail de l'étape**, replié, et encadré une fois ouvert.
- **Dernière étape** : le bouton devient « ✓ Fait · terminer la séance » et ouvre le bilan. Si tout est coché autrement, la carte affiche « ✓ Toutes les étapes sont faites » avec « Terminer la séance », et l'app le propose aussi par un message.
- **La forme** se dit en un appui : 🙂 😐 😣.
- **Douleur** et **Fin de séance** restent toujours visibles en bas de l'écran pendant la séance (Fin de séance en bouton rouge).
- **Douleur** note une douleur pendant la séance.
- **Fin de séance** demande l'effort, la douleur après, et, si tu n'as rien noté, « en gros ce que tu as grimpé ». Ça fait trois appuis.
- **Une séance restée ouverte** se ferme toute seule après quatre heures.
- **Le lendemain**, une séance oubliée revient en une carte en haut du Programme : faite, sautée, ou plus tard.

**Voies et blocs pendant la séance.** La carte « Voies » (ou « Blocs ») est courte et repliable :
- **Salle : … ›** choisit la salle du jour : une de tes salles, « Salle inconnue » ou « + Nouvelle salle… ». La même règle vaut en voie et en bloc : par défaut, c'est la dernière salle choisie, si elle accepte la discipline. « Salle inconnue » vaut pour la séance.
- **+ Noter un passage** ouvre une fenêtre :
  - en haut, « + Nouvelle voie » et « Sans voie précise » (cotation seule) ;
  - dessous, les voies de la salle : filtres par couleur (ronds), par état (✗ projets, jamais essayées, ✓ réussies) et par niveau (listes), avec tes cibles et les voies d'aujourd'hui en premier. ✓ et ✗ sur les tuiles comme sur le mur ;
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
- **En bref**, en haut d'une salle : un bâtonnet par niveau, dont la hauteur donne le nombre de voies. Sa couleur est celle du niveau dans une salle qui cote par couleurs, sinon la couleur de prises la plus présente. Toucher un bâton filtre le mur (« Niv 5b : 6 voies ») : les autres filtres sont retirés, et la page descend jusqu'aux voies.
- **La façon de coter** d'une salle se règle en trois questions :
  1. comment la salle note ses niveaux : cotation française ou Fontainebleau, chiffres, lettres, chiffres et lettres, couleurs, autres, ou pas de niveaux ;
  2. combien de niveaux différents : l'app crée la liste toute seule ;
  3. l'équivalent de chaque niveau dans la cotation de l'app : une liste déroulante, pré-remplie et modifiable.
- **Dans une salle**, une barre reste en haut : Tout / Voies / Blocs, + Voie, + Secteur, Sélectionner, et un filtre par caractéristique. Le reste est dans Options : plusieurs voies d'un coup, voies démontées, modifier la salle.
- **Les secteurs** sont repliés avec un résumé (inclinaison, nombre, couleurs, étendue des cotations). L'app retient ceux que tu ouvres.
- **Créer des secteurs** : « + Secteur » demande combien, et les crée tous d'un coup. Ils sont nommés 1, 2, 3… par défaut, et chaque nom se change sur place. Une nouvelle salle peut recevoir ses secteurs dès sa création.
- **L'inclinaison d'un secteur** n'est pas à choisir : Vertical par défaut, puis la plus fréquente parmi ses voies, en trois catégories (Dalle, Vertical, Dévers). Les nouvelles voies du secteur la prennent par défaut.
- **Inventaire rapide** (Options, ou le bouton d'une salle vide) : un compteur par niveau de la salle (« 5a : 4, 5b : 6… »), le secteur, une couleur facultative, et toutes ces voies sont créées d'un coup. Les couleurs et les noms se complètent ensuite.
- **Nouvelle voie** : la dernière couleur et le dernier niveau utilisés dans la salle sont déjà remplis.
- **Déplacer une voie** : garde le doigt dessus ½ seconde, comme pour déplacer une app sur l'iPhone. Elle se soulève et suit le doigt ; lâche-la sur une autre voie, dans un secteur ouvert, ou sur le nom d'un secteur replié. Près du haut ou du bas de l'écran, la page défile toute seule. Un appui court ouvre la fiche, comme avant.
- **Une voie** a :
  - une couleur : 12 de base, et un appui long montre les nuances (42 teintes) ;
  - une cotation, notée à la façon de la salle : comme l'app, ses propres niveaux, par couleurs, ou aucune. « Niveau inconnu » est toujours possible : la voie s'affiche « ? » et se complète plus tard ;
  - une **inclinaison** : Dalle, Vertical, Léger dévers, Dévers, Surplomb, Fort dévers, Toit ;
  - des **caractéristiques**, plusieurs possibles : Arête, Traversée, Dièdre, Fissure, Volumes, Réglettes, Bacs, Pinces, Plats, Dynamique, Compression ;
  - un secteur et un nom.
- **La fiche d'une voie** s'ouvre sur une ligne par réglage, et son **historique** est affiché :
  - chaque passage a ✕ pour le supprimer tout de suite (« Annuler » quelques secondes) ;
  - « + Ajouter » note une réussite d'un autre jour, ou des échecs sur plusieurs dates d'un coup ;
  - « Noter un passage maintenant » apparaît si une séance est en cours.
- **Supprimer** une voie, un secteur ou une salle se fait tout de suite, avec « Annuler ». Quand il y a un vrai choix (garder ou non les passages, les voies d'un secteur), une fenêtre le pose.

**Passages hors séance.** Pour une voie d'une salle, ils se notent dans sa fiche, onglet Historique. Pour un passage sans voie connue (avant le programme, en extérieur…), passe par Options du Programme › « Passages hors séance ». Un passage sans date compte dans les niveaux, les projets et les feux verts, mais pas dans la charge ni dans le bilan de la semaine.

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
- Mesures : ⓘ décrit chaque test, et la valeur précédente s'affiche à côté du champ.
- ⏸ Faire une pause : repousse la semaine et les suivantes de 1 à 4 semaines. La fenêtre montre les nouvelles dates, et les séances déjà commencées, faites ou sautées ne bougent pas.
- Copier · répéter.

**Partout.**
- Le bouton **Options ▾** en haut de chaque écran regroupe les actions de l'écran et **Annuler** (les 30 derniers gestes).
- Les choix de 4 options ou moins sont des boutons. Au-delà, c'est une liste déroulante, c'est-à-dire le sélecteur de l'iPhone.
- Progrès, la Bibliothèque, l'Aide, les Réglages et la Sauvegarde ont le même modèle : des cartes repliables, avec un liseré de couleur à gauche et un résumé dans l'en-tête. La Bibliothèque et l'Aide ont une recherche.
- Une section qu'on ouvre (une semaine du programme, une section, un secteur) s'affiche en entier : la page défile toute seule.
- **Gestes de l'iPhone.** Appui long (½ s) : sur une séance du Programme, son menu ; sur une voie pendant une séance, sa fiche ; sur un passage d'aujourd'hui, le corriger ; sur une voie du mur, la déplacer ; sur un secteur, le modifier. Glisser depuis le bord gauche : revenir en arrière, sauf sur une séance, où glisser passe à la séance voisine.
- Les boutons « + » (voie, secteur, séance, salle, passage) ont tous le même style : contour ocre, fond teinté.
- Le « ? » d'un écran ouvre l'aide de cet écran.
- Changer de page arrive en haut de la page ; le retour ‹ ramène où tu étais.
- **Thème** : Réglages › Affichage › Thème : Automatique (comme l'iPhone), Clair ou Sombre. Le choix est retenu sur le téléphone.
- **Repos par défaut** (Réglages) : une liste pour l'activité, une liste pour sa durée ; la ligne dessous résume toutes les activités.
- **Éditeur de plan** : repos, chrono, durée et fractions de course se choisissent dans des listes déroulantes ; les nombres (3×, séries) gardent − / +.
- **Bibliothèque** : filtre par niveau (Débutant, Intermédiaire, Avancé, avec le nombre d'exercices) et « Cette semaine » (les exercices et routines cités dans les séances de la semaine en cours). Les routines sont une catégorie comme les autres : chaque routine a sa fiche (étapes, durées, exercices cliquables, ★ favori) et la recherche les trouve. Le niveau s'affiche en petite étiquette colorée.
- **Couleurs** : la Bibliothèque a une teinte par famille de catégories (technique, méthode, endurance, renfort, soin) ; dans Progrès, chaque section a son liseré, les barres des feux verts sont ocre (en cours) puis vertes (atteint). Plus présente ses tuiles en deux colonnes compactes, le nom à côté de l'icône.
- **Mêmes mots partout** : une voie est « Enchaînée », « Avec sec » ou « Échec » ; un bloc « Réussi » ou « Échec ». Dans une salle de blocs, l'app parle de blocs (« 7 blocs », « Plusieurs blocs d'un coup »).
- **Durées** écrites d'une seule façon : « 45 s », « 1 min 30 », « 20 min », « 1 h 22 ».
- **Icônes au trait** partout, comme la barre du bas (plus d'émojis en couleur, sauf les visages de « Forme ? »). Les feux verts : un rond vide, plein et vert quand il est atteint.
- **Un seul style par rôle** : un seul bouton principal par fenêtre ; « + » au contour ocre ; supprimer et effacer au contour rouge.
- **Créer ou modifier une voie** : la même présentation, une ligne par réglage ; en création, Couleur et Cotation sont déjà ouvertes.
- **Salles** (onglet) : la salle du jour en premier, avec l'étiquette « Aujourd'hui » ; chaque carte compte ✓ réussis et ✗ projets ; appui long : ouvrir le mur, modifier la salle, inventaire rapide, plusieurs voies d'un coup.
- **Réussis, projets, jamais essayés** : une voie en place est **réussie** (✓) si tu l'as réussie au moins une fois, **projet** (✗) si tu l'as essayée sans la réussir, sinon **jamais essayée**. C'est le compte exact de tes passages notés sur les voies de la salle. Dans « En bref » : une ligne de compte, et chaque bâton en trois parties (plein = réussis, hachuré = projets, clair = jamais essayés, avec une légende). Les mêmes mots dans Progrès › Projets, qui indique aussi la salle.
- **Filtres en listes déroulantes**, sur une ligne : Type (salle mixte), État, Caractéristique dans une salle ; Niveau et Afficher (Tout, Cette semaine, ★ Favoris) dans la Bibliothèque. Les filtres actifs restent en étiquettes ✕. Les choix dans une fenêtre restent des boutons quand il y en a 4 ou moins.
- **Écrans vides** : partout le même modèle, une icône au trait, une phrase courte, le bouton pour avancer (« Retirer les filtres », « Inventaire rapide »…).
- **Le mur** : « Sélectionner » est dans Options ; tuiles plus petites (5 par rangée), l'inclinaison n'est écrite sur la tuile que si elle diffère de celle du secteur ; avec un filtre, seuls les secteurs qui ont quelque chose à montrer restent.
- **Mode sombre** : les couleurs foncées (Noir…) gardent un fin contour clair.
- **Salle par défaut** : si une seule salle propose la discipline de la séance, elle est choisie d'office.
- **Échelles en boutons** : cotation, nombre, « Comment ? », effort et douleur restent des boutons (un seul appui) ; les autres choix de plus de 4 options sont des listes.
- **Filtres actifs** : dans une salle, chaque filtre en cours s'affiche en étiquette « ✕ » sous la barre. Les filtres sont propres à chaque salle.

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
Remplace **tous** les fichiers dans le dépôt (scripts *et* `style.css`). À la prochaine ouverture, ou au retour dans l'app, un bandeau « Nouvelle version disponible — mettre à jour » apparaît ; un appui suffit. Tes données ne sont pas touchées.

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
- « Exporter le fichier » partage le document complet (`Grimpe-sauvegarde-AAAA-MM-JJ-HHhMM.json`, le fichier seul). Dans Mail, vérifie que la pièce jointe est bien là avant d'envoyer : la taille de la sauvegarde est affichée à côté du bouton.
- « Copier les données » met tout le document dans le presse-papiers, à coller dans Notes ou dans un mail. C'est le plus sûr sur iPhone.

Pour restaurer : « Restaurer depuis un fichier » ou « Restaurer en collant le texte ».

Quand l'app est vide (nouvelle installation), le Programme propose tout de suite de restaurer. Sans sauvegarde GitHub, un rappel « Sauvegarder » apparaît en fin de séance si la dernière sauvegarde a plus de 7 jours. L'app demande aussi à l'iPhone de ne pas effacer son stockage de lui-même.

**Pour analyse · CSV.** Un zip de 5 fichiers CSV à ouvrir dans Excel ou LibreOffice, ou à passer à `grimpe.py csv`. Option « Inclure les notes ». Ce n'est pas une sauvegarde : pour restaurer, garde le JSON.

**Tout effacer.** Efface toutes les données de ce téléphone.

---

## 4. Calendrier

Plus › Calendrier donne un lien `webcal://…/programme.ics` : abonne-toi une fois, et les séances apparaissent dans le calendrier de l'iPhone.

Les alarmes d'un calendrier abonné sont désactivées par défaut : dans le compte de l'abonnement, décoche « Supprimer les alarmes ». Les heures et durées par défaut se règlent dans la feuille Paramètres de Programme.xlsx (`heure_voie`, `duree_voie`, `heure_bloc`…).

---

## 5. L'outil PC et Programme.xlsx

Installe d'abord la bibliothèque : `pip install openpyxl`. Ensuite, trois commandes :

```
python outil/grimpe.py app
    Programme.xlsx → data.js + programme.ics (+ version de sw.js). À pousser ensuite sur GitHub Pages.

python outil/grimpe.py rapport export.json
python outil/grimpe.py rapport --github proprietaire/depot/chemin/grimpe.json
    export de l'app → Suivi.xlsx ; reporte dans Programme.xlsx les séances modifiées ou créées dans l'app ;
    régénère data.js, sw.js et programme.ics aux dates réelles.
    Avec --github : GRIMPE_TOKEN=github_pat_… dans l'environnement (ou GRIMPE_GITHUB=… pour le chemin).

python outil/grimpe.py csv Grimpe-analyse-2026-11-17-14h30.zip
    export « pour analyse » de l'app → Analyse.xlsx : une synthèse (passages, réussis, taux par cotation) et un onglet par tableau.
```

**Blocs construits dans l'app.** Un bloc créé avec l'assistant vit dans le document de l'app (sauvegardé avec lui), pas dans Programme.xlsx : `rapport` ne reporte pas ses séances dans Programme.xlsx. Programme.xlsx reste la voie avancée pour écrire un programme à la main.

**Fiches d'exercice créées ou modifiées dans l'app.** `rapport` les reporte dans la feuille Exercices (mise à jour de la ligne d'origine, ou nouvelle ligne) ; une fiche renommée l'est aussi dans le contenu des séances de la feuille Programme. data.js est alors régénéré.

**Suivi.xlsx** met en page le bilan calculé par l'app, sans rien recalculer. Il contient :
- les séances et les tentatives (avec aisance, essais avant réussite, premier essai ; « inconnue » pour un passage sans date) ;
- les voies ;
- les niveaux, les feux verts, les douleurs, la charge et les mesures ;
- le programme.

**Nouveau programme** : change `date_debut` dans Paramètres, régénère, puis pousse. L'app propose d'exporter, puis de repartir. Les réglages, salles, passages hors séance et favoris sont gardés.

### La grammaire d'une séance
Une ligne par étape. Tout ce qui n'est pas entre accolades est du texte. Dans l'app, l'éditeur (⋯ d'une séance › Modifier le plan, ou + Séance) écrit ces lignes pour toi.

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
  app.js        démarrage, état d'écran, rendu, routage des actions, menu Options, appui long, glisser pour revenir, nuancier, mise à jour
  store.js      document unique versionné, migrations, IndexedDB, annulation (30 gestes)
  dates.js      dates « AAAA-MM-JJ », semaines du programme
  parseur.js    grammaire d'une séance ↔ étapes structurées
  programme.js  programme effectif (data.js + blocs construits + opérations), durées, états, clôture automatique
  bibliotheque.js  la bibliothèque affichée : celle du programme + tes fiches (doc.exos)
  blocs.js      blocs construits dans l'app (doc.blocs) : séances remplacées ou ajoutées, feux verts du bloc
  plan.js       générateur de blocs, modèles, alertes (chargé avec l'assistant seulement)
  csv.js        export « pour analyse » : 5 CSV dans un zip (chargé à la demande)
  analyse.js    tous les calculs de Progrès
  salles.js     salles, secteurs, voies, palette, caractéristiques, façon de coter
  infos.js      textes des explications ⓘ
  sync.js       sauvegarde GitHub ; export.js : export / import JSON
  minuteur.js   repos, chrono, fractions, routine guidée
  html.js       gabarit qui échappe tout ; blocs repliables mémorisés ; listes déroulantes ; ligne de choix
  ecrans/       seance  programme  progres  plus  mur  editeur  fenetres  assistant (chargé à la demande)
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
- Le glisser-déposer du mur démarre après un appui long immobile (½ s) : un doigt qui bouge plus tôt fait défiler la page normalement.
- Suivi.xlsx contient les chiffres ; les graphiques au-delà de la charge sont à faire dans le tableur.
- Les tests tournent dans Chrome ; vérifie sur l'iPhone le partage de fichier, l'abonnement au calendrier et les listes déroulantes multiples.
