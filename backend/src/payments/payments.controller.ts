import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  async getPayments(@Query() filters: any, @Request() req) {
    return this.paymentsService.getPaymentsByUser(req.user.id, filters);
  }

  @Get(':id')
  async getPaymentDetails(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  @Post()
  async createPayment(@Body() paymentData: any, @Request() req) {
    return this.paymentsService.createPayment(paymentData, req.user.id);
  }

  @Post(':id/process')
  async processPayment(
    @Param('id') id: string,
    @Body() paymentDetails: any,
    @Request() req
  ) {
    return this.paymentsService.processPayment(id, paymentDetails, req.user.id);
  }

  @Patch(':id/status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() statusData: any,
    @Request() req
  ) {
    return this.paymentsService.updatePaymentStatus(id, statusData, req.user.id);
  }

  @Get(':id/invoice')
  async getInvoice(@Param('id') id: string) {
    return this.paymentsService.generateInvoice(id);
  }

  @Get(':id/receipt')
  async getReceipt(@Param('id') id: string) {
    return this.paymentsService.generateReceipt(id);
  }

  @Post('bulk-create')
  async createBulkPayments(@Body() paymentsData: any, @Request() req) {
    return this.paymentsService.createBulkPayments(paymentsData, req.user.id);
  }

  @Get('case/:caseId')
  async getPaymentsByCase(@Param('caseId') caseId: string) {
    return this.paymentsService.getPaymentsByCase(caseId);
  }
} 