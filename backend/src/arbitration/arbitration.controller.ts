import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArbitrationService } from './arbitration.service';
import { CreateArbitrationDto } from './dto/create-arbitration.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { CaseResponseDto } from './dto/case-response.dto';
import { AssignArbitratorDto } from './dto/assign-arbitrator.dto';

@Controller('arbitration')
@UseGuards(JwtAuthGuard)
export class ArbitrationController {
  constructor(private arbitrationService: ArbitrationService) {}

  @Post('submit')
  async submitRequest(
    @Body() createArbitrationDto: CreateArbitrationDto,
    @Request() req,
  ) {
    return this.arbitrationService.createCase(createArbitrationDto, req.user.id, false);
  }

  @Post('draft')
  async saveDraft(
    @Body() createArbitrationDto: CreateArbitrationDto,
    @Request() req,
  ) {
    return this.arbitrationService.createCase(createArbitrationDto, req.user.id, true);
  }

  @Get('cases')
  async getCases(@Query() filters: any, @Request() req) {
    return this.arbitrationService.getCasesByUser(req.user.id, filters);
  }

  @Get('cases/:id')
  async getCaseDetails(@Param('id') id: string) {
    return this.arbitrationService.getCaseById(id);
  }

  @Patch('cases/:id/status')
  async updateCaseStatus(
    @Param('id') id: string,
    @Body() updateCaseStatusDto: UpdateCaseStatusDto,
  ) {
    return this.arbitrationService.updateCaseStatus(id, updateCaseStatusDto.status);
  }

  @Post('cases/:id/respond')
  async submitResponse(
    @Param('id') id: string,
    @Body() caseResponseDto: CaseResponseDto,
    @Request() req,
  ) {
    return this.arbitrationService.submitResponse(id, caseResponseDto, req.user.id);
  }

  @Post('cases/:id/assign-arbitrator')
  async assignArbitrator(
    @Param('id') id: string,
    @Body() assignArbitratorDto: AssignArbitratorDto,
  ) {
    return this.arbitrationService.assignArbitrator(id, assignArbitratorDto.arbitratorId);
  }

  @Post('draft/:id/submit')
  async submitDraft(@Param('id') id: string, @Request() req) {
    return this.arbitrationService.submitDraft(id, req.user.id);
  }

  @Get('draft')
  async getDrafts(@Request() req) {
    return this.arbitrationService.getDraftsByUser(req.user.id);
  }

  @Get('draft/:id')
  async getDraftById(@Param('id') id: string, @Request() req) {
    return this.arbitrationService.getDraftById(id, req.user.id);
  }
}