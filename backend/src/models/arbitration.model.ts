import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class AdditionalClaimant {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phoneCountryCode: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  address: string;
}

@Schema({ timestamps: true })
export class Respondent {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  address: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phoneCountryCode: string;

  @Prop()
  phone: string;

  @Prop()
  gst: string;

  @Prop()
  pan: string;

  @Prop()
  cin: string;
}

@Schema({ timestamps: true })
export class ArbitrationAgreement {
  @Prop({ required: true })
  agreementDate: Date;

  @Prop({ required: true })
  placeOfSigning: string;

  @Prop({ required: true })
  arbitrationText: string;

  @Prop({ required: true })
  stampDutyPercentage: string;

  @Prop({ required: true })
  numberOfArbitrators: string;

  @Prop({ required: true })
  agreementFile: string;
}

@Schema({ timestamps: true })
export class DisputeDetails {
  @Prop({ required: true })
  disputeType: string;

  @Prop({ required: true })
  disputeAmount: number;

  @Prop({ required: true })
  disputeDescription: string;

  @Prop({ required: true })
  disputeDate: Date;
}

@Schema({ timestamps: true })
export class Documents {
  @Prop([String])
  supportingDocuments: string[];

  @Prop([String])
  evidenceFiles: string[];
}

@Schema({ timestamps: true })
export class Arbitration extends Document {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  pincode: string;

  @Prop({ required: true })
  address1: string;

  @Prop()
  address2: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phoneCountryCode: string;

  @Prop({ required: true })
  phone: string;

  @Prop()
  gst: string;

  @Prop()
  pan: string;

  @Prop()
  cin: string;

  @Prop()
  coi: string;

  @Prop()
  panCard: string;

  @Prop()
  gstCert: string;

  @Prop([AdditionalClaimant])
  additionalClaimants: AdditionalClaimant[];

  @Prop([Respondent])
  respondents: Respondent[];

  @Prop({ type: ArbitrationAgreement, required: true })
  arbitrationAgreement: ArbitrationAgreement;

  @Prop({ type: DisputeDetails, required: true })
  disputeDetails: DisputeDetails;

  @Prop({ type: Documents })
  documents: Documents;

  @Prop({ default: 'pending' })
  status: string;

  @Prop()
  caseNumber: string;
}

export const ArbitrationSchema = SchemaFactory.createForClass(Arbitration); 