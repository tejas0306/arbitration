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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaseManagerService } from './case-manager.service';
import { CaseManagerGuard } from './guards/case-manager.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { ScheduleReminderDto } from './dto/schedule-reminder.dto';
import { AssignTeamMemberDto } from './dto/assign-team-member.dto';
import { CreateCaseNoteDto } from './dto/create-case-note.dto';
import { BulkOperationDto } from './dto/bulk-operation.dto';

@Controller('case-manager')
@UseGuards(JwtAuthGuard, CaseManagerGuard)
export class CaseManagerController {
  constructor(private caseManagerService: CaseManagerService) {}

  // ===== DASHBOARD & WORKFLOW OVERVIEW =====
  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.caseManagerService.getDashboard(req.user.id);
  }

  @Get('workflow/overview')
  async getWorkflowOverview(@Query() filters: any) {
    return this.caseManagerService.getWorkflowOverview(filters);
  }

  @Get('workload/distribution')
  async getWorkloadDistribution() {
    return this.caseManagerService.getWorkloadDistribution();
  }

  // ===== CASE WORKFLOW MANAGEMENT =====
  @Get('cases/my-cases')
  async getMyCases(@Request() req, @Query() filters: any) {
    return this.caseManagerService.getMyCases(req.user.id, filters);
  }

  @Get('cases/workflow-pending')
  async getWorkflowPendingCases(@Query() filters: any) {
    return this.caseManagerService.getWorkflowPendingCases(filters);
  }

  @Post('cases/:id/workflow')
  async updateCaseWorkflow(
    @Param('id') id: string,
    @Body() workflowData: UpdateWorkflowDto,
    @Request() req,
  ) {
    return this.caseManagerService.updateCaseWorkflow(id, workflowData, req.user.id);
  }

  @Post('cases/:id/assign-team')
  async assignTeamMember(
    @Param('id') id: string,
    @Body() assignData: AssignTeamMemberDto,
    @Request() req,
  ) {
    return this.caseManagerService.assignTeamMember(id, assignData, req.user.id);
  }

  @Post('cases/:id/escalate')
  async escalateCase(
    @Param('id') id: string,
    @Body() escalationData: { reason: string; priority: string; notes?: string },
    @Request() req,
  ) {
    return this.caseManagerService.escalateCase(id, escalationData, req.user.id);
  }

  @Post('cases/:id/handoff')
  async handoffCase(
    @Param('id') id: string,
    @Body() handoffData: { toManagerId: string; notes?: string },
    @Request() req,
  ) {
    return this.caseManagerService.handoffCase(id, handoffData, req.user.id);
  }

  // ===== CASE NOTES & COLLABORATION =====
  @Get('cases/:id/notes')
  async getCaseNotes(@Param('id') id: string) {
    return this.caseManagerService.getCaseNotes(id);
  }

  @Post('cases/:id/notes')
  async createCaseNote(
    @Param('id') id: string,
    @Body() noteData: CreateCaseNoteDto,
    @Request() req,
  ) {
    return this.caseManagerService.createCaseNote(id, noteData, req.user.id);
  }

  @Patch('cases/notes/:noteId')
  async updateCaseNote(
    @Param('noteId') noteId: string,
    @Body() updateData: Partial<CreateCaseNoteDto>,
    @Request() req,
  ) {
    return this.caseManagerService.updateCaseNote(noteId, updateData, req.user.id);
  }

  @Delete('cases/notes/:noteId')
  async deleteCaseNote(@Param('noteId') noteId: string, @Request() req) {
    return this.caseManagerService.deleteCaseNote(noteId, req.user.id);
  }

  // ===== SCHEDULING & CALENDAR MANAGEMENT =====
  @Get('schedule/calendar')
  async getCalendar(@Query() filters: any) {
    return this.caseManagerService.getCalendar(filters);
  }

  @Get('schedule/conflicts')
  async getScheduleConflicts() {
    return this.caseManagerService.getScheduleConflicts();
  }

  @Post('schedule/hearing')
  async scheduleHearing(
    @Body() hearingData: any,
    @Request() req,
  ) {
    return this.caseManagerService.scheduleHearing(hearingData, req.user.id);
  }

  @Post('schedule/reminder')
  async scheduleReminder(
    @Body() reminderData: ScheduleReminderDto,
    @Request() req,
  ) {
    return this.caseManagerService.scheduleReminder(reminderData, req.user.id);
  }

  @Get('schedule/upcoming')
  async getUpcomingEvents(@Query() filters: any) {
    return this.caseManagerService.getUpcomingEvents(filters);
  }

  // ===== NOTIFICATION MANAGEMENT =====
  @Get('notifications')
  async getNotifications(@Request() req, @Query() filters: any) {
    return this.caseManagerService.getNotifications(req.user.id, filters);
  }

  @Post('notifications')
  async createNotification(
    @Body() notificationData: CreateNotificationDto,
    @Request() req,
  ) {
    return this.caseManagerService.createNotification(notificationData, req.user.id);
  }

  @Post('notifications/bulk-send')
  async sendBulkNotifications(
    @Body() bulkData: { recipientIds: string[]; message: string; type: string },
    @Request() req,
  ) {
    return this.caseManagerService.sendBulkNotifications(bulkData, req.user.id);
  }

  @Patch('notifications/:id/read')
  async markNotificationRead(@Param('id') id: string, @Request() req) {
    return this.caseManagerService.markNotificationRead(id, req.user.id);
  }

  @Post('notifications/mark-all-read')
  async markAllNotificationsRead(@Request() req) {
    return this.caseManagerService.markAllNotificationsRead(req.user.id);
  }

  @Get('notifications/templates')
  async getNotificationTemplates() {
    return this.caseManagerService.getNotificationTemplates();
  }

  @Post('notifications/templates')
  async createNotificationTemplate(
    @Body() templateData: any,
    @Request() req,
  ) {
    return this.caseManagerService.createNotificationTemplate(templateData, req.user.id);
  }

  // ===== DEADLINE & MILESTONE TRACKING =====
  @Get('deadlines/upcoming')
  async getUpcomingDeadlines(@Query() filters: any) {
    return this.caseManagerService.getUpcomingDeadlines(filters);
  }

  @Get('deadlines/overdue')
  async getOverdueDeadlines() {
    return this.caseManagerService.getOverdueDeadlines();
  }

  @Post('deadlines/extend')
  async extendDeadline(
    @Body() extensionData: { timelineId: string; newDate: string; reason: string },
    @Request() req,
  ) {
    return this.caseManagerService.extendDeadline(extensionData, req.user.id);
  }

  @Post('milestones/:id/complete')
  async completeMilestone(
    @Param('id') id: string,
    @Body() completionData: { notes?: string; evidence?: string },
    @Request() req,
  ) {
    return this.caseManagerService.completeMilestone(id, completionData, req.user.id);
  }

  // ===== TEAM COORDINATION =====
  @Get('team/members')
  async getTeamMembers() {
    return this.caseManagerService.getTeamMembers();
  }

  @Get('team/availability')
  async getTeamAvailability(@Query() filters: any) {
    return this.caseManagerService.getTeamAvailability(filters);
  }

  @Post('team/assign-cases')
  async assignCasesToTeam(
    @Body() assignmentData: { caseIds: string[]; teamMemberIds: string[] },
    @Request() req,
  ) {
    return this.caseManagerService.assignCasesToTeam(assignmentData, req.user.id);
  }

  @Get('team/performance')
  async getTeamPerformance(@Query() filters: any) {
    return this.caseManagerService.getTeamPerformance(filters);
  }

  // ===== REPORTING & ANALYTICS =====
  @Get('reports/case-flow')
  async getCaseFlowReport(@Query() filters: any) {
    return this.caseManagerService.getCaseFlowReport(filters);
  }

  @Get('reports/bottlenecks')
  async getBottleneckAnalysis() {
    return this.caseManagerService.getBottleneckAnalysis();
  }

  @Get('reports/efficiency')
  async getEfficiencyMetrics(@Query() filters: any) {
    return this.caseManagerService.getEfficiencyMetrics(filters);
  }

  @Get('reports/sla-compliance')
  async getSLACompliance(@Query() filters: any) {
    return this.caseManagerService.getSLACompliance(filters);
  }

  // ===== BULK OPERATIONS =====
  @Post('bulk/assign-arbitrators')
  async bulkAssignArbitrators(
    @Body() bulkData: BulkOperationDto,
    @Request() req,
  ) {
    return this.caseManagerService.bulkAssignArbitrators(bulkData, req.user.id);
  }

  @Post('bulk/update-status')
  async bulkUpdateStatus(
    @Body() bulkData: BulkOperationDto,
    @Request() req,
  ) {
    return this.caseManagerService.bulkUpdateStatus(bulkData, req.user.id);
  }

  @Post('bulk/send-reminders')
  async bulkSendReminders(
    @Body() bulkData: { caseIds: string[]; message: string; type: string },
    @Request() req,
  ) {
    return this.caseManagerService.bulkSendReminders(bulkData, req.user.id);
  }

  // ===== INTEGRATION & AUTOMATION =====
  @Get('automation/rules')
  async getAutomationRules() {
    return this.caseManagerService.getAutomationRules();
  }

  @Post('automation/rules')
  async createAutomationRule(
    @Body() ruleData: any,
    @Request() req,
  ) {
    return this.caseManagerService.createAutomationRule(ruleData, req.user.id);
  }

  @Get('integration/calendar/sync')
  async syncExternalCalendar(@Request() req) {
    return this.caseManagerService.syncExternalCalendar(req.user.id);
  }

  @Post('integration/email/send')
  async sendEmail(
    @Body() emailData: { to: string[]; subject: string; body: string; caseId?: string },
    @Request() req,
  ) {
    return this.caseManagerService.sendEmail(emailData, req.user.id);
  }

  // ===== QUALITY ASSURANCE =====
  @Get('qa/pending-review')
  async getPendingQAReview() {
    return this.caseManagerService.getPendingQAReview();
  }

  @Post('qa/review/:caseId')
  async conductQAReview(
    @Param('caseId') caseId: string,
    @Body() reviewData: { score: number; feedback: string; recommendations: string[] },
    @Request() req,
  ) {
    return this.caseManagerService.conductQAReview(caseId, reviewData, req.user.id);
  }

  @Get('qa/metrics')
  async getQAMetrics(@Query() filters: any) {
    return this.caseManagerService.getQAMetrics(filters);
  }
} 