# Umiko

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2d2908559db9815c89a6e9e9d4f2c9c4 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/umiko-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 75,
  "defense": 50,
  "health": 500,
  "speed": 70,
  "agility": 70,
  "accuracy": 85,
  "criticalChance": 0.07,
  "regeneration": 45,
  "resistance": 55,
  "element": "WATER",
  "specialEnergy": 40
}
```

## Attaque : Fouet des Marées

- [UMI-ATK-1] Inflige 70 % d'Attaque en dégâts physiques et 70 % d'Attaque en dégâts élémentaires (Eau).
- [UMI-ATK-2] Réduit la Vitesse de la cible de 15 % pendant 1 tour.
- [UMI-ATK-3] Si un effet de terrain de type eau est présent, les dégâts sont augmentés de 20 %.

## Compétence spéciale : Prison des Huit Courants

- [UMI-SPE-1] Coûte 40 points d'énergie et enserre deux ennemis aléatoires.
- [UMI-SPE-2] Entrave : les cibles ont 70 % de chances d'échouer leur prochaine action offensive.
- [UMI-SPE-3] Drain d'énergie : réduit l'énergie des cibles de 15 points.
- [UMI-SPE-4] Vulnérabilité aquatique : les cibles subissent 50 % de dégâts supplémentaires des attaques de type Eau pendant 2 tours.
- [UMI-SPE-5] Sur des ennemis adjacents, crée une zone d'eau entre eux qui réduit leur Esquive de 30 %.

## Flux Adaptatif (passif)

- [UMI-FLX-1] À chaque tour, Umiko gagne +5 % de Vitesse et +3 % d'Esquive, cumulable jusqu'à 5 fois.
- [UMI-FLX-2] L'effet se réinitialise si elle subit des dégâts supérieurs à 30 % de sa Santé maximale.

## Intelligence des Profondeurs (passif)

- [UMI-INS-1] +10 % d'Esquive contre les ennemis qui ont déjà attaqué durant le combat.
- [UMI-INS-2] +15 % de Précision contre les ennemis qui ont déjà attaqué durant le combat.

## Tourbillon Entravant

- [UMI-TOU-1] Inflige 40 % d'Attaque en dégâts élémentaires (Eau).
- [UMI-TOU-2] Réduit la Défense de la cible de 20 % pendant 2 tours.
- [UMI-TOU-3] Empêche la cible de recevoir des effets de soutien (buff, soin) de ses alliés pendant 1 tour.
- [UMI-TOU-4] Utilisable une fois tous les 3 tours.

## Marée des Possibilités (ultime)

- [UMI-ULT-1] S'active lorsqu'Umiko atteint 50 % de Santé ou moins ; le champ de bataille devient aquatique.
- [UMI-ULT-2] Illusion octuple : 3 clones aquatiques qui durent 3 tours ; les ennemis ont 40 % de chances d'attaquer un clone.
- [UMI-ULT-3] Coordination parfaite : tous les alliés gagnent +25 % de Vitesse et +20 % de Précision tant que l'ultime est active.
- [UMI-ULT-4] Labyrinthe des marées : les ennemis perdent 10 % d'Esquive et leurs coûts en énergie augmentent de 5 points.
- [UMI-ULT-5] Héritage de la Tisseuse : si Umiko meurt pendant l'ultime, un clone persiste 2 tours de plus et lance « Prison des Huit Courants » une dernière fois.
