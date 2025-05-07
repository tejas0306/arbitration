import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HearingsService } from './hearings.service';
import { CreateHearingDto } from './dto/create-hearing.dto';
import { UpdateHearingDto } from './dto/update-hearing.dto';
import { CancelHearingDto } from './dto/cancel-hearing.dto';

@Controller('hearings')
@UseGuards(JwtAuthGuard)
export class HearingsController {
  constructor(private hearingsService: HearingsService) {}

  @Post(':caseId/schedule')
  async scheduleHearing(
    @Param('caseId') caseId: string,
    @Body() createHearingDto: CreateHearingDto,
  ) {
    return this.hearingsService.scheduleHearing(caseId, createHearingDto);
  }

  @Get(':caseId')
  async getHearings(@Param('caseId') caseId: string) {
    return this.hearingsService.getHearingsByCaseId(caseId);
  }

  @Patch(':id')
  async updateHearing(
    @Param('id') id: string,
    @Body() updateHearingDto: UpdateHearingDto,
  ) {
    return this.hearingsService.updateHearing(id, updateHearingDto);
  }

  @Post(':id/cancel')
  async cancelHearing(
    @Param('id') id: string,
    @Body() cancelHearingDto: CancelHearingDto,
  ) {
    return this.hearingsService.cancelHearing(id, cancelHearingDto.reason);
  }
}