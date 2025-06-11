import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentService {
  private razorpay: any;
  private logger = new Logger(PaymentService.name);

  constructor(private configService: ConfigService) {
    const key_id = this.configService.get<string>('RAZORPAY_KEY_ID');
    const key_secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    
    try {
      if (key_id && key_secret) {
        this.razorpay = new Razorpay({
          key_id,
          key_secret,
        });
        this.logger.log('Razorpay initialized successfully');
      } else {
        this.logger.warn('Razorpay not initialized: Missing API keys. Payment features will be unavailable.');
      }
    } catch (error) {
      this.logger.error(`Failed to initialize Razorpay: ${error.message}`);
    }
  }

  async createRegistrationPayment() {
    if (!this.razorpay) {
      this.logger.warn('Payment request failed: Razorpay not initialized');
      throw new Error('Payment service not available');
    }
    
    const options = {
      amount: 10000, // Amount in paise (₹100)
      currency: 'INR',
      receipt: `reg_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await this.razorpay.orders.create(options);
    return order;
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    if (!this.razorpay) {
      this.logger.warn('Payment verification failed: Razorpay not initialized');
      throw new Error('Payment service not available');
    }
    
    const text = orderId + '|' + paymentId;
    
    // Create a crypto hash using the HMAC SHA256 algorithm
    const crypto = require('crypto');
    const generated_signature = crypto
      .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET'))
      .update(text)
      .digest('hex');

    if (generated_signature === signature) {
      return true;
    }
    return false;
  }
} 