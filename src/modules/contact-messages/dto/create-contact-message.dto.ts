import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Question sur les horaires' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @ApiProperty({ example: "Bonjour, je souhaiterais connaître les horaires d'ouverture..." })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  body!: string;
}
