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
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events for the current city' })
  async findAll(@Req() req: Request & { tenantId?: string }) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.findAll(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new event' })
  async create(@Req() req: Request & { tenantId?: string }, @Body() data: CreateEventDto) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.create(tenantId, data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update an event' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { tenantId?: string },
    @Body() data: UpdateEventDto,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.update(id, tenantId, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete an event' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { tenantId?: string }) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.remove(id, tenantId);
  }
}
