import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';

@Injectable()
export class PaymentService {
  private razorpay: Razorpay;

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });
  }

  async createRegistrationPayment() {
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
    const text = orderId + '|' + paymentId;
    const generated_signature = this.razorpay.webhooks.generateSignature(
      text,
      this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    );

    if (generated_signature === signature) {
      return true;
    }
    return false;
  }
} 