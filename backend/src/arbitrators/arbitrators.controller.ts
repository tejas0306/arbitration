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
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ArbitratorsService } from './arbitrators.service';
import { UpdateArbitratorProfileDto } from './dto/update-arbitrator-profile.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CaseAssignmentResponseDto } from './dto/case-assignment-response.dto';
import { ScheduleHearingDto } from './dto/schedule-hearing.dto';
import { CreateAwardDto } from './dto/create-award.dto';

@Controller('arbitrators')
@UseGuards(JwtAuthGuard)
export class ArbitratorsController {
  constructor(private arbitratorsService: ArbitratorsService) {}

  // Get list of all arbitrators (with optional filters)
  @Get()
  async getAllArbitrators(@Query() filters: any) {
    return this.arbitratorsService.getAllArbitrators(filters);
  }

  // Get specific arbitrator details
  @Get(':id')
  async getArbitratorDetails(@Param('id') id: string) {
    return this.arbitratorsService.getArbitratorDetails(id);
  }

  // Update arbitrator profile (only for arbitrators themselves)
  @Patch('profile')
  async updateProfile(
    @Body() updateData: UpdateArbitratorProfileDto,
    @Request() req,
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can update their profile');
    }
    return this.arbitratorsService.updateArbitratorProfile(req.user.id, updateData);
  }

  // Get arbitrator's availability
  @Get('availability/:arbitratorId')
  async getAvailability(@Param('arbitratorId') arbitratorId: string) {
    return this.arbitratorsService.getAvailability(arbitratorId);
  }

  // Set/Update arbitrator availability
  @Post('availability')
  async setAvailability(
    @Body() availabilityData: CreateAvailabilityDto[],
    @Request() req,
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can set availability');
    }
    return this.arbitratorsService.setAvailability(req.user.id, availabilityData);
  }

  // Get case assignments for an arbitrator
  @Get('assignments/my-cases')
  async getMyCaseAssignments(@Request() req) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can view case assignments');
    }
    return this.arbitratorsService.getCaseAssignments(req.user.id);
  }

  // Respond to case assignment (accept/reject)
  @Post('assignments/:assignmentId/respond')
  async respondToAssignment(
    @Param('assignmentId') assignmentId: string,
    @Body() response: CaseAssignmentResponseDto,
    @Request() req,
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can respond to assignments');
    }
    return this.arbitratorsService.respondToAssignment(
      assignmentId,
      req.user.id,
      response,
    );
  }

  // Get hearings for an arbitrator
  @Get('hearings/my-hearings')
  async getMyHearings(@Request() req) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can view hearings');
    }
    return this.arbitratorsService.getArbitratorHearings(req.user.id);
  }

  // Schedule a hearing
  @Post('hearings')
  async scheduleHearing(
    @Body() hearingData: ScheduleHearingDto,
    @Request() req,
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can schedule hearings');
    }
    return this.arbitratorsService.scheduleHearing(req.user.id, hearingData);
  }

  // Update hearing
  @Patch('hearings/:hearingId')
  async updateHearing(
    @Param('hearingId') hearingId: string,
    @Body() updateData: Partial<ScheduleHearingDto>,
    @Request() req,
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can update hearings');
    }
    return this.arbitratorsService.updateHearing(hearingId, req.user.id, updateData);
  }

  // Create/upload award
  @Post('awards')
  async createAward(
    @Body() awardData: CreateAwardDto,
    @Request() req,
  ) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can create awards');
    }
    return this.arbitratorsService.createAward(req.user.id, awardData);
  }

  // Get arbitrator's dashboard stats
  @Get('dashboard/stats')
  async getDashboardStats(@Request() req) {
    if (req.user.role !== 'ARBITRATOR') {
      throw new BadRequestException('Only arbitrators can view dashboard');
    }
    return this.arbitratorsService.getArbitratorDashboardStats(req.user.id);
  }

  // Get arbitrator feedback/ratings
  @Get('feedback/:arbitratorId')
  async getArbitratorFeedback(@Param('arbitratorId') arbitratorId: string) {
    return this.arbitratorsService.getArbitratorFeedback(arbitratorId);
  }
} 