# Quickstart: Survive Skill

## What is it?

The Survive skill lets a fighting card survive one fatal blow per battle. Instead of dying, the card drops to exactly 1 HP. Post-survival buffs are configured as standard `ALTERATION` skills triggered by the `'survived'` event.

---

## Minimal example (no buffs)

```json
{
  "kind": "SURVIVE",
  "name": "Last Stand",
  "targetingStrategy": "self"
}
```

That's it. The card will survive the first hit that would kill it and drop to 1 HP.

---

## Example with post-survival buffs (matching the issue spec)

Add the survive skill and the buff skills to the same card's `skills.others`:

```json
{
  "skills": {
    "others": [
      {
        "kind": "SURVIVE",
        "name": "Earth's Embrace",
        "targetingStrategy": "self"
      },
      {
        "kind": "ALTERATION",
        "name": "Earth's Embrace",
        "event": "survived",
        "buffType": "defense",
        "rate": 1.0,
        "duration": 1,
        "targetingStrategy": "self",
        "polarity": "buff"
      },
      {
        "kind": "ALTERATION",
        "name": "Earth's Embrace",
        "event": "survived",
        "buffType": "attack",
        "rate": 1.5,
        "duration": 1,
        "targetingStrategy": "self",
        "polarity": "buff"
      }
    ]
  }
}
```

- `rate: 1.0` on defense means +100% of the card's base defense stat.
- `rate: 1.5` on attack means +150% of the card's base attack stat.
- `duration: 1` means the buffs last through the end of the surviving card's next turn.
- The `ALTERATION` skills fire automatically when the `'survived'` event is emitted — no special wiring needed.

---

## What appears in the battle log?

```json
{ "kind": "attack", "attacker": {...}, "damages": [...], "energy": 0 }
{ "kind": "survived", "name": "Earth's Embrace", "card": {"id": "kaelion", ...} }
{ "kind": "buff", "name": "Earth's Embrace", "source": {"id": "kaelion", ...},
  "alterations": [{ "target": {"id": "kaelion"}, "kind": "defense", "value": 120, "remainingTurns": 1 }] }
{ "kind": "buff", "name": "Earth's Embrace", "source": {"id": "kaelion", ...},
  "alterations": [{ "target": {"id": "kaelion"}, "kind": "attack", "value": 180, "remainingTurns": 1 }] }
```

No `{ "kind": "status_change", "status": "dead" }` is emitted for the intercepted hit.

---

## Key rules

1. **Single-use**: the skill fires at most once per card per battle. A second fatal blow kills the card normally.
2. **Multi-hit attacks**: the first hit in a multi-hit sequence that would be fatal triggers survival. Remaining hits proceed normally.
3. **No `event` field**: unlike other `others` skills, `SURVIVE` has no `event` — it activates implicitly on any fatal blow.
4. **Buffs are optional and separate**: add `ALTERATION` skills with `event: 'survived'` alongside the `SURVIVE` skill to trigger on survival. They fire exactly once because the `'survived'` event fires at most once per card.
