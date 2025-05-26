import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HearingsService } from './hearings.service';

@Controller('hearings')
@UseGuards(JwtAuthGuard)
export class HearingsController {
  constructor(private hearingsService: HearingsService) {}

  @Get(':caseId')
  async getHearings(@Param('caseId') caseId: string) {
    return this.hearingsService.getHearingsByCase(caseId);
  }

  @Post(':caseId/schedule')
  async scheduleHearing(
    @Param('caseId') caseId: string,
    @Body() hearingData: any,
    @Request() req
  ) {
    return this.hearingsService.scheduleHearing(caseId, hearingData, req.user.id);
  }

  @Patch(':id')
  async updateHearing(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req
  ) {
    return this.hearingsService.updateHearing(id, updateData, req.user.id);
  }

  @Delete(':id')
  async cancelHearing(@Param('id') id: string, @Request() req) {
    return this.hearingsService.cancelHearing(id, req.user.id);
  }

  @Post(':id/join')
  async joinHearing(@Param('id') id: string, @Request() req) {
    return this.hearingsService.joinHearing(id, req.user.id);
  }

  @Post(':id/start')
  async startHearing(@Param('id') id: string, @Request() req) {
    return this.hearingsService.startHearing(id, req.user.id);
  }

  @Post(':id/end')
  async endHearing(
    @Param('id') id: string,
    @Body() endData: any,
    @Request() req
  ) {
    return this.hearingsService.endHearing(id, endData, req.user.id);
  }

  @Get(':id/minutes')
  async getHearingMinutes(@Param('id') id: string) {
    return this.hearingsService.getHearingMinutes(id);
  }

  @Post(':id/minutes')
  async saveHearingMinutes(
    @Param('id') id: string,
    @Body() minutesData: any,
    @Request() req
  ) {
    return this.hearingsService.saveHearingMinutes(id, minutesData, req.user.id);
  }

  @Get()
  async getUserHearings(@Query() filters: any, @Request() req) {
    return this.hearingsService.getHearingsByUser(req.user.id, filters);
  }

  @Get(':id/recording')
  async getHearingRecording(@Param('id') id: string) {
    return this.hearingsService.getHearingRecording(id);
  }

  @Post(':id/recording/start')
  async startRecording(@Param('id') id: string, @Request() req) {
    return this.hearingsService.startRecording(id, req.user.id);
  }

  @Post(':id/recording/stop')
  async stopRecording(@Param('id') id: string, @Request() req) {
    return this.hearingsService.stopRecording(id, req.user.id);
  }
}