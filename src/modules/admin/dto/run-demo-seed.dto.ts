import { IsBoolean, IsOptional } from 'class-validator';

export class RunDemoSeedDto {
  @IsOptional()
  @IsBoolean()
  reset?: boolean;
}
