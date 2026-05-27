export function validatePowerIdConsistency(
  skills: { powerId?: string; event: string; terminationEvent?: string }[],
): void {
  const groups = new Map<
    string,
    { event: string; terminationEvent?: string }
  >();

  for (const skill of skills) {
    if (!skill.powerId) continue;

    const existing = groups.get(skill.powerId);
    if (!existing) {
      groups.set(skill.powerId, {
        event: skill.event,
        terminationEvent: skill.terminationEvent,
      });
      continue;
    }

    if (existing.event !== skill.event) {
      throw new Error(
        `Skills with powerId '${skill.powerId}' must share the same event. Found '${existing.event}' and '${skill.event}'.`,
      );
    }

    if (existing.terminationEvent !== skill.terminationEvent) {
      throw new Error(
        `Skills with powerId '${skill.powerId}' must share the same terminationEvent. Found '${existing.terminationEvent}' and '${skill.terminationEvent}'.`,
      );
    }
  }
}
