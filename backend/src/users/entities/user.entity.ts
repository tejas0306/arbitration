import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
  CLAIMANT = 'claimant',
  RESPONDENT = 'respondent',
  ARBITRATOR = 'arbitrator',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLAIMANT,
  })
  role: UserRole;

  @Column({ nullable: true })
  organization: string;

  @Column({ nullable: true })
  resetToken: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}