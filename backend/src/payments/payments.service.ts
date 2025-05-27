import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async getPaymentsByUser(userId: string, filters: any) {
    // Mock payment data for now since payment system isn't fully integrated
    const mockPayments = [
      {
        id: '1',
        caseId: 'case-001',
        caseNumber: 'ARB/2024/001',
        paymentType: 'filing_fee',
        amount: 50000,
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'Credit Card',
        transactionId: 'TXN-20241225-001',
        paidAt: new Date().toISOString(),
        description: 'Filing fee for arbitration case ARB/2024/001',
        invoiceUrl: '/api/payments/1/invoice',
        receiptUrl: '/api/payments/1/receipt',
        userId: userId
      },
      {
        id: '2',
        caseId: 'case-002',
        caseNumber: 'ARB/2024/002',
        paymentType: 'arbitrator_fee',
        amount: 125000,
        currency: 'INR',
        status: 'pending',
        paymentMethod: 'Bank Transfer',
        transactionId: 'TXN-20241224-002',
        paidAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        description: 'Arbitrator fee for case ARB/2024/002',
        invoiceUrl: '/api/payments/2/invoice',
        receiptUrl: null,
        userId: userId
      },
      {
        id: '3',
        caseId: 'case-003',
        caseNumber: 'ARB/2024/003',
        paymentType: 'administrative_fee',
        amount: 25000,
        currency: 'INR',
        status: 'completed',
        paymentMethod: 'UPI',
        transactionId: 'TXN-20241220-003',
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Administrative fee for case processing',
        invoiceUrl: '/api/payments/3/invoice',
        receiptUrl: '/api/payments/3/receipt',
        userId: userId
      }
    ];

    // Apply filters if provided
    let filteredPayments = mockPayments;
    if (filters.status) {
      filteredPayments = filteredPayments.filter(p => p.status === filters.status);
    }
    if (filters.paymentType) {
      filteredPayments = filteredPayments.filter(p => p.paymentType === filters.paymentType);
    }

    return filteredPayments;
  }

  async getPaymentById(id: string) {
    // Mock payment details
    const payment = {
      id,
      caseId: 'case-001',
      caseNumber: 'ARB/2024/001',
      paymentType: 'filing_fee',
      amount: 50000,
      currency: 'INR',
      status: 'completed',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN-20241225-001',
      paidAt: new Date().toISOString(),
      description: 'Filing fee for arbitration case ARB/2024/001',
      invoiceUrl: `/api/payments/${id}/invoice`,
      receiptUrl: `/api/payments/${id}/receipt`,
      paymentDetails: {
        cardLast4: '4242',
        gatewayResponse: 'approved',
        processingFee: 500,
        netAmount: 49500
      },
      timestamps: {
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        paidAt: new Date().toISOString()
      }
    };

    return payment;
  }

  async createPayment(paymentData: any, userId: string) {
    const payment = {
      id: Date.now().toString(),
      userId,
      caseId: paymentData.caseId,
      paymentType: paymentData.paymentType,
      amount: paymentData.amount,
      currency: paymentData.currency || 'INR',
      status: 'pending',
      description: paymentData.description,
      createdAt: new Date().toISOString(),
      dueDate: paymentData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    // In a real implementation, this would save to the database
    return payment;
  }

  async processPayment(id: string, paymentDetails: any, userId: string) {
    // Mock payment processing
    const processedPayment = {
      id,
      status: 'completed',
      transactionId: `TXN-${Date.now()}`,
      paymentMethod: paymentDetails.paymentMethod,
      paidAt: new Date().toISOString(),
      processingFee: Math.round(paymentDetails.amount * 0.029), // 2.9% processing fee
      gatewayResponse: 'approved'
    };

    // In a real implementation:
    // 1. Integrate with payment gateway (Razorpay, Stripe, etc.)
    // 2. Validate payment details
    // 3. Process the payment
    // 4. Update database
    // 5. Send confirmation emails
    // 6. Update case status if needed

    return processedPayment;
  }

  async updatePaymentStatus(id: string, statusData: any, userId: string) {
    const updatedPayment = {
      id,
      status: statusData.status,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      notes: statusData.notes
    };

    return updatedPayment;
  }

  async generateInvoice(id: string) {
    // Mock invoice generation
    return {
      invoiceId: `INV-${id}`,
      downloadUrl: `/api/payments/${id}/invoice/download`,
      generatedAt: new Date().toISOString(),
      format: 'pdf'
    };
  }

  async generateReceipt(id: string) {
    // Mock receipt generation
    return {
      receiptId: `RCP-${id}`,
      downloadUrl: `/api/payments/${id}/receipt/download`,
      generatedAt: new Date().toISOString(),
      format: 'pdf'
    };
  }

  async createBulkPayments(paymentsData: any, userId: string) {
    const results = paymentsData.payments.map((payment: any, index: number) => ({
      id: (Date.now() + index).toString(),
      userId,
      ...payment,
      status: 'pending',
      createdAt: new Date().toISOString()
    }));

    return {
      created: results.length,
      payments: results
    };
  }

  async getPaymentsByCase(caseId: string) {
    // Mock payments for a specific case
    return [
      {
        id: '1',
        caseId,
        paymentType: 'filing_fee',
        amount: 50000,
        currency: 'INR',
        status: 'completed',
        description: 'Filing fee',
        paidAt: new Date().toISOString()
      },
      {
        id: '2',
        caseId,
        paymentType: 'arbitrator_fee',
        amount: 125000,
        currency: 'INR',
        status: 'pending',
        description: 'Arbitrator fee',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Helper methods for payment calculations
  async calculateFees(caseData: any) {
    const claimAmount = caseData.claimAmount || 0;
    const feeSchedule = this.getFeeSchedule();

    const filingFee = this.calculateFilingFee(claimAmount, feeSchedule);
    const arbitratorFee = this.calculateArbitratorFee(claimAmount, feeSchedule);
    const administrativeFee = this.calculateAdministrativeFee(claimAmount, feeSchedule);

    return {
      filingFee,
      arbitratorFee,
      administrativeFee,
      totalFees: filingFee + arbitratorFee + administrativeFee,
      breakdown: {
        baseAmount: claimAmount,
        feePercentage: this.getFeePercentage(claimAmount),
        additionalCharges: 0
      }
    };
  }

  private getFeeSchedule() {
    return {
      filing: [
        { min: 0, max: 1000000, percentage: 3, minimum: 10000 },
        { min: 1000000, max: 5000000, percentage: 2.5, minimum: 30000 },
        { min: 5000000, max: 10000000, percentage: 2, minimum: 125000 },
        { min: 10000000, max: Infinity, percentage: 1.5, minimum: 200000 }
      ],
      arbitrator: [
        { min: 0, max: 1000000, percentage: 5, minimum: 25000 },
        { min: 1000000, max: 5000000, percentage: 4, minimum: 50000 },
        { min: 5000000, max: 10000000, percentage: 3, minimum: 200000 },
        { min: 10000000, max: Infinity, percentage: 2.5, minimum: 300000 }
      ],
      administrative: [
        { min: 0, max: Infinity, percentage: 1, minimum: 5000 }
      ]
    };
  }

  private calculateFilingFee(amount: number, feeSchedule: any) {
    const bracket = feeSchedule.filing.find((f: any) => amount >= f.min && amount < f.max);
    if (!bracket) return 10000; // Default minimum
    
    const calculatedFee = (amount * bracket.percentage) / 100;
    return Math.max(calculatedFee, bracket.minimum);
  }

  private calculateArbitratorFee(amount: number, feeSchedule: any) {
    const bracket = feeSchedule.arbitrator.find((f: any) => amount >= f.min && amount < f.max);
    if (!bracket) return 25000; // Default minimum
    
    const calculatedFee = (amount * bracket.percentage) / 100;
    return Math.max(calculatedFee, bracket.minimum);
  }

  private calculateAdministrativeFee(amount: number, feeSchedule: any) {
    const bracket = feeSchedule.administrative.find((f: any) => amount >= f.min && amount < f.max);
    if (!bracket) return 5000; // Default minimum
    
    const calculatedFee = (amount * bracket.percentage) / 100;
    return Math.max(calculatedFee, bracket.minimum);
  }

  private getFeePercentage(amount: number) {
    if (amount < 1000000) return 3;
    if (amount < 5000000) return 2.5;
    if (amount < 10000000) return 2;
    return 1.5;
  }
} 