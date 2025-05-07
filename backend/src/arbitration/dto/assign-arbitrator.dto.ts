import { IsNotEmpty, IsString } from 'class-validator';

export class AssignArbitratorDto {
  @IsNotEmpty()
  @IsString()
  arbitratorId: string;
}