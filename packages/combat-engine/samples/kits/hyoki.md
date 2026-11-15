# Hyōki

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2d6908559db98141a85df8b9fd992707 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/hyoki-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 65,
  "defense": 55,
  "health": 520,
  "speed": 65,
  "agility": 60,
  "accuracy": 80,
  "criticalChance": 0.04,
  "regeneration": 40,
  "resistance": 50,
  "element": "AIR",
  "specialEnergy": 45
}
```

## Attaque : Rafale Polaire

- [HYO-ATK-1] Inflige 80 % d'Attaque en dégâts physiques et 80 % d'Attaque en dégâts élémentaires (Air).
- [HYO-ATK-2] L'allié avec le moins de vie gagne +15 % de Défense pendant 1 tour.
- [HYO-ATK-3] Si la cible est affectée par un effet de Gel, inflige 15 % de dégâts supplémentaires.

## Compétence spéciale : Cercle de la Colonie

- [HYO-SPE-1] Coûte 45 points d'énergie ; Protection collective : tous les alliés gagnent +25 % de Défense pendant 2 tours.
- [HYO-SPE-2] Partage du fardeau : les dégâts subis par un allié du cercle sont réduits de 20 % et répartis entre les membres de l'équipe, 5 % au maximum par personne.
- [HYO-SPE-3] Résonance du groupe : pour chaque allié vivant, tous les membres du cercle gagnent +3 % à toutes leurs statistiques, +15 % au maximum.

## Souffle Encourageant (passif)

- [HYO-SOU-1] Chaque fois qu'un allié utilise une compétence (autre que l'attaque simple), Hyōki gagne 3 points d'énergie.
- [HYO-SOU-2] Les alliés à moins de 30 % de Santé gagnent +15 % d'Esquive.

## Esprit de Colonie (passif)

- [HYO-ESP-1] Hyōki gagne +5 % à toutes ses statistiques par allié encore en vie, +20 % au maximum.
- [HYO-ESP-2] Si un allié tombe, Hyōki gagne +30 % d'Attaque pendant 2 tours, sans cumul.

## Bourrasque Protectrice

- [HYO-BOU-1] L'allié ciblé gagne un bouclier de 40 % de la Santé maximale d'Hyōki pendant 2 tours.
- [HYO-BOU-2] Supprime un effet négatif de la cible, au hasard.
- [HYO-BOU-3] L'allié ciblé gagne +20 % de Vitesse pendant 1 tour.
- [HYO-BOU-4] Utilisable une fois tous les 3 tours.

## Tempête de l'Empereur (ultime)

- [HYO-TEM-1] Se déclenche lorsqu'un allié tombe sous 25 % de Santé ou qu'Hyōki atteint 40 % de Santé.
- [HYO-TEM-2] Le champ de bataille devient un paysage antarctique pendant 3 tours.
- [HYO-TEM-3] Résurrection partielle : un allié tombé dans les 2 derniers tours revient avec 30 % de sa Santé maximale.
- [HYO-TEM-4] Aura de l'empereur : tous les alliés gagnent +35 % d'Attaque et +25 % de Vitesse, et régénèrent 10 % de leur Santé par tour.
- [HYO-TEM-5] Blizzard solidaire : les ennemis subissent 15 % de dégâts d'Air par tour et ont −20 % de Précision.
- [HYO-TEM-6] Héritage de la colonie : si Hyōki meurt pendant l'ultime, l'aura persiste 2 tours de plus et ses alliés gagnent Rage de la Colonie, leur prochaine attaque infligeant 50 % de dégâts en plus, une fois.
