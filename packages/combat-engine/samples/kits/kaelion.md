# Kaelion

Export de la fiche Notion, source de vérité du kit :
https://app.notion.com/p/2ac908559db980a18377e69b167341f0 (exportée le 2026-11-15).

Chaque effet testable porte un identifiant. `test/kits/kit-traceability.e2e-spec.ts`
exige au moins un test `it('[ID] …')` par identifiant dans `test/fight/kaelion-kit.e2e-spec.ts`,
et compare les caractéristiques ci-dessous à `samples/cards.json`.

```json kit-stats
{
  "attack": 85,
  "defense": 50,
  "health": 530,
  "speed": 80,
  "agility": 60,
  "accuracy": 85,
  "criticalChance": 0.08,
  "regeneration": 40,
  "resistance": 45,
  "element": "FIRE",
  "specialEnergy": 50
}
```

## Écarts avec Notion

Le moteur ne suit pas encore ces points de la fiche ; ils ne portent pas d'identifiant et ne sont pas testés :

- Flamme Terreuse : Notion pose une brûlure légère de niveau 1 (deux tours) ; le moteur pose une brûlure de niveau 2 (trois tours).
- Élan de la salamandre : Notion le déclenche automatiquement au début du tour ; le moteur le lance à la place de l'attaque normale.
- Élan de la salamandre : Notion réduit la Défense de l'ennemi de 15 % ; le moteur n'applique pas cette réduction.
- Résilience Pyro-Minérale : Notion donne +15 % d'Attaque sous le bouclier de basalte ; le moteur n'applique pas ce bonus.

Valeurs actuelles du moteur pour les caractéristiques que `cards.json` ne suit pas encore :

```json kit-stat-gaps
{
  "regeneration": null,
  "resistance": null
}
```

## Attaque : Flamme Terreuse

- [KAE-ATK-1] Inflige 80 % d'Attaque en dégâts physiques, 20 % d'Attaque en dégâts de Feu et 10 % d'Attaque en dégâts de Terre.
- [KAE-ATK-2] 50 % de chances de laisser une brûlure qui inflige 10 % de l'Attaque par tour.
- [KAE-ATK-3] 20 % de chances d'étourdir l'ennemi (niveau 1) pendant un tour.

## Compétence spéciale : Cœur de Basalte

- [KAE-SPE-1] Coûte 50 points d'énergie ; inflige 100 % d'Attaque en dégâts de Feu et 100 % d'Attaque en dégâts de Terre à tous les ennemis.
- [KAE-SPE-2] Réduit l'Esquive des ennemis touchés de 20 % pendant 3 tours.
- [KAE-SPE-3] Ajoute un bouclier de roche fondue sur Kaelion de 30 % de ses PV max jusqu'au prochain tour.

## Élan de la salamandre

- [KAE-ELA-1] Inflige 120 % de dégâts d'Attaque (Feu : 60 %, physique : 60 %).
- [KAE-ELA-2] Se déclenche tous les trois tours.

## Résilience Pyro-Minérale (passif)

- [KAE-RES-1] Lorsqu'il passe sous 30 % de PV, il génère un bouclier de basalte de 30 % de ses PV max.

## Recharge naturelle

- [KAE-REC-1] Au premier coup mortel, Kaelion conserve 1 PV ; ne fonctionne qu'une fois.
- [KAE-REC-2] Sa Défense augmente de 100 % et son Attaque de 150 % jusqu'à la fin de son prochain tour.

## Larmes de la salamandre (lien)

- [KAE-LAR-1] Lorsqu'Arionis tombe sous 30 % de PV, explosion de 200 % d'Attaque en dégâts de Feu sur le dernier ennemi qui a blessé Arionis.
- [KAE-LAR-2] Transfert de puissance : l'Attaque d'Arionis augmente de 10 % et sa Défense de 20 %.
