import { BattlefieldDto } from './dto/fight-data.dto';
import {
  Battlefield,
  BattlefieldAlteration,
} from '../core/cards/@types/battlefield/battlefield';
import {
  asBadRequest,
  mapAlterationType,
  mapElement,
} from './skill-wiring-factory';

export function buildBattlefield(
  dto?: BattlefieldDto,
): Battlefield | undefined {
  if (!dto) return undefined;

  return asBadRequest(
    () =>
      new Battlefield({
        name: dto.name,
        duration: dto.duration,
        element: dto.element && mapElement(dto.element),
        allies: dto.allies && {
          alterations: buildAlterations(dto.allies.alterations),
          healRate: dto.allies.healRate,
          damageSharing: dto.allies.damageSharing && {
            rate: dto.allies.damageSharing.rate,
            maxShareRate: dto.allies.damageSharing.maxShareRate,
          },
          decoys: dto.allies.decoys && {
            count: dto.allies.decoys.count,
            chance: dto.allies.decoys.chance,
          },
        },
        enemies: dto.enemies && {
          alterations: buildAlterations(dto.enemies.alterations),
          damage: dto.enemies.damage && {
            rate: dto.enemies.damage.rate,
            damageType: dto.enemies.damage.damageType,
          },
          energySurcharge: dto.enemies.energySurcharge,
        },
        revival: dto.revival && {
          rate: dto.revival.rate,
          withinTurns: dto.revival.withinTurns,
        },
        legacy: dto.legacy && {
          duration: dto.legacy.duration,
          empowerment: dto.legacy.empowerment && {
            name: dto.legacy.empowerment.name,
            rate: dto.legacy.empowerment.rate,
          },
        },
      }),
  );
}

function buildAlterations(
  alterations: BattlefieldDto['allies']['alterations'] = [],
): BattlefieldAlteration[] {
  return alterations.map((a) => ({
    type: mapAlterationType(a.type),
    rate: a.rate,
    polarity: a.polarity,
    perLivingAlly: a.perLivingAlly && { maxRate: a.perLivingAlly.maxRate },
  }));
}
