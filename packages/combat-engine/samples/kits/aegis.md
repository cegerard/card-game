# Aegis

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2af908559db980adb16fc8c677fbd9ac (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/aegis-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 55,
  "defense": 85,
  "health": 650,
  "speed": 50,
  "agility": 35,
  "accuracy": 60,
  "criticalChance": 0.03,
  "regeneration": 55,
  "resistance": 75,
  "element": "EARTH",
  "specialEnergy": 40
}
```

## Attaque : Poing de Limon

- [AEG-ATK-1] Inflige 70 % de dégâts physiques et 35 % de dégâts élémentaires (Terre/Eau).
- [AEG-ATK-2] Chaque coup a 25 % de chances d'appliquer Enlisement : Vitesse −10 % pendant 3 tours, cumulable jusqu'à 3 fois.

## Compétence spéciale : Forteresse des Âges

- [AEG-SPE-1] Coûte 40 points d'énergie ; Aegis et tous ses alliés obtiennent un bouclier de 50 % de leurs PV max pendant 3 tours.
- [AEG-SPE-2] Contre-attaque défensive : chaque attaque reçue pendant Forteresse des Âges inflige 50 % d'Attaque en dégâts Terre/Eau à l'attaquant.
- [AEG-SPE-3] Ancrage : Aegis est immunisé aux effets de contrôle pendant la durée de la compétence.

## Résilience des marais (passif)

- [AEG-RES-1] Sur un coup reçu, 30 % de chances de réduire les dégâts de 15 %.
- [AEG-RES-2] Indépendamment, 30 % de chances d'appliquer Enlisement à l'attaquant.

## Endurance séculaire (passif)

- [AEG-END-1] Tant qu'Aegis a plus de 30 % de sa vie, +10 % de Défense.
- [AEG-END-2] Sous 30 % de vie, +15 % de Régénération à la place.

## Vagues de Pierre

- [AEG-VAG-1] 3 vagues successives, chacune infligeant 45 % de dégâts physiques à tous les ennemis.
- [AEG-VAG-2] Chaque vague applique un niveau d'Enlisement aux ennemis touchés.
- [AEG-VAG-3] Un ennemi touché par les 3 vagues subit 60 % de dégâts Terre/Eau supplémentaires et est étourdi pendant 1 tour.
- [AEG-VAG-4] Ne se déclenche que tous les 4 tours, à la place de l'attaque normale.

## Gardien Éternel (ultime défensif)

- [AEG-GAR-1] Quand un allié tombe sous 20 % de PV, une fois par combat, Aegis intercepte toutes les attaques qui le visent pendant 2 tours.
- [AEG-GAR-2] Aegis gagne +50 % de Défense et +30 % de Régénération pendant la durée.
- [AEG-GAR-3] L'allié protégé récupère 10 % de ses PV par tour tant que Gardien Éternel est actif.
- [AEG-GAR-4] Si Aegis tombe pendant Gardien Éternel, l'allié protégé récupère 40 % de ses PV et gagne +20 % de Défense pour le reste du combat.
