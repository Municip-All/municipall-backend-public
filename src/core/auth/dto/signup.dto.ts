import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsOptional()
  surname?: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: '0612345678' })
  @IsString()
  @IsOptional()
  phone?: string;
}
