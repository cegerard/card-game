# Feature Specification: Support du kit de combat de Kaito

**Feature Branch**: `009-kaito-character-support`
**Created**: 2026-09-10
**Status**: Draft
**Input**: User description: "Ajouter le support complet du kit de combat du personnage Kaito (Assassin, élément Eau, totem Requin) au moteur de combat. Kit : attaque de base multi-dégâts avec marque de Trempage stackable, spécial AoE avec bonus conditionnel sur cible marquée et buff d'esquive, passif de debuff de vitesse déclenché, passif de critique dynamique basé sur la vie, attaque multi-coups périodique avec finisher conditionnel, transformation à usage unique déclenchée par seuil de vie avec buffs multiples, immunité aux statuts, régénération au contact et coût différé."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attaque de base avec marque de Trempage cumulable (Priority: P1)

En tant qu'intégrateur configurant une bataille, je veux que l'attaque de base de Kaito inflige des dégâts mixtes (physique + élémentaire Eau) et pose progressivement une marque de vulnérabilité à l'Eau sur sa cible, pour que la pression offensive de Kaito augmente naturellement au fil du combat.

**Why this priority**: C'est le socle du personnage — sans cette mécanique de marque cumulable, aucune des autres capacités de Kaito (spécial, passifs, finisher) ne peut produire ses effets prévus, puisqu'elles dépendent toutes de l'existence de la marque de Trempage.

**Independent Test**: Peut être testé isolément en simulant plusieurs échanges d'attaques de base de Kaito contre une même cible et en vérifiant que (a) les dégâts infligés respectent la répartition physique/élémentaire, (b) la marque s'applique avec la probabilité annoncée, (c) chaque marque supplémentaire augmente les dégâts élémentaires Eau que la cible reçoit par la suite, jusqu'au plafond prévu.

**Acceptance Scenarios**:

1. **Given** Kaito attaque une cible sans marque de Trempage, **When** l'attaque touche, **Then** les dégâts infligés combinent une part physique et une part élémentaire Eau dans les proportions définies pour la capacité.
2. **Given** une attaque de base de Kaito touche sa cible, **When** le tirage de probabilité de pose de marque réussit, **Then** la cible gagne une marque de Trempage supplémentaire (jusqu'au plafond) et l'issue est visible dans le journal de combat.
3. **Given** une cible porte déjà des marques de Trempage, **When** elle subit une nouvelle attaque élémentaire Eau (de Kaito ou d'un autre attaquant), **Then** les dégâts élémentaires Eau qu'elle reçoit sont augmentés proportionnellement au nombre de marques actives.
4. **Given** une cible porte déjà le nombre maximal de marques de Trempage, **When** une nouvelle marque devrait s'appliquer, **Then** le nombre de marques reste plafonné et l'augmentation de dégâts ne dépasse pas le maximum prévu.

---

### User Story 2 - Transformation "Frénésie du Grand Blanc" (Priority: P2)

En tant qu'intégrateur, je veux que Kaito puisse déclencher une fois par combat une transformation temporaire lorsque ses points de vie chutent sous un seuil critique, pour offrir un retournement de situation spectaculaire et unique en fin de combat.

**Why this priority**: C'est la capacité signature du personnage et celle qui a le plus d'impact sur l'issue d'un combat serré ; elle est toutefois indépendante du reste du kit (elle ne dépend pas de la marque de Trempage) et peut être livrée et testée séparément.

**Independent Test**: Peut être testé isolément en plaçant Kaito à un niveau de vie proche du seuil de déclenchement, en lui faisant subir des dégâts jusqu'à franchir le seuil, puis en vérifiant l'activation unique de la transformation, ses effets pendant sa durée, et son coût à l'expiration — sans dépendre d'aucune autre capacité du kit.

**Acceptance Scenarios**:

1. **Given** Kaito est au-dessus du seuil de vie critique et n'a pas encore utilisé sa transformation, **When** une attaque fait chuter ses points de vie sous ce seuil, **Then** la transformation s'active immédiatement et ses bonus (attaque, vitesse) sont appliqués.
2. **Given** la transformation est active, **When** Kaito subirait normalement un effet de statut négatif (poison, brûlure, gel, étourdissement, ou toute réduction de statistique), **Then** cet effet est intégralement ignoré tant que la transformation dure.
3. **Given** la transformation est active, **When** une attaque de Kaito touche effectivement une cible, **Then** Kaito récupère un pourcentage de ses points de vie maximum.
4. **Given** la transformation a atteint sa durée maximale, **When** elle prend fin, **Then** Kaito perd un pourcentage de ses points de vie maximum et les bonus temporaires sont retirés.
5. **Given** Kaito a déjà utilisé sa transformation une fois pendant le combat, **When** ses points de vie repassent sous le seuil de déclenchement une seconde fois, **Then** la transformation ne se déclenche pas à nouveau.

---

### User Story 3 - Spécial "Abysses Impitoyables" avec bonus conditionnel (Priority: P3)

En tant qu'intégrateur, je veux que le spécial de Kaito inflige des dégâts de zone à tous les ennemis, inflige davantage de dégâts aux cibles déjà marquées par le Trempage, applique de nouvelles marques, et procure à Kaito un bonus d'esquive temporaire, pour représenter une capacité ultime qui synergise avec le reste du kit.

**Why this priority**: Cette capacité renforce la cohérence du kit (elle exploite la marque de Trempage) mais n'est pas indispensable au fonctionnement minimal du personnage ; elle peut être ajoutée après le socle (US1).

**Independent Test**: Peut être testé isolément en déclenchant le spécial de Kaito contre un groupe d'ennemis dont certains portent déjà des marques de Trempage et d'autres non, puis en vérifiant les dégâts différenciés, la pose de nouvelles marques, et l'application du bonus d'esquive sur Kaito.

**Acceptance Scenarios**:

1. **Given** Kaito dispose de l'énergie requise, **When** il déclenche son spécial, **Then** tous les ennemis présents subissent des dégâts élémentaires Eau proportionnels à son attaque.
2. **Given** un ennemi ciblé par le spécial porte déjà au moins une marque de Trempage avant l'attaque, **When** le spécial le touche, **Then** les dégâts qu'il subit sont augmentés du bonus prévu par rapport à un ennemi non marqué.
3. **Given** le spécial touche un ennemi, **When** les dégâts sont résolus, **Then** cet ennemi gagne des marques de Trempage supplémentaires (dans la limite du plafond).
4. **Given** Kaito déclenche son spécial, **When** l'action se résout, **Then** Kaito gagne un bonus temporaire de chance d'esquiver les attaques, actif jusqu'à la fin de son tour suivant puis retiré automatiquement.

---

### User Story 4 - Attaque périodique "Tourbillon Carnassier" avec finisher conditionnel (Priority: P4)

En tant qu'intégrateur, je veux que Kaito remplace périodiquement son attaque normale par un enchaînement de coups multiples, complété par un coup de finition supplémentaire si tous les coups ont touché la même cible sans qu'aucun ne soit esquivé, pour ajouter de la variété et de la punition envers les cibles peu mobiles.

**Why this priority**: Apporte de la profondeur tactique mais reste secondaire par rapport au socle offensif et à la transformation ; peut être livré après les user stories précédentes.

**Independent Test**: Peut être testé isolément en simulant plusieurs tours consécutifs et en vérifiant que l'enchaînement remplace bien l'attaque normale à la bonne cadence, et que le coup de finition ne se produit que lorsqu'aucun coup de la série n'a été esquivé par la cible.

**Acceptance Scenarios**:

1. **Given** Kaito doit agir et le compte de tours écoulés depuis son dernier enchaînement atteint la cadence prévue, **When** vient son tour d'agir, **Then** il exécute l'enchaînement de coups multiples à la place de son attaque normale.
2. **Given** Kaito exécute l'enchaînement et qu'aucun des coups n'a été esquivé par la cible touchée, **When** l'enchaînement se termine, **Then** un coup de finition supplémentaire inflige des dégâts élémentaires Eau et pose des marques de Trempage sur cette cible.
3. **Given** Kaito exécute l'enchaînement et qu'au moins un coup a été esquivé par la cible, **When** l'enchaînement se termine, **Then** aucun coup de finition ne se produit sur cette cible.
4. **Given** l'enchaînement vient de se produire, **When** les tours suivants s'écoulent avant que la cadence ne soit de nouveau atteinte, **Then** Kaito utilise son attaque normale pendant l'intervalle.

---

### User Story 5 - Passifs réactifs à l'état de Kaito (Priority: P5)

En tant qu'intégrateur, je veux que Kaito bénéficie de deux passifs réactifs — une chance de ralentir un ennemi fraîchement marqué, et un bonus de critique tant que sa vie est basse — pour renforcer son identité de prédateur qui devient plus dangereux au fur et à mesure du combat.

**Why this priority**: Ce sont des effets d'appoint qui enrichissent le personnage sans être structurants ; le personnage reste jouable et fidèle à son concept même si ces passifs arrivent en dernier.

**Independent Test**: Peut être testé isolément : (a) en déclenchant une pose de marque de Trempage et en vérifiant statistiquement la chance de ralentissement appliquée à la cible ; (b) en faisant varier les points de vie de Kaito de part et d'autre du seuil critique et en vérifiant que son taux de critique s'ajuste dynamiquement dans les deux sens.

**Acceptance Scenarios**:

1. **Given** une marque de Trempage vient d'être appliquée avec succès sur un ennemi, **When** le tirage de probabilité du ralentissement réussit, **Then** la vitesse de cet ennemi est réduite du pourcentage prévu pour la durée définie.
2. **Given** les points de vie de Kaito passent sous le seuil critique du passif de critique, **When** il effectue sa prochaine action offensive, **Then** son taux de critique reflète le bonus actif.
3. **Given** les points de vie de Kaito remontent au-dessus du seuil critique du passif de critique (par exemple grâce à un soin), **When** il effectue sa prochaine action offensive, **Then** son taux de critique revient à sa valeur normale, sans bonus.

---

### Edge Cases

- Une cible atteint déjà le nombre maximal de marques de Trempage lorsqu'une attaque (de base, spéciale, ou finisher) tenterait d'en ajouter d'autres : le nombre de marques ne dépasse jamais le plafond et l'augmentation de dégâts élémentaires Eau reste bornée au maximum prévu.
- Le bonus de dégâts conditionnel du spécial ("cible déjà marquée") s'évalue sur l'état de marquage de la cible *avant* que ce même spécial n'ajoute ses propres nouvelles marques — une cible non marquée avant l'attaque ne bénéficie pas rétroactivement du bonus sur cette même attaque.
- Une cible meurt au cours de l'enchaînement "Tourbillon Carnassier" avant que les 5 coups ne soient tous portés : les coups restants ne s'appliquent pas à une cible déjà morte et le coup de finition ne se déclenche pas pour elle.
- Kaito est gelé, étourdi, ou autrement empêché d'agir au tour où son enchaînement périodique "Tourbillon Carnassier" devrait se déclencher : le tour manqué ne consomme pas le déclenchement prévu (la cadence reprend normalement dès que Kaito peut agir de nouveau), conformément au comportement déjà établi pour les autres capacités périodiques du moteur.
- Kaito franchit le seuil de vie critique de sa transformation "Frénésie du Grand Blanc" alors qu'il l'a déjà utilisée précédemment dans le même combat : la transformation ne se réactive pas une seconde fois.
- La transformation "Frénésie du Grand Blanc" est active et Kaito serait la cible d'un effet de statut négatif appliqué par un adversaire (y compris une marque de Trempage si un adversaire élémentaire Eau attaque Kaito) : l'application de cet effet est intégralement bloquée par l'immunité, sans laisser de trace résiduelle une fois la transformation terminée.
- Les points de vie de Kaito repassent au-dessus du seuil de déclenchement de la transformation avant la fin des 3 tours (grâce à la régénération au contact) : la transformation continue jusqu'à son terme normal, elle ne s'interrompt pas prématurément.
- Le passif de critique dynamique ("Sang-froid du chasseur", seuil 40%) et la transformation ("Frénésie du Grand Blanc", seuil 25%) sont simultanément actifs lorsque la vie de Kaito est très basse : les deux effets s'appliquent indépendamment et cumulativement, sans s'annuler ni se substituer l'un à l'autre.
- Le combat se termine (victoire, défaite, ou limite de tours atteinte) alors que des marques de Trempage ou une transformation sont encore actives : ces états n'ont aucun effet en dehors du combat en cours et ne sont pas reportés sur une simulation ultérieure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre de configurer une attaque de base infligeant simultanément des dégâts physiques et des dégâts élémentaires Eau dans des proportions distinctes de l'attaque du lanceur.
- **FR-002**: Le système DOIT permettre à une attaque d'avoir une probabilité indépendante d'appliquer une marque de vulnérabilité élémentaire sur la cible touchée, en plus de ses dégâts directs.
- **FR-003**: Le système DOIT permettre à une cible d'accumuler plusieurs marques de vulnérabilité élémentaire simultanément, jusqu'à un maximum configurable, chaque marque augmentant d'un pourcentage fixe les dégâts que la cible reçoit pour un type élémentaire donné.
- **FR-004**: Le système DOIT appliquer l'augmentation de dégâts élémentaires due aux marques de vulnérabilité à toute attaque de ce type élémentaire touchant la cible marquée, quel que soit l'attaquant à l'origine de l'attaque.
- **FR-005**: Le système DOIT permettre à une capacité spéciale de zone d'infliger des dégâts à tous les ennemis en une seule activation.
- **FR-006**: Le système DOIT permettre de conditionner un bonus de dégâts d'une attaque à la présence d'un statut spécifique (ex: une marque de vulnérabilité) déjà actif sur la cible visée, évalué avant l'application des effets de cette même attaque.
- **FR-007**: Le système DOIT permettre à une capacité spéciale d'appliquer un bonus temporaire de chance d'esquive au lanceur, limité dans le temps, en plus de son effet principal.
- **FR-008**: Le système DOIT permettre à l'application réussie d'un effet sur une cible de déclencher, avec une probabilité indépendante, un second effet (ex: une réduction temporaire de vitesse) sur cette même cible.
- **FR-009**: Le système DOIT permettre de modifier la vitesse d'une carte de façon temporaire, à la hausse comme à la baisse, au même titre que les autres statistiques modifiables.
- **FR-010**: Le système DOIT permettre de modifier le taux de critique d'une carte de façon temporaire, à la hausse comme à la baisse, au même titre que les autres statistiques modifiables.
- **FR-011**: Le système DOIT permettre à un bonus de statistique de rester actif de façon continue et réversible tant qu'une condition liée aux points de vie actuels de son porteur reste vraie, en s'activant et se désactivant automatiquement à chaque franchissement du seuil, dans les deux sens.
- **FR-012**: Le système DOIT permettre de configurer une attaque à coups multiples qui se déclenche à intervalle régulier (tous les N tours) à la place de l'attaque normale du même lanceur.
- **FR-013**: Le système DOIT permettre à une attaque à coups multiples d'infliger un coup de finition supplémentaire sur une cible, uniquement si aucun des coups précédents de la même séquence n'a été esquivé par cette cible.
- **FR-014**: Le système DOIT permettre à une capacité de ne pouvoir s'activer qu'une seule fois par combat, indépendamment du nombre de fois où sa condition de déclenchement redevient vraie par la suite.
- **FR-015**: Le système DOIT permettre à une capacité de déclencher automatiquement une transformation temporaire du lanceur lorsque ses points de vie descendent sous un seuil donné.
- **FR-016**: Le système DOIT permettre à une transformation temporaire d'appliquer simultanément plusieurs bonus de statistiques différentes (par exemple attaque et vitesse) pour une durée fixe en tours.
- **FR-017**: Le système DOIT permettre à une transformation temporaire de rendre son porteur totalement insensible à tout nouvel effet de statut négatif et à toute nouvelle réduction de statistique pendant sa durée.
- **FR-018**: Le système DOIT permettre à un porteur en transformation temporaire de récupérer un pourcentage de ses points de vie maximum à chaque fois qu'une de ses attaques touche effectivement une cible.
- **FR-019**: Le système DOIT permettre à une transformation temporaire d'infliger, à son porteur, un coût en points de vie au moment où elle prend fin.
- **FR-020**: Le système DOIT garantir qu'aucune marque de vulnérabilité, transformation, ou effet réactif introduit pour ce personnage n'a d'effet au-delà du combat dans lequel il a été appliqué.
- **FR-021**: Le système DOIT exposer l'ensemble des capacités de ce personnage via l'API de simulation de combat existante, de la même façon que pour tout autre personnage du jeu.

### Key Entities

- **Marque de Trempage (vulnérabilité élémentaire)**: État cumulable porté par une carte, représentant un niveau d'exposition à un type de dégâts élémentaire. Caractérisé par un nombre de charges actives (borné par un maximum) et un pourcentage d'augmentation de dégâts par charge pour le type élémentaire concerné. N'a d'effet que pour la durée du combat en cours.
- **Transformation temporaire**: État exclusif porté par une carte pendant un nombre de tours fixe, regroupant plusieurs effets simultanés (bonus de statistiques, immunité aux effets négatifs, régénération conditionnelle) et un coût appliqué à son expiration. Ne peut être déclenchée qu'une seule fois par combat pour une carte donnée.
- **Bonus réactif à la vie**: Modification de statistique dont l'activation dépend en continu de la comparaison entre les points de vie actuels d'une carte et un seuil défini, s'activant et se désactivant dynamiquement au fil du combat.

## Assumptions

- **Persistance des marques de Trempage** : le kit source ne précise aucune durée pour les marques de vulnérabilité ; on suppose qu'elles n'ont pas de décroissance automatique tour par tour et restent actives tant que la cible marquée est en vie, pour la durée du combat en cours (cohérent avec la convention déjà en place dans le moteur où une durée nulle/absente signifie un effet permanent jusqu'à la fin du combat ou sa suppression explicite).
- **Granularité de la régénération pendant la transformation** : « récupère un pourcentage de PV max à chaque attaque réussie » est interprété par cible effectivement touchée (et non par action offensive) — une capacité de zone touchant plusieurs ennemis pendant la transformation déclenche donc la régénération une fois par ennemi touché.
- **Coût de fin de transformation non-létal** : la perte de points de vie au terme de la transformation « Frénésie du Grand Blanc » est un coût de maintenance et non une condition d'échec ; elle ne peut pas, à elle seule, faire tomber Kaito à 0 PV — un plancher minimal de vie restante est appliqué à ce coût spécifique.
- **Portée de l'immunité de la transformation** : « immunité totale aux effets de statut négatifs » couvre toute nouvelle application d'effet de statut (poison, brûlure, gel, étourdissement) et toute nouvelle application de débuff de statistique pendant la durée de la transformation ; les effets négatifs déjà actifs *avant* le déclenchement de la transformation ne sont pas rétroactivement supprimés par son activation.
- **Bonus d'esquive du spécial exprimé en points de pourcentage** : le bonus temporaire de chance d'esquive accordé par le spécial s'ajoute à la chance d'esquive existante de Kaito plutôt que de la multiplier, par cohérence avec la façon dont les autres bonus temporaires de statistique s'appliquent déjà dans le moteur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un intégrateur peut décrire l'intégralité du kit de combat de Kaito (attaque de base, spécial, passifs, capacité périodique, transformation) dans une seule configuration de combat, sans recourir à des règles écrites en dehors du système de configuration standard.
- **SC-002**: Sur un échantillon de combats simulés suffisamment grand, la fréquence observée d'application de chaque effet probabiliste du kit de Kaito (pose de marque, ralentissement déclenché, etc.) correspond à la probabilité configurée, à une marge statistique près.
- **SC-003**: Dans 100% des combats simulés où Kaito porte au moins une marque de vulnérabilité active, les dégâts élémentaires Eau qu'il reçoit par la suite sont strictement supérieurs à ce qu'ils auraient été sans marque, dans une proportion conforme à la configuration.
- **SC-004**: Dans 100% des combats simulés où la transformation de Kaito se déclenche, elle ne se déclenche jamais une seconde fois dans le même combat, et le coût de fin de transformation est toujours appliqué exactement une fois à l'expiration.
- **SC-005**: Un relevé complet du déroulement d'un combat impliquant Kaito permet de retracer, pour chaque tour, quelles capacités se sont déclenchées et pourquoi (probabilité, seuil de vie, cadence), sans ambiguïté sur l'origine d'un effet.
