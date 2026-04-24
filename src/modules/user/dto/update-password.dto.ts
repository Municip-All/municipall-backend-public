import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  current!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  new!: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  confirm!: string;
}
