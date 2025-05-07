import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArbitrationController } from './arbitration.controller';
import { ArbitrationService } from './arbitration.service';
import { ArbitrationCase } from './entities/arbitration-case.entity';
import { CaseResponse } from './entities/case-response.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ArbitrationCase, CaseResponse]),
  ],
  controllers: [ArbitrationController],
  providers: [ArbitrationService],
  exports: [ArbitrationService],
})
export class ArbitrationModule {}