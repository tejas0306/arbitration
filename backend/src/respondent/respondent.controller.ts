import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Headers,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { RespondentService } from './respondent.service';
import { CreateRespondentRegistrationDto } from './dto/create-respondent-registration.dto';
import { CreateCaseResponseDto } from './dto/create-case-response.dto';
import { UpdateCaseResponseDto } from './dto/update-case-response.dto';

@Controller('respondent')
export class RespondentController {
  constructor(private readonly respondentService: RespondentService) {}

  // Public endpoint for respondent registration
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registerRespondent(@Body() createRespondentRegistrationDto: CreateRespondentRegistrationDto) {
    return this.respondentService.registerRespondent(createRespondentRegistrationDto);
  }

  // Get respondent dashboard data
  @Get('dashboard')
  async getRespondentDashboard(@Headers() headers) {
    const userId = headers['user-id'];
    const userRole = headers['user-role'];
    
    if (!userId || userRole !== 'RESPONDENT') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.getRespondentDashboard(userId);
  }

  // Get all cases for the respondent
  @Get('cases')
  async getRespondentCases(@Headers() headers) {
    const userId = headers['user-id'];
    const userRole = headers['user-role'];
    
    if (!userId || userRole !== 'RESPONDENT') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.getRespondentCases(userId);
  }

  // Get a specific case for the respondent
  @Get('cases/:id')
  async getRespondentCase(@Headers() headers, @Param('id') caseId: string) {
    const userId = headers['user-id'];
    const userRole = headers['user-role'];
    
    if (!userId || userRole !== 'RESPONDENT') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.getRespondentCase(userId, caseId);
  }

  // Submit a response to a case
  @Post('cases/:id/respond')
  @HttpCode(HttpStatus.CREATED)
  async submitCaseResponse(
    @Headers() headers,
    @Param('id') caseId: string,
    @Body() createCaseResponseDto: CreateCaseResponseDto,
  ) {
    const userId = headers['user-id'];
    const userRole = headers['user-role'];
    
    if (!userId || userRole !== 'RESPONDENT') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.submitCaseResponse(userId, caseId, createCaseResponseDto);
  }

  // Update a case response (if not yet submitted)
  @Put('responses/:id')
  async updateCaseResponse(
    @Headers() headers,
    @Param('id') responseId: string,
    @Body() updateCaseResponseDto: UpdateCaseResponseDto,
  ) {
    const userId = headers['user-id'];
    const userRole = headers['user-role'];
    
    if (!userId || userRole !== 'RESPONDENT') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.updateCaseResponse(userId, responseId, updateCaseResponseDto);
  }

  // Get notifications for the respondent
  @Get('notifications')
  async getRespondentNotifications(@Headers() headers) {
    const userId = headers['user-id'];
    const userRole = headers['user-role'];
    
    if (!userId || userRole !== 'RESPONDENT') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.getRespondentNotifications(userId);
  }

  // Mark a notification as read
  @Put('notifications/:id/read')
  async markNotificationAsRead(@Headers() headers, @Param('id') notificationId: string) {
    const userId = headers['user-id'];
    const userRole = headers['user-role'];
    
    if (!userId || userRole !== 'RESPONDENT') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.markNotificationAsRead(userId, notificationId);
  }
} 