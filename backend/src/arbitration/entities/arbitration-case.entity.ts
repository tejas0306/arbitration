import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CaseResponse } from './case-response.entity';
import { Hearing } from '../../hearings/entities/hearing.entity';

@Entity('arbitration_cases')
export class ArbitrationCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true, unique: true })
  caseNumber: string;

  @Column({ nullable: false })
  claimantId: string;

  @Column({ nullable: true })
  respondentId: string;

  @Column({ nullable: true })
  arbitratorId: string;

  @Column('json', { nullable: false })
  claimantDetails: any;

  @Column('json', { nullable: true })
  additionalClaimants: any[];

  @Column('json', { nullable: true })
  manager: any;

  @Column('json', { nullable: false })
  respondentDetails: any;

  @Column('json', { nullable: false })
  arbitrationAgreement: any;

  @Column('json', { nullable: false })
  dispute: any;

  @Column({ nullable: false })
  disputeCategory: string;

  @Column({ nullable: false })
  disputeSubCategory: string;

  @Column('text', { nullable: false })
  disputeDescription: string;

  @Column('json', { nullable: true })
  documents: any[];

  @Column('json', { nullable: true })
  formData: any;

  @Column({ nullable: true })
  preferredArbitratorId: string;

  @Column({ nullable: true })
  preferredLanguage: string;

  @Column({ nullable: true })
  preferredLocation: string;

  @Column('text', { nullable: true })
  additionalNotes: string;

  @Column({ nullable: false })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => CaseResponse, response => response.case)
  responses: CaseResponse[];

  // Uncomment and properly implement the hearings relationship
  @OneToMany(() => Hearing, hearing => hearing.case)
  hearings: Hearing[];

  // These would be defined if you have Document entity
  // @OneToMany(() => Document, document => document.case)
  // documents: Document[];
}