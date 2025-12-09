import { Module } from '@nestjs/common';
import { GainsService } from './gains.service';
import { GainsController } from './gains.controller';

@Module({
  controllers: [GainsController],
  providers: [GainsService],
  exports: [GainsService],
})
export class GainsModule {}
