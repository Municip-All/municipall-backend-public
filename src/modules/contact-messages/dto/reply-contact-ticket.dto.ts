import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class ReplyContactTicketDto {
  @ApiProperty({ example: 'Merci pour votre message, nous traitons votre demande.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  body!: string;
}
