# Arionis

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/26d908559db9808b83a6ddc453df3e71 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/arionis-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 85,
  "defense": 60,
  "health": 550,
  "speed": 75,
  "agility": 55,
  "accuracy": 80,
  "criticalChance": 0.05,
  "regeneration": 45,
  "resistance": 50,
  "element": "FIRE",
  "specialEnergy": 40
}
```

## Écarts avec Notion

Le moteur ne suit pas encore ces points de la fiche ; ils ne portent pas d'identifiant et ne sont pas testés :

- Poings de Braise : Notion pose une brûlure de niveau 1 (deux tours) ; le moteur pose une brûlure de niveau 2 (trois tours).
- Rugissement solaire : Notion inflige des dégâts élémentaires de Feu ; le moteur inflige des dégâts physiques.
- Rugissement solaire : Notion pose une brûlure grave de niveau 3 ; le moteur pose une brûlure de niveau 2.
- Héritage du Lion : Notion rend 33 % des PV quand le responsable tombe ; le moteur soigne 33 % de l'Attaque.

Valeurs actuelles du moteur pour les caractéristiques que `cards.json` ne suit pas encore :

```json kit-stat-gaps
{
  "regeneration": null,
  "resistance": null
}
```

## Attaque : Poings de Braise

- [ARI-ATK-1] Inflige 80 % d'Attaque en dégâts physiques et 40 % d'Attaque en dégâts élémentaires (Feu).
- [ARI-ATK-2] Chaque coup laisse une brûlure qui inflige 10 % de l'Attaque par tour.

## Compétence spéciale : Rugissement solaire

- [ARI-SPE-1] Coûte 40 points d'énergie ; inflige 150 % d'Attaque à tous les ennemis.
- [ARI-SPE-2] Pose une brûlure qui ajoute 30 % de l'Attaque par tour.
- [ARI-SPE-3] Inspiration : +5 % d'Attaque et +5 % de Défense aux alliés jusqu'à la fin de leur prochain tour.
- [ARI-SPE-4] Si son frère cadet (Kaelion) est présent, l'effet de soutien est multiplié par deux.

## Chaleur étouffante (passif)

- [ARI-CHA-1] Lorsqu'il pose une brûlure, 30 % de chances de réduire la Défense de l'adversaire de 8 %.

## Fierté du lion (passif)

- [ARI-FIE-1] Tant qu'Arionis a plus de 50 % de sa vie, son Attaque gagne 5 % à chaque tour.

## Griffes Ardentes

- [ARI-GRI-1] 4 frappes successives, chacune infligeant 40 % de dégâts physiques.
- [ARI-GRI-2] Si toute la combinaison touche le même ennemi, il reçoit 80 % d'Attaque en dégâts de Feu.
- [ARI-GRI-3] Ne se déclenche que tous les 3 tours, à la place de l'attaque normale.

## Héritage du Lion (lien)

- [ARI-HER-1] À la mort de Kaelion, explosion de 100 % d'Attaque en dégâts de Feu sur tous les ennemis, avec une brûlure de niveau 3 jusqu'à la fin de l'héritage.
- [ARI-HER-2] Buff héroïque : +40 % d'Attaque jusqu'à la fin de l'héritage.
- [ARI-HER-3] Vengeance : Arionis ne cible plus que le responsable de la mort de son frère.
- [ARI-HER-4] Si le responsable est vaincu, l'héritage s'arrête : la brûlure et le bonus d'Attaque se dissipent, et Arionis reprend son ciblage.
