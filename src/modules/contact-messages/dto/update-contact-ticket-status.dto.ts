import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateContactTicketStatusDto {
  @ApiProperty({ example: 'Retenue' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  status!: string;
}
