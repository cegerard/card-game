# Vespera

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2d8908559db981489269db7fd8466df3 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/vespera-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 80,
  "defense": 40,
  "health": 480,
  "speed": 95,
  "agility": 75,
  "accuracy": 90,
  "criticalChance": 0.13,
  "regeneration": 30,
  "resistance": 35,
  "element": "EARTH",
  "specialEnergy": 40
}
```

## Attaque : Dard du Crépuscule

- [VES-ATK-1] Inflige 80 % d'Attaque en dégâts physiques et 60 % d'Attaque en dégâts élémentaires (Terre).
- [VES-ATK-2] Applique Venin Sableux (1 charge) : 3 % des PV max de la cible en dégâts de poison par tour pendant 3 tours.
- [VES-ATK-3] Si la cible a déjà du Venin Sableux, ajoute une charge, 3 au maximum ; les dégâts doublent à chaque charge.

## Compétence spéciale : Nuée de Cristaux

- [VES-SPE-1] Coûte 40 points d'énergie ; frappe jusqu'à 3 ennemis adjacents.
- [VES-SPE-2] Inflige 100 % d'Attaque en dégâts physiques.
- [VES-SPE-3] Applique 2 charges de Venin Sableux à chaque cible touchée.
- [VES-SPE-4] Ignore 30 % de la Défense ennemie et ne peut pas être esquivée.

## Carapace de Sable (passif)

- [VES-CAR-1] Chaque esquive donne une charge de Carapace, 5 au maximum : +8 % de Défense et +3 % d'Esquive par charge.
- [VES-CAR-2] Les charges persistent jusqu'à ce que Vespera subisse des dégâts.

## Instinct de Guêpe (passif)

- [VES-INS-1] L'Esquive de Vespera augmente de 2 % par ennemi affecté par Venin Sableux, +10 % au maximum.
- [VES-INS-2] Lorsqu'un ennemi empoisonné par Vespera meurt, elle récupère 15 % de ses PV max.

## Danse du Désert

- [VES-DAN-1] Esquive augmentée de 40 % pendant 2 tours.
- [VES-DAN-2] Contre-attaque : chaque attaque esquivée pendant la danse déclenche un Dard du Crépuscule sur l'attaquant.
- [VES-DAN-3] Confusion : les ennemis ont 50 % de chances de viser un mirage, donc de manquer Vespera.
- [VES-DAN-4] Déclencheur : à partir du troisième tour, 25 % de chances, +10 % à chaque tour où elle ne se déclenche pas, puis retour à zéro.

## Reine du Crépuscule (ultime)

- [VES-REI-1] Se déclenche une seule fois par combat, dès que Vespera passe sous 50 % de ses PV max, pour 4 tours.
- [VES-REI-2] Intouchable pendant le premier tour : 100 % d'Esquive et immunité aux effets de contrôle.
- [VES-REI-3] Empoisonnement terminal : toutes les charges de Venin Sableux du terrain passent à 3 et leurs dégâts doublent.
- [VES-REI-4] Zone toxique : tous les ennemis perdent 5 % de leurs PV max par tour et ont −20 % d'Esquive.
- [VES-REI-5] Si Vespera meurt pendant l'ultime, 5 charges de Venin Sableux frappent tous les ennemis, en ignorant l'immunité aux poisons, et leur Précision baisse de 40 % pour le reste du combat.
