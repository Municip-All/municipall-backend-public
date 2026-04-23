import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { AdminService, CreateCityData } from './admin.service';
import { DockerService } from './docker.service';
import { DatabaseService } from './database.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { Repository } from 'typeorm';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dockerService: DockerService,
    private readonly databaseService: DatabaseService,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
  ) {}

  @Get('stats')
  async getStats() {
    const business = await this.adminService.getBusinessStats();
    const system = await this.adminService.getSystemStats();

    return {
      success: true,
      data: {
        business,
        system,
      },
    };
  }

  @Get('users')
  async getUsers() {
    const users = await this.adminService.findAllUsers();
    return {
      success: true,
      data: users,
    };
  }

  @Get('docker')
  async getDockerStats() {
    const containers = await this.dockerService.getContainers();
    return {
      success: true,
      data: containers,
    };
  }

  // DATABASE EXPLORER ENDPOINTS
  @Get('database/tables')
  async getTables() {
    const tables = await this.databaseService.getTables();
    return {
      success: true,
      data: tables,
    };
  }

  @Get('database/tables/:name')
  async getTableData(
    @Param('name') name: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const data = await this.databaseService.getTableData(name, parsedLimit, parsedOffset);
    return {
      success: true,
      data,
    };
  }

  @Post('database/query')
  async executeQuery(@Body('query') query: string) {
    if (!query) {
      return { success: false, error: 'Query is required' };
    }
    const result = await this.databaseService.executeQuery(query);
    if (result && typeof result === 'object' && 'error' in result) {
      return { success: false, error: (result as { error: string }).error };
    }
    return {
      success: true,
      data: result,
    };
  }

  @Get('cities')
  async getCities() {
    const cities = await this.adminService.findAllCities();
    return {
      success: true,
      data: cities,
    };
  }

  @Post('cities')
  async createCity(@Body() data: CreateCityData) {
    const city = await this.adminService.createCity(data);
    return {
      success: true,
      data: city,
    };
  }

  @Patch('cities/:id')
  async updateCity(@Param('id') id: string, @Body() data: Partial<CreateCityData>) {
    const city = await this.adminService.updateCity(id, data);
    return {
      success: true,
      data: city,
    };
  }

  @Delete('cities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCity(@Param('id') id: string) {
    await this.adminService.deleteCity(id);
  }

  @Get('cities/stats')
  async getCityStats() {
    const stats = await this.adminService.getCityStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('cities/:id/agents')
  async getCityAgents(@Param('id') id: string) {
    const agents = await this.adminService.getCityAgents(id);
    return {
      success: true,
      data: agents,
    };
  }

  @Get('cities/:id/invitations')
  async getCityInvitations(@Param('id') id: string) {
    const invitations = await this.adminService.getCityInvitations(id);
    return {
      success: true,
      data: invitations,
    };
  }

  @Post('cities/:id/invitations')
  async createInvitation(@Param('id') cityId: string, @Body('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');

    const invitation = this.invitationRepository.create({
      email,
      cityId,
      status: 'pending',
      token: Math.random().toString(36).substring(7), // Simple token for demo
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await this.invitationRepository.save(invitation);

    return {
      success: true,
      data: invitation,
    };
  }

  @Post('invitations/:id/force-accept')
  async forceAcceptInvitation(@Param('id', ParseIntPipe) id: number) {
    const agent = await this.adminService.forceAcceptInvitation(id);
    if (!agent) throw new NotFoundException('Invitation not found');
    return {
      success: true,
      data: agent,
    };
  }
}
