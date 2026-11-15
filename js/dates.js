// dates.js — dates calendaires sous forme de chaînes « AAAA-MM-JJ ».
// Aucun objet Date pour l'arithmétique : on compte en jours entiers, les changements d'heure n'existent pas ici.

export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MS_JOUR = 86400000;

// Numéro de jour (jours écoulés depuis 1970-01-01, en UTC : indépendant du fuseau et de l'heure d'été)
export const numJour = iso => Math.round(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / MS_JOUR);
export const isoDe = n => new Date(n * MS_JOUR).toISOString().slice(0, 10);
export const ajouterJours = (iso, n) => isoDe(numJour(iso) + n);
export const ecartJours = (a, b) => numJour(b) - numJour(a);          // b − a, en jours
export const jourSemaine = iso => (numJour(iso) + 3) % 7;               // 0 = lundi (1970-01-01 était un jeudi)
export const nomJour = iso => JOURS[jourSemaine(iso)];

// Aujourd'hui, dans le fuseau local de l'appareil
export function aujourdhui(maintenant = new Date()) {
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, "0")}-${String(maintenant.getDate()).padStart(2, "0")}`;
}

// Date d'une séance : début du programme (un lundi) + (semaine − 1) × 7 + jour
export const dateSeance = (debut, semaine, jour) => ajouterJours(debut, (semaine - 1) * 7 + JOURS.indexOf(jour));
// Semaine du programme (1 = la première) d'une date, négative ou nulle avant le début
export const semaineDe = (debut, iso) => Math.floor(ecartJours(debut, iso) / 7) + 1;
export const lundiDe = iso => ajouterJours(iso, -jourSemaine(iso));

// Affichage
export const jourMois = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const court = iso => `${nomJour(iso).slice(0, 3)}. ${jourMois(iso)}`;
export const hhmm = ms => { const d = new Date(ms); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
export const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const hm = sec => { const m = Math.round(sec / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };
