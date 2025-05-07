import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ArbitrationCase } from '../../arbitration/entities/arbitration-case.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  caseId: string;

  @Column({ nullable: false })
  originalName: string;

  @Column({ nullable: false })
  filename: string;

  @Column({ nullable: false })
  path: string;

  @Column({ nullable: false })
  mimeType: string;

  @Column({ nullable: false })
  size: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  uploadedAt: Date;

  @ManyToOne(() => ArbitrationCase, arbitrationCase => arbitrationCase.documents)
  @JoinColumn({ name: 'caseId' })
  case: ArbitrationCase;
}