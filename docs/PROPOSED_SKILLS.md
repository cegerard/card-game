# Proposed Skills

Skill proposals based on codebase analysis. Each entry describes the gameplay intent, the required implementation changes, and the API contract.

---

## 1. LifestealModifier — Drain de vie sur attaque

**Complexité : Faible | Valeur stratégique : Haute**

Convertit un pourcentage des dégâts infligés en soin pour l'attaquant. Aucun changement d'architecture — s'intègre directement dans les `AttackSkill` existants.

### Gameplay

Un attaquant avec 30% de lifesteal qui inflige 100 dégâts récupère 30 HP immédiatement après l'impact.

### Changements requis

| Fichier | Modification |
|---|---|
| `simple-attack.ts` | Champ optionnel `lifesteal?: number` (0–1) |
| `multiple-attack.ts` | Idem — appliqué sur chaque hit |
| `attack-result.ts` | Champ optionnel `lifestealAmount?: number` |
| `fighting-card.ts` | Aucun — `heal()` existe déjà |

### Implémentation

Après `defender.applyFinalDamage(total)`, si `lifesteal` est défini :

```typescript
const healed = card.heal(collectedDamage * this.lifesteal);
result.lifestealAmount = healed;
```

### API (DTO)

```typescript
// SimpleAttackDto / MultipleAttackDto
{
  name: string,
  damages: DamageCompositionDto[],
  targetingStrategy: TargetingStrategy,
  lifesteal?: number   // NEW — valeur entre 0 et 1
}
```

---

## 2. ExecuteSkill — Attaque de finition

**Complexité : Faible | Valeur stratégique : Haute**

Attaque qui inflige un multiplicateur de dégâts bonus si la cible est sous un seuil de HP. Zéro changement d'architecture — s'insère dans le calcul de dégâts existant.

### Gameplay

Une carte avec `threshold: 0.25` et `bonusMultiplier: 2.0` inflige le double de dégâts si la cible a moins de 25% de ses HP. Permet des compositions orientées "finisher".

### Changements requis

| Fichier | Modification |
|---|---|
| `simple-attack.ts` | Champs optionnels `executeThreshold?: number` et `executeMultiplier?: number` |
| `multiple-attack.ts` | Idem |
| `fighting-card.ts` | Aucun — `healthRatio` existe déjà |

### Implémentation

Avant `DamageCalculator.calculateDamage()` :

```typescript
const executeBonus =
  this.executeThreshold && defender.healthRatio < this.executeThreshold
    ? this.executeMultiplier ?? 1
    : 1;

const { total } = DamageCalculator.calculateDamage(
  this.damages,
  attackPower * damageMultiplier * executeBonus,
  defender,
);
```

### API (DTO)

```typescript
// SimpleAttackDto / MultipleAttackDto
{
  name: string,
  damages: DamageCompositionDto[],
  targetingStrategy: TargetingStrategy,
  executeThreshold?: number,    // NEW — ex: 0.25 (25% HP)
  executeMultiplier?: number    // NEW — ex: 2.0 (double dégâts)
}
```

---

## 3. DispelSkill — Purge de buffs

**Complexité : Faible | Valeur stratégique : Haute**

Supprime tous les buffs actifs de une ou plusieurs cartes cibles. Contreplay direct aux compositions orientées stack de buffs.

### Gameplay

Déclenché sur `ally-death` ou `turn-end`, un support purge tous les buffs de l'ennemi le plus fort avant que celui-ci ne frappe. Idéal pour briser les ultimates précédés de phases de buffing.

### Changements requis

| Fichier | Modification |
|---|---|
| `skill.ts` | Nouveau `SkillKind.Dispel` |
| `dispel-skill.ts` | Nouveau fichier |
| `fighting-card.ts` | Nouvelle méthode `removeAllBuffs(): BuffType[]` |
| `step.ts` | Nouveau `StepKind.Dispel` |
| `dispel-report.ts` | Nouveau fichier — type du step |
| `fight-data.dto.ts` | `kind: "DISPEL"` dans `OtherSkillDto` |

### Implémentation

```typescript
// fighting-card.ts
public removeAllBuffs(): { type: BuffType; value: number }[] {
  const removed = this.buffs.map((b) => ({ type: b.type, value: b.value }));
  this.buffs = [];
  return removed;
}

// dispel-skill.ts
launch(source: FightingCard, context: FightingContext): SkillResults {
  const targets = this.targetingStrategy.targetedCards(
    source, context.sourcePlayer, context.opponentPlayer,
  );
  const results = targets.map((target) => ({
    target: target.identityInfo,
    removed: target.removeAllBuffs(),
  }));
  return { skillKind: SkillKind.Dispel, results };
}
```

### API (DTO)

```typescript
// OtherSkillDto
{
  kind: "DISPEL",   // NEW
  name: string,
  targetingStrategy: TargetingStrategy,
  event: TriggerEvent
}
```

---

## 4. EnergyDrainSkill — Vol d'énergie spéciale

**Complexité : Faible | Valeur stratégique : Moyenne**

Réduit l'énergie spéciale d'une ou plusieurs cartes ennemies, retardant leur ultimate. Counterplay indirect aux compositions à ultimate rapide.

### Gameplay

Un support draine 30% de l'énergie de tous les ennemis à chaque fin de tour. Une carte avec 8/10 d'énergie se retrouve à ~5/10, retardant son special de plusieurs tours.

### Changements requis

| Fichier | Modification |
|---|---|
| `skill.ts` | Nouveau `SkillKind.EnergyDrain` |
| `energy-drain-skill.ts` | Nouveau fichier |
| `fighting-card.ts` | Nouvelle méthode `drainEnergy(rate: number): number` |
| `step.ts` | Nouveau `StepKind.EnergyDrain` |
| `energy-drain-report.ts` | Nouveau fichier |
| `fight-data.dto.ts` | `kind: "ENERGY_DRAIN"` dans `OtherSkillDto` |

### Implémentation

```typescript
// fighting-card.ts
public drainEnergy(rate: number): number {
  const drained = Math.floor(this.specialEnergy * rate);
  this.specialEnergy = Math.max(0, this.specialEnergy - drained);
  return drained;
}

// energy-drain-skill.ts
launch(source: FightingCard, context: FightingContext): SkillResults {
  const targets = this.targetingStrategy.targetedCards(
    source, context.sourcePlayer, context.opponentPlayer,
  );
  const results = targets.map((target) => ({
    target: target.identityInfo,
    drained: target.drainEnergy(this.rate),
    remainingEnergy: target.actualEnergy,
  }));
  return { skillKind: SkillKind.EnergyDrain, results };
}
```

### API (DTO)

```typescript
// OtherSkillDto
{
  kind: "ENERGY_DRAIN",   // NEW
  name: string,
  rate: number,           // Fraction de l'énergie drainée (ex: 0.3)
  targetingStrategy: TargetingStrategy,
  event: TriggerEvent
}
```

---

## 5. ShieldSkill — Bouclier d'absorption

**Complexité : Moyenne | Valeur stratégique : Haute**

Applique un bouclier temporaire qui absorbe une quantité fixe de dégâts avant que la défense et la santé n'interviennent. Brise quand épuisé ou quand sa durée expire.

### Gameplay

Un tank reçoit un bouclier de 150 HP pendant 2 tours. Les 3 prochaines attaques de 60 dégâts chacune consomment le bouclier au lieu de réduire les HP. À 150 HP absorbés, le bouclier se brise.

### Changements requis

| Fichier | Modification |
|---|---|
| `skill.ts` | Nouveau `SkillKind.Shield` |
| `shield-skill.ts` | Nouveau fichier |
| `fighting-card.ts` | Nouveau champ `private shield?: Shield` + modification `collectsDamages()` |
| `shield.ts` (@types) | Nouveau type `Shield { amount: number; duration: number }` |
| `step.ts` | Nouveaux `StepKind.Shield` et `StepKind.ShieldBroken` |
| `shield-report.ts` | Nouveau fichier |
| `fight-data.dto.ts` | `kind: "SHIELD"` dans `OtherSkillDto` |

### Implémentation

```typescript
// fighting-card.ts — modification de collectsDamages
public collectsDamages(damage: number): number {
  let remaining = Math.max(0, damage - this.defense);

  if (this.shield) {
    const absorbed = Math.min(this.shield.amount, remaining);
    this.shield.amount -= absorbed;
    remaining -= absorbed;
    if (this.shield.amount <= 0) this.shield = undefined; // shield broken
  }

  if (this.frozen) {
    remaining = (this.frozen as CardStateFrozen).applyDamageRate(remaining);
  }
  this.receivedDamages += remaining;
  return remaining;
}
```

Le step `ShieldBroken` est émis par `ActionStage` en détectant que le bouclier est passé à zéro.

### API (DTO)

```typescript
// OtherSkillDto
{
  kind: "SHIELD",         // NEW
  name: string,
  rate: number,           // Fraction des HP max protégés (ex: 0.2 → 20% HP max)
  duration: number,       // Durée en tours
  targetingStrategy: TargetingStrategy,
  event: TriggerEvent
}
```

---

## 6. CounterAttackSkill — Contre-attaque réactive

**Complexité : Haute | Valeur stratégique : Haute**

Lorsqu'une carte subit des dégâts, elle riposte immédiatement avec une attaque réduite. Le skill le plus invasif architecturalement — nécessite un nouveau hook dans `ActionStage`.

### Gameplay

Un guerrier avec 40% de contre-attaque riposte automatiquement à chaque coup reçu. La contre-attaque ne déclenche pas de counter en retour (pas de récursion). La carte doit être vivante après l'impact pour riposter.

### Changements requis

| Fichier | Modification |
|---|---|
| `skill.ts` | Nouveau `SkillKind.Counter` |
| `counter-attack-skill.ts` | Nouveau fichier |
| `fighting-card.ts` | Nouvelle méthode `launchCounterSkills(context): SkillResults[]` |
| `action_stage.ts` | Après chaque `collectsDamages()`, appel `defender.launchCounterSkills()` si vivant |
| `step.ts` | Le counter utilise `StepKind.Attack` existant avec un flag `isCounter: true` |
| `attack-result.ts` | Champ optionnel `isCounter?: boolean` |
| `fight-data.dto.ts` | `kind: "COUNTER_ATTACK"` dans `OtherSkillDto` |

### Point critique d'architecture

`ActionStage` doit distinguer les attaques normales des counters pour éviter la récursion (un counter ne déclenche pas d'autre counter). Le plus simple : passer un flag `isCounterContext: boolean` dans `FightingContext`.

```typescript
// fighting-card.ts
public launchCounterSkills(context: FightingContext): SkillResults[] {
  if (context.isCounterContext) return []; // pas de counter sur un counter
  return this.skills
    .filter((s) => s.isTriggered('on-damage'))
    .map((skill) => skill.launch(this, { ...context, isCounterContext: true }));
}
```

### API (DTO)

```typescript
// OtherSkillDto
{
  kind: "COUNTER_ATTACK",   // NEW
  name: string,
  rate: number,             // Multiplicateur de dégâts du counter (ex: 0.4)
  damages: DamageCompositionDto[],
  targetingStrategy: TargetingStrategy,
  event: "on-damage"        // NEW TriggerEvent
}
```

---

## Tableau de synthèse

| # | Skill | Complexité | Fichiers nouveaux | Fichiers modifiés | Valeur |
|---|---|---|---|---|---|
| 1 | LifestealModifier | Faible | 0 | 3 | Haute |
| 2 | ExecuteSkill | Faible | 0 | 2 | Haute |
| 3 | DispelSkill | Faible | 3 | 3 | Haute |
| 4 | EnergyDrainSkill | Faible | 3 | 3 | Moyenne |
| 5 | ShieldSkill | Moyenne | 4 | 4 | Haute |
| 6 | CounterAttackSkill | Haute | 2 | 5 | Haute |
