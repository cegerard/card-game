import { Module } from '@nestjs/common';
import { FightController } from './http-api/fight.controller';
import { FightService } from './http-api/fight.service';

@Module({
  imports: [],
  controllers: [FightController],
  providers: [FightService],
})
export class FightModule {}
