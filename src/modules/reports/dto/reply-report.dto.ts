import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyReportDto {
  @ApiProperty({ example: "Pouvez-vous préciser l'emplacement exact ?" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body!: string;
}
