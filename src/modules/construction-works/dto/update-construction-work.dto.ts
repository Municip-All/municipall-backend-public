import { PartialType } from '@nestjs/swagger';
import { CreateConstructionWorkDto } from './create-construction-work.dto';

export class UpdateConstructionWorkDto extends PartialType(CreateConstructionWorkDto) {}
