import { Module } from '@nestjs/common';
import { FightController } from './fight.controller';
import { FightService } from './fight.service';

@Module({
  imports: [],
  controllers: [FightController],
  providers: [FightService],
})
export class FightModule {}
