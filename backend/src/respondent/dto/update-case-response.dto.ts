import { PartialType } from '@nestjs/mapped-types';
import { CreateCaseResponseDto } from './create-case-response.dto';

export class UpdateCaseResponseDto extends PartialType(CreateCaseResponseDto) {
  // This class automatically inherits all properties from CreateCaseResponseDto
  // but makes them optional using PartialType
} 