import { Module } from '@nestjs/common';
import { FightModule } from './fight/fight.module';

@Module({
  imports: [FightModule],
})
export class AppModule {}
