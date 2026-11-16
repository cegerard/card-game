# Kaito

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2ae908559db980778faee6d20f4c0314 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/kaito-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 85,
  "defense": 45,
  "health": 520,
  "speed": 85,
  "agility": 70,
  "accuracy": 85,
  "criticalChance": 0.12,
  "regeneration": 35,
  "resistance": 40,
  "element": "WATER",
  "specialEnergy": 40
}
```

## Attaque : Crocs de Marée

- [KAI-ATK-1] Inflige 80 % d'Attaque en dégâts physiques et 40 % d'Attaque en dégâts élémentaires (Eau).
- [KAI-ATK-2] Chaque coup a 20 % de chances d'appliquer une marque de Trempage, qui augmente les dégâts d'Eau reçus de 5 % ; cumulable jusqu'à 5 fois.

## Compétence spéciale : Abysses Impitoyables

- [KAI-SPE-1] Coûte 40 points d'énergie ; inflige 150 % d'Attaque en dégâts d'Eau à tous les ennemis et leur ajoute 2 marques de Trempage.
- [KAI-SPE-2] Instinct du prédateur : +20 % d'Esquive jusqu'à la fin de son prochain tour.
- [KAI-SPE-3] Si un ennemi est déjà affecté par Trempage, les dégâts sont augmentés de 30 %.

## Courant glacial (passif)

- [KAI-COU-1] Lorsqu'il applique une marque de Trempage, 30 % de chances de réduire la Vitesse de l'adversaire de 8 %.

## Sang-froid du chasseur (passif)

- [KAI-SAN-1] Sous 40 % de vie, son taux de critique passe de 12 % à 42 %.

## Tourbillon Carnassier

- [KAI-TOU-1] 5 frappes successives de 35 % de dégâts physiques.
- [KAI-TOU-2] Si toute la combinaison touche, l'adversaire reçoit 90 % d'Attaque en dégâts d'Eau et deux marques de Trempage.
- [KAI-TOU-3] Ne se déclenche que tous les 3 tours, à la place de l'attaque normale.

## Frénésie du Grand Blanc (transformation)

- [KAI-FRE-1] Sous 25 % de PV, une seule fois par combat, Kaito entre en Frénésie pendant 3 tours.
- [KAI-FRE-2] Gagne +35 % d'Attaque et +20 % de Vitesse.
- [KAI-FRE-3] Récupère 10 % de ses PV à chaque attaque réussie.
- [KAI-FRE-4] Immunisé aux effets de statut négatifs pendant la Frénésie.
- [KAI-FRE-5] À la fin de la Frénésie, Kaito perd 10 % de ses PV.
