import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { AssignArbitratorDto } from './dto/assign-arbitrator.dto';
import { UpdateCaseStatusDto } from './dto/update-case-status.dto';
import { SetCaseTimelineDto } from './dto/set-case-timeline.dto';
import { ArchiveCaseDto } from './dto/archive-case.dto';
import { UpdateArbitratorStatusDto } from './dto/update-arbitrator-status.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import { CreateInternalUserDto } from './dto/create-internal-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard, AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // ===== DASHBOARD & ANALYTICS =====
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('analytics/cases')
  async getCaseAnalytics(@Query() filters: any) {
    return this.adminService.getCaseAnalytics(filters);
  }

  @Get('analytics/arbitrators')
  async getArbitratorAnalytics(@Query() filters: any) {
    return this.adminService.getArbitratorAnalytics(filters);
  }

  @Get('analytics/revenue')
  async getRevenueAnalytics(@Query() filters: any) {
    return this.adminService.getRevenueAnalytics(filters);
  }

  // ===== CASE OVERSIGHT =====
  @Get('cases')
  async getAllCases(@Query() filters: any) {
    return this.adminService.getAllCases(filters);
  }

  @Get('cases/pending-review')
  async getPendingReviewCases() {
    return this.adminService.getPendingReviewCases();
  }

  @Get('cases/:id')
  async getCaseDetails(@Param('id') id: string) {
    return this.adminService.getCaseDetails(id);
  }

  @Post('cases/:id/review')
  async reviewCase(
    @Param('id') id: string,
    @Body() reviewData: { approved: boolean; notes?: string },
    @Request() req,
  ) {
    return this.adminService.reviewCase(id, reviewData, req.user.id);
  }

  @Patch('cases/:id/status')
  async updateCaseStatus(
    @Param('id') id: string,
    @Body() statusData: UpdateCaseStatusDto,
    @Request() req,
  ) {
    return this.adminService.updateCaseStatus(id, statusData, req.user.id);
  }

  @Post('cases/:id/assign-arbitrator')
  async assignArbitrator(
    @Param('id') id: string,
    @Body() assignData: AssignArbitratorDto,
    @Request() req,
  ) {
    return this.adminService.assignArbitratorToCase(id, assignData, req.user.id);
  }

  @Post('cases/:id/reassign-arbitrator')
  async reassignArbitrator(
    @Param('id') id: string,
    @Body() assignData: AssignArbitratorDto,
    @Request() req,
  ) {
    return this.adminService.reassignArbitrator(id, assignData, req.user.id);
  }

  @Post('cases/:id/timeline')
  async setCaseTimeline(
    @Param('id') id: string,
    @Body() timelineData: SetCaseTimelineDto,
    @Request() req,
  ) {
    return this.adminService.setCaseTimeline(id, timelineData, req.user.id);
  }

  // ===== CASE CLOSURE & ARCHIVING =====
  @Post('cases/:id/close')
  async closeCase(
    @Param('id') id: string,
    @Body() closeData: { reason: string; notes?: string },
    @Request() req,
  ) {
    return this.adminService.closeCase(id, closeData, req.user.id);
  }

  @Post('cases/:id/archive')
  async archiveCase(
    @Param('id') id: string,
    @Body() archiveData: ArchiveCaseDto,
    @Request() req,
  ) {
    return this.adminService.archiveCase(id, archiveData, req.user.id);
  }

  @Get('cases/archived')
  async getArchivedCases(@Query() filters: any) {
    return this.adminService.getArchivedCases(filters);
  }

  @Post('cases/:id/restore')
  async restoreCase(@Param('id') id: string, @Request() req) {
    return this.adminService.restoreCase(id, req.user.id);
  }

  // ===== ARBITRATOR MANAGEMENT =====
  @Get('arbitrators')
  async getAllArbitrators(@Query() filters: any) {
    return this.adminService.getAllArbitratorsForAdmin(filters);
  }

  @Get('arbitrators/pending')
  async getPendingArbitrators() {
    return this.usersService.findByRoleAndStatus(
      UserRole.ARBITRATOR,
      UserStatus.PENDING_APPROVAL
    );
  }

  @Post('arbitrators/:id/approve')
  async approveArbitrator(@Req() req, @Param('id') arbitratorId: string) {
    return this.authService.approveArbitrator(req.user.id, arbitratorId);
  }

  @Post('arbitrators/:id/reject')
  async rejectArbitrator(
    @Param('id') id: string,
    @Body() rejectionData: { reason: string; notes?: string },
    @Request() req,
  ) {
    return this.adminService.rejectArbitrator(id, rejectionData, req.user.id);
  }

  @Patch('arbitrators/:id/status')
  async updateArbitratorStatus(
    @Param('id') id: string,
    @Body() statusData: UpdateArbitratorStatusDto,
    @Request() req,
  ) {
    return this.adminService.updateArbitratorStatus(id, statusData, req.user.id);
  }

  @Get('arbitrators/:id/performance')
  async getArbitratorPerformance(@Param('id') id: string) {
    return this.adminService.getArbitratorPerformance(id);
  }

  // ===== USER MANAGEMENT =====
  @Get('users')
  async getAllUsers(@Query() filters: any) {
    return this.adminService.getAllUsers(filters);
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string) {
    return this.adminService.getUserDetails(id);
  }

  @Post('users/create')
  async createUser(
    @Body() createUserData: CreateAdminUserDto,
    @Request() req,
  ) {
    return this.adminService.createInternalUser(createUserData, req.user.id);
  }

  @Patch('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() roleData: UpdateUserRoleDto,
    @Request() req,
  ) {
    return this.adminService.updateUserRole(id, roleData, req.user.id);
  }

  @Post('users/:id/suspend')
  async suspendUser(
    @Param('id') id: string,
    @Body() suspensionData: { reason: string; duration?: number },
    @Request() req,
  ) {
    return this.adminService.suspendUser(id, suspensionData, req.user.id);
  }

  @Post('users/:id/activate')
  async activateUser(@Param('id') id: string, @Request() req) {
    return this.adminService.activateUser(id, req.user.id);
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(
    @Param('id') id: string,
    @Body() resetData: { reason?: string; sendEmail?: boolean },
    @Request() req,
  ) {
    return this.adminService.resetUserPassword(id, resetData, req.user.id);
  }

  // ===== FEEDBACK & REVIEWS =====
  @Get('feedback')
  async getAllFeedback(@Query() filters: any) {
    return this.adminService.getAllFeedback(filters);
  }

  @Get('feedback/flagged')
  async getFlaggedFeedback() {
    return this.adminService.getFlaggedFeedback();
  }

  @Post('feedback/:id/review')
  async reviewFeedback(
    @Param('id') id: string,
    @Body() reviewData: { action: 'approve' | 'reject' | 'flag'; notes?: string },
    @Request() req,
  ) {
    return this.adminService.reviewFeedback(id, reviewData, req.user.id);
  }

  // ===== ANNOUNCEMENTS & NOTIFICATIONS =====
  @Post('announcements')
  async createAnnouncement(
    @Body() announcementData: CreateAnnouncementDto,
    @Request() req,
  ) {
    return this.adminService.createAnnouncement(announcementData, req.user.id);
  }

  @Get('announcements')
  async getAnnouncements(@Query() filters: any) {
    return this.adminService.getAnnouncements(filters);
  }

  @Patch('announcements/:id')
  async updateAnnouncement(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateAnnouncementDto>,
    @Request() req,
  ) {
    return this.adminService.updateAnnouncement(id, updateData, req.user.id);
  }

  @Delete('announcements/:id')
  async deleteAnnouncement(@Param('id') id: string, @Request() req) {
    return this.adminService.deleteAnnouncement(id, req.user.id);
  }

  // ===== SYSTEM SETTINGS =====
  @Get('settings')
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Patch('settings')
  async updateSystemSettings(
    @Body() settingsData: any,
    @Request() req,
  ) {
    return this.adminService.updateSystemSettings(settingsData, req.user.id);
  }

  // ===== AUDIT LOGS =====
  @Get('audit-logs')
  async getAuditLogs(@Query() filters: any) {
    return this.adminService.getAuditLogs(filters);
  }

  @Get('audit-logs/user/:userId')
  async getUserAuditLogs(@Param('userId') userId: string, @Query() filters: any) {
    return this.adminService.getUserAuditLogs(userId, filters);
  }

  // ===== REPORTS =====
  @Get('reports/monthly')
  async getMonthlyReport(@Query() filters: any) {
    return this.adminService.getMonthlyReport(filters);
  }

  @Get('reports/arbitrator-performance')
  async getArbitratorPerformanceReport(@Query() filters: any) {
    return this.adminService.getArbitratorPerformanceReport(filters);
  }

  @Get('reports/case-resolution')
  async getCaseResolutionReport(@Query() filters: any) {
    return this.adminService.getCaseResolutionReport(filters);
  }

  @Post('reports/export')
  async exportReport(
    @Body() exportData: { type: string; format: string; filters?: any },
    @Request() req,
  ) {
    return this.adminService.exportReport(exportData, req.user.id);
  }

  // ===== CONFIGURATION MANAGEMENT =====
  @Get('configuration/templates')
  async getTemplates(@Query() filters: any) {
    return this.adminService.getTemplates(filters);
  }

  @Get('configuration/templates/email')
  async getEmailTemplates() {
    return this.adminService.getEmailTemplates();
  }

  @Get('configuration/templates/sms')
  async getSmsTemplates() {
    return this.adminService.getSmsTemplates();
  }

  @Post('configuration/templates/email')
  async createEmailTemplate(@Body() templateData: any, @Request() req) {
    return this.adminService.createEmailTemplate(templateData, req.user.id);
  }

  @Post('configuration/templates/sms')
  async createSmsTemplate(@Body() templateData: any, @Request() req) {
    return this.adminService.createSmsTemplate(templateData, req.user.id);
  }

  @Get('configuration/lovs')
  async getAllLovs() {
    return this.adminService.getAllLovs();
  }

  @Get('configuration/lovs/categories')
  async getCaseCategories() {
    return this.adminService.getCaseCategories();
  }

  @Get('configuration/lovs/document-types')
  async getDocumentTypes() {
    return this.adminService.getDocumentTypes();
  }

  @Get('configuration/lovs/dispute-types')
  async getDisputeTypes() {
    return this.adminService.getDisputeTypes();
  }

  @Post('configuration/lovs/categories')
  async createCaseCategory(@Body() categoryData: any, @Request() req) {
    return this.adminService.createCaseCategory(categoryData, req.user.id);
  }

  @Post('configuration/lovs/document-types')
  async createDocumentType(@Body() typeData: any, @Request() req) {
    return this.adminService.createDocumentType(typeData, req.user.id);
  }

  @Post('configuration/lovs/dispute-types')
  async createDisputeType(@Body() typeData: any, @Request() req) {
    return this.adminService.createDisputeType(typeData, req.user.id);
  }

  @Get('configuration/business-rules')
  async getBusinessRules() {
    return this.adminService.getBusinessRules();
  }

  @Get('configuration/business-rules/workflows')
  async getWorkflowRules() {
    return this.adminService.getWorkflowRules();
  }

  @Get('configuration/business-rules/escalations')
  async getEscalationRules() {
    return this.adminService.getEscalationRules();
  }

  @Post('configuration/business-rules/workflows')
  async createWorkflowRule(@Body() ruleData: any, @Request() req) {
    return this.adminService.createWorkflowRule(ruleData, req.user.id);
  }

  @Post('configuration/business-rules/escalations')
  async createEscalationRule(@Body() ruleData: any, @Request() req) {
    return this.adminService.createEscalationRule(ruleData, req.user.id);
  }

  @Get('configuration/fees')
  async getFeesConfiguration() {
    return this.adminService.getFeesConfiguration();
  }

  @Get('configuration/fees/schedules')
  async getFeeSchedules() {
    return this.adminService.getFeeSchedules();
  }

  @Get('configuration/fees/discounts')
  async getFeeDiscounts() {
    return this.adminService.getFeeDiscounts();
  }

  @Post('configuration/fees/schedules')
  async createFeeSchedule(@Body() scheduleData: any, @Request() req) {
    return this.adminService.createFeeSchedule(scheduleData, req.user.id);
  }

  @Post('configuration/fees/discounts')
  async createFeeDiscount(@Body() discountData: any, @Request() req) {
    return this.adminService.createFeeDiscount(discountData, req.user.id);
  }

  // ===== ENHANCED ANALYTICS =====
  @Get('analytics')
  async getAnalyticsDashboard(@Query() filters: any) {
    return this.adminService.getAnalyticsDashboard(filters);
  }

  @Get('analytics/reports')
  async getAnalyticsReports(@Query() filters: any) {
    return this.adminService.getAnalyticsReports(filters);
  }

  @Get('analytics/export')
  async exportAnalytics(@Query() filters: any) {
    return this.adminService.exportAnalytics(filters);
  }

  @Get('analytics/trends')
  async getTrendAnalysis(@Query() filters: any) {
    return this.adminService.getTrendAnalysis(filters);
  }

  @Get('analytics/forecasting')
  async getForecasting(@Query() filters: any) {
    return this.adminService.getForecasting(filters);
  }

  // ===== USER MANAGEMENT ENHANCEMENTS =====
  @Post('users/import')
  async importUsers(@Body() importData: any, @Request() req) {
    return this.adminService.importUsers(importData, req.user.id);
  }

  @Get('users/export')
  async exportUsers(@Query() filters: any) {
    return this.adminService.exportUsers(filters);
  }

  @Get('users/audit')
  async getUserAuditTrail(@Query() filters: any) {
    return this.adminService.getUserAuditTrail(filters);
  }

  @Post('users/bulk-actions')
  async performBulkUserActions(@Body() actionData: any, @Request() req) {
    return this.adminService.performBulkUserActions(actionData, req.user.id);
  }

  // ===== ARBITRATOR MANAGEMENT ENHANCEMENTS =====
  @Get('arbitrators/performance')
  async getArbitratorsPerformanceReport(@Query() filters: any) {
    return this.adminService.getArbitratorsPerformanceReport(filters);
  }

  @Post('arbitrators/bulk-actions')
  async performBulkArbitratorActions(@Body() actionData: any, @Request() req) {
    return this.adminService.performBulkArbitratorActions(actionData, req.user.id);
  }

  // ===== HELP DESK MANAGEMENT =====
  @Get('helpdesk')
  async getHelpDeskTickets(@Query() filters: any) {
    return this.adminService.getHelpDeskTickets(filters);
  }

  @Get('helpdesk/:id')
  async getHelpDeskTicket(@Param('id') id: string) {
    return this.adminService.getHelpDeskTicket(id);
  }

  @Post('helpdesk/:id/response')
  async respondToHelpDeskTicket(
    @Param('id') id: string,
    @Body() responseData: any,
    @Request() req
  ) {
    return this.adminService.respondToHelpDeskTicket(id, responseData, req.user.id);
  }

  @Patch('helpdesk/:id/status')
  async updateHelpDeskTicketStatus(
    @Param('id') id: string,
    @Body() statusData: any,
    @Request() req
  ) {
    return this.adminService.updateHelpDeskTicketStatus(id, statusData, req.user.id);
  }

  @Post('users/internal')
  async createInternalUser(
    @Req() req,
    @Body() createUserDto: CreateInternalUserDto,
  ) {
    return this.authService.createInternalUser(req.user.id, createUserDto);
  }

  @Get('users/internal')
  async getInternalUsers() {
    return this.usersService.findByRoles([
      UserRole.ADMIN,
      UserRole.CASE_MANAGER,
      UserRole.TEAM_MEMBER,
    ]);
  }
} 