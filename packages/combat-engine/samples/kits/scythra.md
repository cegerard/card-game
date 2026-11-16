# Scythra

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2d8908559db9813e872ce79816561d77 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/scythra-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 85,
  "defense": 40,
  "health": 300,
  "speed": 85,
  "agility": 65,
  "accuracy": 95,
  "criticalChance": 0.13,
  "regeneration": 25,
  "resistance": 35,
  "element": "AIR",
  "specialEnergy": 30
}
```

## Attaque : Lacération du Zéphyr

- [SCY-ATK-1] Inflige 60 % d'Attaque en dégâts physiques et 40 % d'Attaque en dégâts élémentaires (Vent).
- [SCY-ATK-2] Applique 1 pile de Saignement : 5 % de l'Attaque de Scythra par tour pendant 3 tours.
- [SCY-ATK-3] Si la cible a déjà 3 piles de Saignement ou plus, les dégâts physiques augmentent de 20 %.

## Compétence spéciale : Dissection Éolienne

- [SCY-SPE-1] Coûte 30 points d'énergie ; frappe 4 fois la cible, chaque coup infligeant 35 % d'Attaque en dégâts physiques.
- [SCY-SPE-2] Applique 2 piles de Saignement par coup réussi, 8 piles au maximum.
- [SCY-SPE-3] Les piles appliquées par cette compétence durent 4 tours.
- [SCY-SPE-4] Si la Précision de Scythra dépasse l'Esquive de la cible de plus de 20 points, elle garde 10 points d'énergie après la compétence.

## Aéro-traqueur (passif)

- [SCY-AER-1] Gagne +15 % de Précision.
- [SCY-AER-2] Les ennemis qui saignent ne bénéficient pas de leurs bonus d'Esquive contre Scythra.

## Anatomie Prédatrice (passif)

- [SCY-ANA-1] +2 % d'Attaque par pile de Saignement présente sur le terrain, toutes cibles confondues, +30 % au maximum.
- [SCY-ANA-2] Curée : lorsqu'un ennemi meurt du Saignement, Scythra régénère 10 % de sa Santé maximum.

## Lames du Vent Rouge

- [SCY-LAM-1] Se déclenche une seule fois par combat, quand Scythra a appliqué 10 piles de Saignement cumulées.
- [SCY-LAM-2] Saignée : pendant 3 tours, ses attaques appliquent une pile de plus, et ses piles infligent 8 % de l'Attaque au lieu de 5 %.
- [SCY-LAM-3] +20 % de Vitesse pendant la durée de l'effet.

## Exsanguination Totale (ultime)

- [SCY-EXS-1] Ne se déclenche que sur une cible portant au moins 5 piles de Saignement.
- [SCY-EXS-2] Coûte 10 points d'énergie, prélevés en début de tour seulement si l'ultime touche une cible.
- [SCY-EXS-3] Détonation Hémorragique : consomme toutes les piles de la cible ; 40 % d'Attaque en dégâts physiques par pile, en ignorant 50 % de la Défense.
- [SCY-EXS-4] Vent Écarlate : la cible et ses voisins reçoivent 3 piles de Saignement et 60 % d'Attaque en dégâts de Vent.
- [SCY-EXS-5] Choc Hémorragique : si la cible tombe sous 30 % de Santé, sa Défense baisse de 40 % et sa Régénération de 80 % pendant 4 tours.
- [SCY-EXS-6] Si Scythra meurt dans les 2 tours qui suivent, toutes les piles de Saignement du terrain explosent : 20 % de son Attaque à chaque cible touchée.
