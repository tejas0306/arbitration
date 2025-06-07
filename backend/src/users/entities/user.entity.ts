import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  CLAIMANT = 'CLAIMANT',
  RESPONDENT = 'RESPONDENT',
  ARBITRATOR = 'ARBITRATOR',
  ADMIN = 'ADMIN',
  CASE_MANAGER = 'CASE_MANAGER',
  TEAM_MEMBER = 'TEAM_MEMBER'
}

export enum UserStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  mobile: string;

  @Column({ nullable: true })
  organization: string;

  @Column({
    type: 'enum',
    enum: UserRole
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_PAYMENT
  })
  status: UserStatus;

  // Arbitrator specific fields
  @Column({ nullable: true })
  qualifications: string;

  @Column({ nullable: true })
  expertise: string;

  @Column({ type: 'decimal', nullable: true })
  hourlyRate: number;

  @Column({ nullable: true })
  availability: string;

  @Column({ type: 'json', nullable: true })
  documents: any[];

  @Column({ nullable: true })
  resetToken: string;

  @Column({ nullable: true })
  temporaryPassword: string;

  @Column({ nullable: true })
  paymentId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}