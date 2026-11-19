// infos.js — les explications « ⓘ » : ce que ça veut dire, comment c'est calculé. Un seul endroit pour les textes.
export const INFOS = {
  murAide: ["Le mur de la salle", [
    "Touche une voie ou un bloc pour sa fiche (historique, ajouter un passage, corriger).",
    "Pour la déplacer, garde le doigt dessus ½ seconde : elle se soulève ; lâche-la sur une autre voie, dans un secteur ouvert, ou sur le nom d'un secteur replié.",
    "Plusieurs voies d'un coup, voies démontées, modifier la salle : Options en haut."]],
  horsSeance: ["Passages hors séance", [
    "Ce que tu as grimpé sans séance dans l'app et sans voie de salle connue (avant le programme, en extérieur…).",
    "Pour une voie d'une salle : sa fiche › Historique › + Ajouter.",
    "Sans date, un passage compte dans les niveaux, les feux verts et les projets, pas dans la charge ni dans le bilan de la semaine."]],
  fichierJson: ["Le fichier de sauvegarde", [
    "Le même document en JSON : séances, réglages, salles, bilan calculé.",
    "C'est la sauvegarde, et l'entrée de l'outil PC (grimpe.py rapport fichier.json).",
    "Dans Mail, vérifie que la pièce jointe « Grimpe-sauvegarde-….json » est bien là avant d'envoyer."]],
  lignesCot: ["Noter vite pendant la séance", [
    "Une ligne par cotation prévue (et celles ajoutées avec « + une autre cotation »). Les pastilles sont les voies ou blocs en place de cette cotation dans la salle : touche-en une pour Réussi ou Raté. Le passage va dans son historique et compte pour la cotation.",
    "Repères : ✓ déjà réussie, ✗ et le nombre d'essais pour un projet, ★ à essayer. Bord plus épais : déjà grimpée aujourd'hui.",
    "Les petits ✓ ✗ en bout de ligne : une voie ou un bloc qui n'est pas (encore) dans l'app. « + Nouvelle voie » l'ajoute pour de bon ; « Autre voie… » cherche dans toute la salle (couleur, état, niveau)."]],
  feux: ["Feux verts", [
    "Un feu vert dit qu'une étape suivante est raisonnable : un projet en 5c, un premier essai en 6a, un projet de bloc 6A, plus de volume.",
    "Chaque feu a ses critères (barres) ; il passe au vert quand tous sont atteints. Les feux marqués ⓘ (dévers) indiquent seulement quoi travailler.",
    "« Voies différentes » : une voie de salle compte une fois, quel que soit le nombre de passages. Un passage noté sur une ligne de cotation, sans voie, compte comme une voie déjà faite (sauf si tu l'as marqué « nouvelle voie »).",
    "Les taux tiennent compte des essais que tu indiques après une réussite (« réussie au 4ᵉ essai » = 3 échecs), sans compter deux fois ceux déjà notés.",
    "« À ce rythme » compare avec il y a quatre semaines ; il n'apparaît qu'après quatre semaines de programme."]],
  niveau: ["Niveau consolidé", [
    "Ton niveau acquis : la cotation la plus haute que tu réussis souvent, pas ta meilleure réussite d'un jour.",
    "Il faut assez d'essais sur cette cotation (voir le seuil) et un taux de réussite suffisant. Un passage « avec sec » ne compte pas comme réussi.",
    "Calculé séparément en voie et en bloc, en vertical (dalle, vertical) et en dévers (léger dévers à toit). 5b+ compte comme 5b.",
    "Les essais indiqués après une réussite comptent comme des échecs (sans doublon avec ceux déjà notés)."]],
  charge: ["Charge par semaine", [
    "Charge d'une séance = minutes × effort (de 1 à 10, noté au bilan ; 5 si non noté). Toutes les activités comptent : voie, bloc, maison, course.",
    "Le rapport compare les 4 dernières semaines complètes aux 4 précédentes. La semaine en cours n'entre pas : elle n'est pas finie.",
    "Au-dessus de 1,3, la charge monte vite : c'est là que les blessures arrivent. L'app le signale dans la vigilance."]],
  mesures: ["Mesures", [
    "Quelques tests simples, une fois par semaine, pour voir si ta force et ton endurance progressent pendant le bloc de 8 semaines. Fais-les reposé, en fin de semaine, toujours de la même façon.",
    "Planche : gainage sur les avant-bras, corps droit ; temps tenu en secondes.",
    "Course continue : minutes courues sans t'arrêter, à allure facile.",
    "Tractions : nombre de tractions complètes (bras tendus → menton au-dessus de la barre), sans élan.",
    "Genou contre le mur : pied à plat, genou qui touche le mur ; la plus grande distance pied-mur en cm (mobilité de cheville).",
    "Squat profond : temps tenu en bas, talons au sol, en secondes (mobilité de hanches et chevilles).",
    "Rien n'est obligatoire : remplis ce que tu as fait. Les valeurs vont dans Progrès › Mesures."]],
  pause: ["Faire une pause", [
    "Pour une interruption de 1 à 4 semaines (blessure, vacances, maladie) : le programme reprend là où tu t'étais arrêté, au lieu de sauter des semaines.",
    "Toutes les séances à partir de la semaine choisie sont repoussées du nombre de semaines choisi. Celles déjà commencées, faites ou sautées restent à leur date.",
    "Rien n'est effacé, et Options › Annuler défait la pause juste après. L'outil PC reporte la pause dans Programme.xlsx."]],
};
