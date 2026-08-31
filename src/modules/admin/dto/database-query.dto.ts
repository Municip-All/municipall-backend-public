import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DatabaseQueryDto {
  @ApiProperty()
  @IsString()
  query!: string;
}
