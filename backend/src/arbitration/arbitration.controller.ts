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
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArbitrationService } from './arbitration.service';
import { CreateArbitrationDto } from './dto/create-arbitration.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { CaseResponseDto } from './dto/case-response.dto';
import { AssignArbitratorDto } from './dto/assign-arbitrator.dto';
import { ProposeArbitratorDto } from './dto/propose-arbitrator.dto';
import { RespondArbitratorProposalDto } from './dto/respond-arbitrator-proposal.dto';
import { ArbitratorResponseDto } from './dto/arbitrator-response.dto';

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
    console.log('🔍🔍🔍 ArbitrationController.getCases DEFINITELY CALLED 🔍🔍🔍');
    console.log('🔍 ArbitrationController.getCases called with:', {
      user: req.user,
      userId: req.user?.id,
      filters
    });
    
    const result = await this.arbitrationService.getCasesByUser(req.user.id, filters);
    console.log('🔍 ArbitrationController.getCases returning:', result.length, 'cases');
    return result;
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

  @Get('debug/auth')
  async debugAuth(@Request() req) {
    console.log('🧪 DEBUG AUTH ENDPOINT HIT');
    console.log('🧪 User object:', req.user);
    console.log('🧪 User ID:', req.user?.id);
    console.log('🧪 User type:', typeof req.user?.id);
    
    // Get all cases (no filtering) for debugging
    const allCases = await this.arbitrationService.getAllCasesForDebug();
    
    return {
      authenticatedUser: req.user,
      totalCasesInDB: allCases.length,
      casesPreview: allCases.slice(0, 3).map(c => ({
        id: c.id,
        claimantId: c.claimantId,
        respondentId: c.respondentId,
        status: c.status
      }))
    };
  }

  // Arbitrator assignment workflow endpoints
  
  // Get all arbitrator proposals for a case
  @Get('cases/:id/arbitrator-proposals')
  async getArbitratorProposals(@Param('id') id: string, @Request() req) {
    return this.arbitrationService.getArbitratorProposals(id);
  }
  
  // Propose an arbitrator for a case
  @Post('cases/:id/propose-arbitrator')
  async proposeArbitrator(
    @Param('id') id: string,
    @Body() proposeArbitratorDto: ProposeArbitratorDto,
    @Request() req
  ) {
    return this.arbitrationService.proposeArbitrator(id, proposeArbitratorDto, req.user.id);
  }
  
  // Respond to an arbitrator proposal
  @Post('arbitrator-proposals/:proposalId/respond')
  async respondToArbitratorProposal(
    @Param('proposalId') proposalId: string,
    @Body() responseDto: RespondArbitratorProposalDto,
    @Request() req
  ) {
    return this.arbitrationService.respondToArbitratorProposal(
      proposalId,
      responseDto,
      req.user.id
    );
  }
  
  // Arbitrator responds to a case assignment
  @Post('arbitrator-proposals/:proposalId/arbitrator-response')
  async arbitratorRespondsToAssignment(
    @Param('proposalId') proposalId: string,
    @Body() responseDto: ArbitratorResponseDto,
    @Request() req
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can respond to assignments');
    }
    
    return this.arbitrationService.arbitratorRespondsToAssignment(
      proposalId,
      responseDto,
      req.user.id
    );
  }
  
  // Get pending arbitrator assignments for an arbitrator
  @Get('arbitrator/assignments')
  async getArbitratorAssignments(@Request() req) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can view assignments');
    }
    
    return this.arbitrationService.getArbitratorAssignments(req.user.id);
  }
}