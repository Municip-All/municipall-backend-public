import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ConstructionWorksService } from './construction-works.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { CreateConstructionWorkDto } from './dto/create-construction-work.dto';
import { UpdateConstructionWorkDto } from './dto/update-construction-work.dto';

@ApiTags('construction-works')
@Controller('construction-works')
export class ConstructionWorksController {
  constructor(private readonly service: ConstructionWorksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all construction works for the current city' })
  async findAll(@Req() req: Request & { tenantId?: string }) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.findAll(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new construction work' })
  async create(
    @Req() req: Request & { tenantId?: string },
    @Body() data: CreateConstructionWorkDto,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.create(tenantId, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a construction work' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { tenantId?: string },
    @Body() data: UpdateConstructionWorkDto,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.update(id, tenantId, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a construction work' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { tenantId?: string }) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.remove(id, tenantId);
  }
}
