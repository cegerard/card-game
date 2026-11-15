# Svana

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2d6908559db98176817fcc2c9024fcb9 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/svana-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 75,
  "defense": 50,
  "health": 510,
  "speed": 70,
  "agility": 65,
  "accuracy": 80,
  "criticalChance": 0.07,
  "regeneration": 45,
  "resistance": 55,
  "element": "AIR",
  "specialEnergy": 45
}
```

## Écarts avec Notion

Le moteur ne suit pas encore ces points de la fiche ; ils ne portent pas d'identifiant et ne sont pas testés :

- Étreinte du Cygne Glacé : Notion gèle la cible pendant 2 tours ; le moteur pose un Gel de niveau 1, qui dure 1 tour.
- Tempête Focalisée : Notion gèle la cible pendant 2 tours ; le moteur pose un Gel de niveau 2, qui dure 3 tours.

## Attaque : Souffle Cristallin

- [SVA-ATK-1] Inflige 70 % d'Attaque en dégâts physiques et 70 % d'Attaque en dégâts élémentaires (Vent).
- [SVA-ATK-2] Applique une Marque Thermique sur la cible pendant 2 tours.
- [SVA-ATK-3] Les alliés qui attaquent une cible marquée ont +10 % de chances de coup critique.
- [SVA-ATK-4] Si la cible est déjà gelée, inflige 20 % de dégâts supplémentaires.

## Compétence spéciale : Étreinte du Cygne Glacé

- [SVA-SPE-1] Coûte 45 points d'énergie ; Gel Analytique : la cible subit l'effet Gel.
- [SVA-SPE-2] Exposition des Failles : révèle un Point Faible Critique ; la prochaine attaque contre la cible inflige 60 % de dégâts en plus, et l'effet disparaît si elle est esquivée.
- [SVA-SPE-3] Drain Thermique : réduit l'Attaque de la cible de 25 % pendant 4 tours.
- [SVA-SPE-4] Si le Point Faible Critique est frappé, la cible subit une Hypothermie de 15 % de ses PV max par tour pendant 3 tours.

## Analyse Aérienne (passif)

- [SVA-ANA-1] Chaque fois qu'un ennemi attaque, Svana pose sur lui une Charge d'Analyse, 3 au maximum.
- [SVA-ANA-2] À 3 charges, elle révèle un Point Faible sur cet ennemi et gagne +40 % de Précision et +30 % d'Attaque contre lui.

## Grâce Trompeuse (passif)

- [SVA-GRA-1] +15 % d'Esquive de base.
- [SVA-GRA-2] Quand elle esquive, elle contre-attaque avec un Éclat de Givre de 70 % de son Attaque en dégâts de Vent, avec 33 % de chances de Gel mineur (1 tour).

## Tempête Focalisée

- [SVA-TEM-1] Inflige 120 % d'Attaque en dégâts élémentaires (Vent).
- [SVA-TEM-2] Applique Gel Intense.
- [SVA-TEM-3] Si la cible a un Point Faible révélé, l'attaque ignore 40 % de sa Défense.
- [SVA-TEM-4] Temps de rechargement : 4 tours.

## Valse du Cygne Noir (ultime)

- [SVA-VAL-1] Se déclenche une fois par combat, quand tous les ennemis portent 3 Charges d'Analyse ou sous 20 % de Santé.
- [SVA-VAL-2] Transformation de 3 tours : +50 % de Précision, +35 % de Vitesse et +30 % de dégâts critiques.
- [SVA-VAL-3] Gel de Masse : tous les ennemis subissent Gel (1 tour) et leur Défense baisse de 25 %.
- [SVA-VAL-4] Omniscience Tactique : tous les ennemis ont un Point Faible révélé, et Svana gagne +15 % de dégâts contre chacun.
- [SVA-VAL-5] Tempête de Cristaux : chaque attaque de Svana inflige 60 % de dégâts aux ennemis adjacents à la cible.
- [SVA-VAL-6] Héritage du Cygne : si Svana meurt pendant l'ultime, ses Points Faibles persistent indéfiniment et frappent 25 % plus fort.
