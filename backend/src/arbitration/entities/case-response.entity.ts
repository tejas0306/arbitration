import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ArbitrationCase } from './arbitration-case.entity';

@Entity('case_responses')
export class CaseResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  caseId: string;

  @Column({ nullable: false })
  respondentId: string;

  @Column('text', { nullable: false })
  responseOverview: string;

  @Column('json', { nullable: false })
  disputePointResponses: any[];

  @Column('json', { nullable: true })
  counterClaims: any[];

  @Column('json', { nullable: true })
  documents: any[];

  @Column('text', { nullable: true })
  additionalNotes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @ManyToOne(() => ArbitrationCase, arbitrationCase => arbitrationCase.responses)
  @JoinColumn({ name: 'caseId' })
  case: ArbitrationCase;
}