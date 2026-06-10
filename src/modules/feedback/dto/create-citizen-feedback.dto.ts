import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCitizenFeedbackDto {
  @ApiProperty({ enum: ['report', 'contact_ticket'] })
  @IsIn(['report', 'contact_ticket'])
  resourceType!: 'report' | 'contact_ticket';

  @ApiProperty()
  @IsInt()
  @Min(1)
  resourceId!: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message?: string;
}
