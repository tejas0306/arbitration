import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hearing } from './entities/hearing.entity';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';

@Injectable()
export class HearingsService {
  constructor(
    @InjectRepository(Hearing)
    private hearingsRepository: Repository<Hearing>,
  ) {}

  async scheduleHearing(caseId: string, createHearingDto: CreateHearingDto): Promise<Hearing> {
    const hearing = this.hearingsRepository.create({
      caseId,
      ...createHearingDto,
      status: 'scheduled',
    });
    
    return this.hearingsRepository.save(hearing);
  }

  async getHearingsByCaseId(caseId: string): Promise<Hearing[]> {
    return this.hearingsRepository.find({ where: { caseId } });
  }

  async getHearingById(id: string): Promise<Hearing> {
    const hearing = await this.hearingsRepository.findOne({ where: { id } });
    if (!hearing) {
      throw new NotFoundException(`Hearing with ID ${id} not found`);
    }
    return hearing;
  }

  async updateHearing(id: string, updateHearingDto: UpdateHearingDto): Promise<Hearing> {
    const hearing = await this.getHearingById(id);
    
    // Only allow updates if the hearing is not cancelled
    if (hearing.status === 'cancelled') {
      throw new NotFoundException('Cannot update a cancelled hearing');
    }
    
    this.hearingsRepository.merge(hearing, updateHearingDto);
    return this.hearingsRepository.save(hearing);
  }

  async cancelHearing(id: string, reason: string): Promise<Hearing> {
    const hearing = await this.getHearingById(id);
    
    hearing.status = 'cancelled';
    hearing.cancellationReason = reason;
    hearing.cancelledAt = new Date();
    
    return this.hearingsRepository.save(hearing);
  }
}