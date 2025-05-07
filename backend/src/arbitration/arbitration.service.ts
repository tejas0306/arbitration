import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArbitrationCase } from './entities/arbitration-case.entity';
import { CaseResponse } from './entities/case-response.entity';
import { CreateArbitrationDto } from './dto/create-arbitration.dto';
import { CaseResponseDto } from './dto/case-response.dto';

@Injectable()
export class ArbitrationService {
  constructor(
    @InjectRepository(ArbitrationCase)
    private arbitrationCaseRepository: Repository<ArbitrationCase>,
    @InjectRepository(CaseResponse)
    private caseResponseRepository: Repository<CaseResponse>,
  ) {}

  async createCase(
    createArbitrationDto: CreateArbitrationDto,
    userId: string,
    isDraft: boolean,
  ) {
    const newCase = this.arbitrationCaseRepository.create({
      ...createArbitrationDto,
      claimantId: userId,
      status: isDraft ? 'DRAFT' : 'SUBMITTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.arbitrationCaseRepository.save(newCase);
  }

  async getCasesByUser(userId: string, filters: any) {
    const query = this.arbitrationCaseRepository.createQueryBuilder('case')
      .where('case.claimantId = :userId OR case.respondentId = :userId', { userId });

    if (filters.status) {
      query.andWhere('case.status = :status', { status: filters.status });
    }

    if (filters.category) {
      query.andWhere('case.category = :category', { category: filters.category });
    }

    return query.getMany();
  }

  async getCaseById(id: string) {
    const arbitrationCase = await this.arbitrationCaseRepository.findOne({
      where: { id },
      relations: ['responses', 'documents', 'hearings'],
    });

    if (!arbitrationCase) {
      throw new NotFoundException(`Arbitration case with ID ${id} not found`);
    }

    return arbitrationCase;
  }

  async updateCaseStatus(id: string, status: string) {
    const arbitrationCase = await this.getCaseById(id);
    arbitrationCase.status = status;
    arbitrationCase.updatedAt = new Date();

    return this.arbitrationCaseRepository.save(arbitrationCase);
  }

  async submitResponse(id: string, caseResponseDto: CaseResponseDto, userId: string) {
    const arbitrationCase = await this.getCaseById(id);

    // Ensure the user is the respondent
    if (arbitrationCase.respondentId !== userId) {
      throw new Error('Only the respondent can submit a response');
    }

    const response = this.caseResponseRepository.create({
      ...caseResponseDto,
      caseId: id,
      respondentId: userId,
      createdAt: new Date(),
    });

    const savedResponse = await this.caseResponseRepository.save(response);

    // Update case status
    arbitrationCase.status = 'RESPONSE_SUBMITTED';
    arbitrationCase.updatedAt = new Date();
    await this.arbitrationCaseRepository.save(arbitrationCase);

    return savedResponse;
  }

  async assignArbitrator(id: string, arbitratorId: string) {
    const arbitrationCase = await this.getCaseById(id);
    arbitrationCase.arbitratorId = arbitratorId;
    arbitrationCase.status = 'ARBITRATOR_ASSIGNED';
    arbitrationCase.updatedAt = new Date();

    return this.arbitrationCaseRepository.save(arbitrationCase);
  }

  async submitDraft(id: string, userId: string) {
    // Find the draft
    const draft = await this.arbitrationCaseRepository.findOne({
      where: { id, claimantId: userId, status: 'DRAFT' },
    });

    if (!draft) {
      throw new NotFoundException(`Draft with ID ${id} not found or not accessible`);
    }

    // Update the draft status to submitted
    draft.status = 'SUBMITTED';
    draft.updatedAt = new Date();
    
    // Generate a case number if not already present
    if (!draft.caseNumber) {
      draft.caseNumber = `ARB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    return this.arbitrationCaseRepository.save(draft);
  }

  async getDraftsByUser(userId: string) {
    return this.arbitrationCaseRepository.find({
      where: { claimantId: userId, status: 'DRAFT' },
      order: { updatedAt: 'DESC' },
    });
  }

  async getDraftById(id: string, userId: string) {
    const draft = await this.arbitrationCaseRepository.findOne({
      where: { id, claimantId: userId, status: 'DRAFT' },
    });

    if (!draft) {
      throw new NotFoundException(`Draft with ID ${id} not found or not accessible`);
    }

    return draft;
  }
}