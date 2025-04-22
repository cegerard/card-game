import { Module } from '@nestjs/common';
import { FightModule } from './fight/fight.module';

@Module({
  imports: [FightModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
