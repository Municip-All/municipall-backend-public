import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AgentChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  tenant_id?: string;
}
