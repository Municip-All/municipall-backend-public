import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendTargetedNotificationDto {
  @ApiProperty({ example: 'Travaux sur le réseau' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title!: string;

  @ApiProperty({ example: 'Coupure prévue demain matin dans votre quartier.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  message!: string;

  @ApiProperty({ enum: ['info', 'urgent'], example: 'info' })
  @IsIn(['info', 'urgent'])
  type!: 'info' | 'urgent';

  @ApiProperty({ type: [String], example: ['Centre-ville', 'Nord'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  zones!: string[];

  @ApiProperty({ required: false, example: 'city-1' })
  @IsOptional()
  @IsString()
  cityId?: string;
}
