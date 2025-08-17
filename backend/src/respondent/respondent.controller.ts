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
  BadRequestException,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RespondentService } from './respondent.service';
import { CreateRespondentRegistrationDto } from './dto/create-respondent-registration.dto';
import { CreateCaseResponseDto } from './dto/create-case-response.dto';
import { UpdateCaseResponseDto } from './dto/update-case-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('respondent')
export class RespondentController {
  constructor(private readonly respondentService: RespondentService) {}

  // Verify respondent access token
  @Post('auth/verify-token')
  @HttpCode(HttpStatus.OK)
  async verifyToken(@Body() body: { token: string; caseId: string }) {
    if (!body.token || !body.caseId) {
      throw new BadRequestException('Token and case ID are required');
    }
    
    return this.respondentService.verifyToken(body.token, body.caseId);
  }

  // Respondent login
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: { email: string; password: string; caseId?: string; token?: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    
    return this.respondentService.login(body.email, body.password, body.caseId, body.token);
  }

  // Respondent registration
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: {
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    phone?: string;
    address?: string;
    caseId?: string;
    token?: string;
  }) {
    if (!body.email || !body.password || !body.confirmPassword || !body.fullName) {
      throw new BadRequestException('Email, password, confirm password, and full name are required');
    }

    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    
    return this.respondentService.register(body);
  }

  // Get respondent session
  @Get('auth/session')
  @HttpCode(HttpStatus.OK)
  async getSession(@Headers() headers) {
    const authorization = headers['authorization'];
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid session token');
    }
    
    const token = authorization.replace('Bearer ', '');
    return this.respondentService.getSession(token);
  }

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
  @UseGuards(JwtAuthGuard)
  async getRespondentCases(@Request() req) {
    console.log('🔧 Respondent cases called with user:', req.user);
    
    if (!req.user || !req.user.id) {
      throw new UnauthorizedException('User not found in request');
    }
    
    return this.respondentService.getRespondentCases(req.user.id);
  }

  // Get a specific case for the respondent
  @Get('cases/:id')
  async getRespondentCase(@Headers() headers, @Param('id') caseId: string) {
    const authorization = headers['authorization'];
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid session token');
    }
    
    const token = authorization.replace('Bearer ', '');
    const session = await this.respondentService.getSession(token);
    
    if (!session.success || session.user.role !== 'respondent') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.getRespondentCase(session.user.id, caseId);
  }

  // Alternative endpoint that accepts caseId with slashes via query param
  @Get('case')
  async getRespondentCaseByQuery(@Headers() headers, @Query('id') caseId: string) {
    console.log('[RespondentController] GET /respondent/case?id=', caseId);
    const authorization = headers['authorization'];
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid session token');
    }

    const token = authorization.replace('Bearer ', '');
    const session = await this.respondentService.getSession(token);

    if (!session.success || session.user.role !== 'respondent') {
      throw new UnauthorizedException('Invalid user or role');
    }

    console.log('[RespondentController] Authenticated respondent:', session.user);
    return this.respondentService.getRespondentCase(session.user.id, caseId);
  }

  // Submit a response to a case
  @Post('cases/:id/respond')
  @HttpCode(HttpStatus.CREATED)
  async submitCaseResponse(
    @Headers() headers,
    @Param('id') caseId: string,
    @Body() createCaseResponseDto: CreateCaseResponseDto,
  ) {
    const authorization = headers['authorization'];
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid session token');
    }
    
    const token = authorization.replace('Bearer ', '');
    const session = await this.respondentService.getSession(token);
    
    if (!session.success || session.user.role !== 'respondent') {
      throw new UnauthorizedException('Invalid user or role');
    }
    
    return this.respondentService.submitCaseResponse(session.user.id, caseId, createCaseResponseDto);
  }

  // Alternative respond endpoint using query param for caseId
  @Post('case/respond')
  @HttpCode(HttpStatus.CREATED)
  async submitCaseResponseByQuery(
    @Headers() headers,
    @Query('id') caseId: string,
    @Body() createCaseResponseDto: CreateCaseResponseDto,
  ) {
    const authorization = headers['authorization'];
    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid session token');
    }

    const token = authorization.replace('Bearer ', '');
    const session = await this.respondentService.getSession(token);

    if (!session.success || session.user.role !== 'respondent') {
      throw new UnauthorizedException('Invalid user or role');
    }

    return this.respondentService.submitCaseResponse(session.user.id, caseId, createCaseResponseDto);
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