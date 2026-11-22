# Lysandra

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2d1908559db981f1a454defca6c98a27 (exportée le 2026-11-21).

Brouillon : Lysandra n'est pas encore dans `samples/cards.json`. Ce fichier passe dans
`samples/kits/` avec la PR qui ajoute la carte et `test/fight/lysandra-kit.e2e-spec.ts`,
qui portera un test `it('[ID] …')` par identifiant.

```json kit-stats
{
  "attack": 55,
  "defense": 45,
  "health": 480,
  "speed": 70,
  "agility": 85,
  "accuracy": 80,
  "criticalChance": 0.04,
  "regeneration": 75,
  "resistance": 65,
  "element": "FIRE",
  "specialEnergy": 30
}
```

## Attaque : Étincelle de Chrysalide

- [LYS-ATK-1] Inflige 70 % d'Attaque en dégâts physiques et 60 % d'Attaque en dégâts élémentaires (Feu).
- [LYS-ATK-2] Applique la marque « Cible Prioritaire » sur l'ennemi touché pendant 2 tours.
- [LYS-ATK-3] Les alliés qui attaquent une cible marquée gagnent +15 % de Précision.

## Compétence spéciale : Cocon de Flammes Régénératrices

- [LYS-SPE-1] Coûte 30 points d'énergie ; soin immédiat de 25 % des PV max de l'allié qui a le moins de PV.
- [LYS-SPE-2] Régénération : l'allié soigne 8 % de ses PV max au début de chacun de ses tours pendant 3 tours.
- [LYS-SPE-3] Bouclier de soie enflammée : absorbe 15 % des PV max de l'allié pendant 2 tours.
- [LYS-SPE-4] Si l'allié tombe à 0 PV pendant la régénération, il ressuscite à 20 % de ses PV, une fois par combat et par allié.

## Flamme de Vie (passif)

- [LYS-VIE-1] Aura de 2 cases : les alliés dans l'aura régénèrent 5 % de leurs PV max au début de leur tour.
- [LYS-VIE-2] Les saignements et poisons des alliés dans l'aura sont réduits de 50 %.

## Grâce du Papillon (passif)

- [LYS-GRA-1] +25 % d'Esquive.
- [LYS-GRA-2] +20 % de Résistance aux altérations d'état.
- [LYS-GRA-3] Lysandra subit 15 % de dégâts physiques supplémentaires.

## Métamorphose Partagée

- [LYS-MET-1] L'allié ciblé gagne +30 % d'Attaque, +20 % de Vitesse et +15 % de Précision pendant 3 tours.
- [LYS-MET-2] Coûte 5 points d'énergie.
- [LYS-MET-3] Temps de recharge : 4 tours.
- [LYS-MET-4] Si l'allié ciblé élimine un ennemi pendant le buff, Lysandra récupère 3 points d'énergie.

## Ascension du Phénix (ultime)

- [LYS-ULT-1] Se déclenche une fois par combat, à la mort d'un allié, si Lysandra a au moins 40 % de ses PV.
- [LYS-ULT-2] Soin de masse : les alliés vivants récupèrent 35 % de leurs PV max.
- [LYS-ULT-3] Résurrection : l'allié mort revient avec 20 % de ses PV max.
- [LYS-ULT-4] Purification totale : retire toutes les altérations d'état négatives de tous les alliés.
- [LYS-ULT-5] Buff d'endurance : tous les alliés gagnent +25 % de Défense et +30 % de Résistance pendant 3 tours.
- [LYS-ULT-6] Si Lysandra meurt pendant son ultime, les buffs et régénérations qu'elle a appliqués durent 3 tours de plus.
- [LYS-ULT-7] À cette mort, tous les alliés gagnent un bouclier de 20 % de leurs PV max.

## Écarts avec Notion

Décidés le 2026-11-22.

- LYS-VIE-1, LYS-VIE-2 : le moteur n'a pas de grille ; l'aura couvre les deux alliés voisins de Lysandra dans le deck (positions −1 et +1).
  Les positions sont fixes : un voisin mort ne laisse pas sa place au suivant.
- LYS-SPE-4 : pas de mort suivie d'une résurrection ; comme SURVIVE, le coup fatal est intercepté et l'allié remonte à 20 % de ses PV. Il ne meurt pas, donc LYS-ULT-1 ne se déclenche pas.

## Précisions

Points que Notion laisse ouverts, décidés le 2026-11-22.

- LYS-SPE-2, LYS-VIE-1 : les soins sur la durée tombent au début du tour du porteur, pas en fin de tour comme les autres soins du moteur.
- LYS-SPE-1 : l'allié qui a le moins de PV en valeur absolue, Lysandra exclue.
- LYS-MET-1 : l'allié qui a la plus forte Attaque au moment du lancement, Lysandra exclue.
- LYS-ULT-6 : « pendant son ultime » = pendant les 3 tours du buff d'endurance.
- LYS-ULT-2, LYS-ULT-4, LYS-ULT-7 : « tous les alliés » exclut Lysandra.
- LYS-ULT-5 : le buff d'endurance est porté par le battlefield de l'ultime, donc Lysandra le reçoit aussi.
- LYS-GRA-2 : +20 % de la Résistance de base (65 → 78), comme toute altération du moteur.

## Prérequis moteur

À retirer au fur et à mesure des PR. Le reste du kit se construit déjà avec le moteur.

| Manque | Identifiants |
|---|---|
| Point faible donnant un bonus de Précision à tous ses attaquants, pas seulement au révélateur | LYS-ATK-3 |
| Ciblage de l'allié qui a le moins de PV en valeur (`lowest-health-ally` compare des ratios) | LYS-SPE-1 |
| Spécial HEALING : base `target-max-health`, bouclier et effets sur la même cible que le soin | LYS-SPE-1, LYS-SPE-3 |
| Soin sur la durée en % des PV max, posé sur une cible, qui tombe au début du tour du porteur | LYS-SPE-2, LYS-VIE-1 |
| SURVIVE accordé à une autre carte, remontant à 20 % des PV, actif pendant la régénération, une fois par combat et par allié | LYS-SPE-4 |
| Aura passive sur les deux alliés voisins, active tant que Lysandra vit | LYS-VIE-1, LYS-VIE-2 |
| Réduction des dégâts de poison et de saignement pour les cartes de l'aura | LYS-VIE-2 |
| Passif permanent de dégâts subis amplifiés pour un type, sans jet de résistance | LYS-GRA-3 |
| Ciblage de l'allié qui a la plus forte Attaque au lancement | LYS-MET-1 |
| `energyCost` sur SUPPORT | LYS-MET-2 |
| Événement « un allié portant mon buff a tué un ennemi » | LYS-MET-4 |
| Condition de santé du lanceur sur l'événement d'une TRANSFORMATION, sans déclenchement par la santé | LYS-ULT-1 |
| Purification de tous les statuts et debuffs | LYS-ULT-4 |
| Prolongation, à la mort du lanceur, des altérations et soins qu'il a posés hors battlefield | LYS-ULT-6 |
| Bouclier SUPPORT en % des PV max de la cible | LYS-ULT-7 |
