# Selkhet

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2d8908559db981ad84c7f7110124ad2f (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/selkhet-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 80,
  "defense": 35,
  "health": 300,
  "speed": 92,
  "agility": 82,
  "accuracy": 85,
  "criticalChance": 0.14,
  "regeneration": 20,
  "resistance": 30,
  "element": "EARTH",
  "specialEnergy": 80
}
```

## Attaque : Lacération Silencieuse

- [SEL-ATK-1] Inflige 75 % d'Attaque en dégâts physiques et 45 % d'Attaque en dégâts élémentaires (Terre).
- [SEL-ATK-2] Applique un Saignement de 2 % de la santé max de la cible par tour pendant 3 tours.
- [SEL-ATK-3] Portée depuis la Dissimulation, l'attaque inflige 50 % de dégâts physiques en plus.

## Compétence spéciale : Fusion Tectonique

- [SEL-SPE-1] Coûte 80 points d'énergie ; Camouflage Minéral : Selkhet devient invisible pour les ennemis pendant 2 tours, sauf si elle attaque.
- [SEL-SPE-2] Sens Sismique : révèle les ennemis dissimulés et augmente sa Précision de 30 %.
- [SEL-SPE-3] Griffures : ses attaques appliquent un Saignement qui réduit la Régénération de 50 % et inflige 3 % de la santé max par tour pendant 4 tours.

## Marche Fantôme (passif)

- [SEL-MAR-1] Selkhet commence chaque combat dissimulée, jusqu'à sa première attaque.
- [SEL-MAR-2] Après avoir éliminé un ennemi, elle regagne la Dissimulation pour 1 tour.

## Instinct de Chasseresse (passif)

- [SEL-INS-1] Dégâts augmentés de 25 % contre les cibles sous 40 % de santé.
- [SEL-INS-2] Si elle élimine une cible sous 30 % de santé, +15 % de Vitesse permanent, cumulable jusqu'à 3 fois par combat.

## Embuscade Tectonique

- [SEL-EMB-1] Selkhet s'enfonce dans le sol, intouchable, puis ressurgit au tour suivant pour frapper.
- [SEL-EMB-2] Attaque surprise : 150 % d'Attaque en dégâts physiques et 80 % d'Attaque en dégâts de Terre.
- [SEL-EMB-3] Applique un Étourdissement d'un tour.
- [SEL-EMB-4] Applique Fracture : la Défense de la cible baisse de 30 % pendant 2 tours.
- [SEL-EMB-5] Ne peut être utilisée que si Selkhet n'a pas subi de dégâts au tour précédent.
- [SEL-EMB-6] Délai de recharge : 4 tours.

## Jugement de l'Obsidienne (ultime)

- [SEL-JUG-1] Attaque tous les ennemis pour 200 % d'Attaque en dégâts physiques et 120 % d'Attaque en dégâts de Terre.
- [SEL-JUG-2] Exécution : les ennemis sous 25 % de santé sont éliminés.
- [SEL-JUG-3] Terrain d'Obsidienne : l'Esquive des ennemis baisse de 50 % pendant 3 tours.
- [SEL-JUG-4] Héritage de la Panthère : si Selkhet meurt dans les 3 tours qui suivent, elle transfère ses bonus de Vitesse à l'allié le plus rapide.
- [SEL-JUG-5] Une fois par combat.
