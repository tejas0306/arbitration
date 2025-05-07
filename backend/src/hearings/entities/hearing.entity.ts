import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ArbitrationCase } from '../../arbitration/entities/arbitration-case.entity';

export type HearingStatus = 'scheduled' | 'completed' | 'cancelled';
export type HearingType = 'virtual' | 'physical';

@Entity('hearings')
export class Hearing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  caseId: string;

  @Column({ type: 'date', nullable: false })
  date: string;

  @Column({ nullable: false })
  time: string;

  @Column({ nullable: false })
  duration: number;

  @Column({
    type: 'enum',
    enum: ['virtual', 'physical'],
    default: 'virtual',
  })
  type: HearingType;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  meetingLink: string;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status: HearingStatus;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => ArbitrationCase, arbitrationCase => arbitrationCase.hearings)
  @JoinColumn({ name: 'caseId' })
  case: ArbitrationCase;
}