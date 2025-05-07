import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HearingsController } from './hearings.controller';
import { HearingsService } from './hearings.service';
import { Hearing } from './entities/hearing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hearing])],
  controllers: [HearingsController],
  providers: [HearingsService],
  exports: [HearingsService],
})
export class HearingsModule {}