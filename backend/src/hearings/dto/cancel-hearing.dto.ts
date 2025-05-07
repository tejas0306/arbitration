import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelHearingDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  reason: string;
}