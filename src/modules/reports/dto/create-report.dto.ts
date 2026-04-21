import { ApiProperty } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ description: 'Category of the report', example: 'Voirie' })
  category!: string;

  @ApiProperty({ description: 'Description of the problem', example: 'Nid de poule sur la chaussée' })
  description?: string;

  @ApiProperty({ description: 'URL of the evidence image', example: 'https://example.com/image.jpg', required: false })
  imageUrl?: string;

  @ApiProperty({ description: 'User ID (optional)', example: 1, required: false })
  userId?: number;

  @ApiProperty({ description: 'Longitude', example: 2.3522 })
  lon!: number;

  @ApiProperty({ description: 'Latitude', example: 48.8566 })
  lat!: number;

  @ApiProperty({ description: 'Status (optional)', example: 'En attente', required: false })
  status?: string;
}
