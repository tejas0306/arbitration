import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PaymentService } from '../payments/payment.service';
import { EmailService } from '../services/email.service';
import { RegisterDto } from './dto/register.dto';
import { UserRole, UserStatus } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { generateTemporaryPassword } from '../utils/password';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private paymentService: PaymentService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Check if user status is active
    if (user.status !== UserStatus.ACTIVE) {
      if (user.status === UserStatus.PENDING_PAYMENT) {
        throw new UnauthorizedException('Please complete your registration payment');
      } else if (user.status === UserStatus.PENDING_APPROVAL) {
        throw new UnauthorizedException('Your account is pending approval');
      } else {
        throw new UnauthorizedException('Your account is inactive');
      }
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Handle different registration flows based on role
    switch (registerDto.role) {
      case UserRole.CLAIMANT:
      case UserRole.RESPONDENT:
        return this.handlePublicRegistration(registerDto, hashedPassword);
      
      case UserRole.ARBITRATOR:
        return this.handleArbitratorRegistration(registerDto, hashedPassword);
      
      case UserRole.ADMIN:
      case UserRole.CASE_MANAGER:
      case UserRole.TEAM_MEMBER:
        throw new UnauthorizedException('Internal roles cannot be registered through public API');
      
      default:
        throw new BadRequestException('Invalid role specified');
    }
  }

  private async handlePublicRegistration(registerDto: RegisterDto, hashedPassword: string) {
    // Create payment order
    const paymentOrder = await this.paymentService.createRegistrationPayment();

    // Create user with pending payment status
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      status: UserStatus.PENDING_PAYMENT,
      paymentId: paymentOrder.id,
    });

    return {
      user: { id: user.id, email: user.email, name: user.name },
      paymentOrder,
    };
  }

  private async handleArbitratorRegistration(registerDto: RegisterDto, hashedPassword: string) {
    // Validate arbitrator-specific fields
    if (!registerDto.qualifications || !registerDto.expertise) {
      throw new BadRequestException('Qualifications and expertise are required for arbitrators');
    }

    // Create user with pending approval status
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
      status: UserStatus.PENDING_APPROVAL,
    });

    // Send pending notification
    await this.emailService.sendArbitratorPendingNotification(user);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      message: 'Your application is pending approval',
    };
  }

  async verifyPayment(paymentId: string, orderId: string, signature: string) {
    const isValid = await this.paymentService.verifyPayment(paymentId, orderId, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Find user by payment order ID and activate
    const user = await this.usersService.findByPaymentId(orderId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update user status and send confirmation
    await this.usersService.update(user.id, { status: UserStatus.ACTIVE });
    await this.emailService.sendRegistrationConfirmation(user);

    return { message: 'Payment verified and account activated' };
  }

  async createInternalUser(adminId: string, createUserDto: any) {
    // Verify admin permissions
    const admin = await this.usersService.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admins can create internal users');
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create internal user
    const user = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      temporaryPassword,
    });

    // Send credentials email
    await this.emailService.sendInternalUserCredentials(user, temporaryPassword);

    return { message: 'Internal user created successfully' };
  }

  async approveArbitrator(adminId: string, arbitratorId: string) {
    // Verify admin permissions
    const admin = await this.usersService.findById(adminId);
    if (admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admins can approve arbitrators');
    }

    // Find and verify arbitrator
    const arbitrator = await this.usersService.findById(arbitratorId);
    if (arbitrator.role !== UserRole.ARBITRATOR) {
      throw new BadRequestException('User is not an arbitrator');
    }

    // Update status and send notification
    await this.usersService.update(arbitratorId, { status: UserStatus.ACTIVE });
    await this.emailService.sendArbitratorApprovalNotification(arbitrator);

    return { message: 'Arbitrator approved successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      return { message: 'If your email is registered, you will receive a password reset link' };
    }

    // Generate reset token
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '1h' },
    );

    // In a real application, you would send an email with the reset link
    // For now, we'll just return the token
    await this.usersService.saveResetToken(user.id, resetToken);

    return { message: 'If your email is registered, you will receive a password reset link' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify token
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || user.resetToken !== token) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password and clear reset token
      await this.usersService.updatePassword(user.id, hashedPassword);

      return { message: 'Password has been reset successfully' };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}