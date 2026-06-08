import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { EventsService } from './events.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Public } from '../../core/decorators/public.decorator';
import { RequirePermissions } from '../../core/decorators/require-permissions.decorator';
import { Permission } from '../../core/auth/permissions';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all events for the current city' })
  async findAll(@Req() req: Request & { tenantId?: string }) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.findAll(tenantId);
  }

  @RequirePermissions(Permission.EVENTS_MANAGE)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  async create(@Req() req: Request & { tenantId?: string }, @Body() data: CreateEventDto) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.create(tenantId, data);
  }

  @RequirePermissions(Permission.EVENTS_MANAGE)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { tenantId?: string },
    @Body() data: UpdateEventDto,
  ) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.update(id, tenantId, data);
  }

  @RequirePermissions(Permission.EVENTS_MANAGE)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request & { tenantId?: string }) {
    const tenantId = req.tenantId ?? 'city-1';
    return this.service.remove(id, tenantId);
  }
}
