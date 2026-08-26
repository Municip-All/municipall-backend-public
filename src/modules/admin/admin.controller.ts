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
  ParseIntPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { AdminService, CreateCityData } from './admin.service';
import { DockerService } from './docker.service';
import { DatabaseService } from './database.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { Repository } from 'typeorm';
import { Public } from '../../core/decorators/public.decorator';
import { PlatformAdminGuard } from '../../core/guards/platform-admin.guard';
import { randomBytes } from 'crypto';
import { StaffService } from '../staff/staff.service';
import { CreateMayorDto } from '../staff/dto/create-staff-invitation.dto';
import { UpdateAdminUserDto } from './dto/update-user.dto';
import { DemoSeedService } from './demo-seed.service';
import { RunDemoSeedDto } from './dto/run-demo-seed.dto';
import { DatabaseQueryDto } from './dto/database-query.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Public()
@UseGuards(PlatformAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dockerService: DockerService,
    private readonly databaseService: DatabaseService,
    private readonly staffService: StaffService,
    private readonly demoSeedService: DemoSeedService,
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

  @Get('users/:id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.adminService.findUserById(id);
    return {
      success: true,
      data: user,
    };
  }

  @Patch('users/:id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateAdminUserDto) {
    const user = await this.adminService.updateUser(id, body);
    return {
      success: true,
      data: user,
    };
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    await this.adminService.deleteUser(id);
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
  async executeQuery(@Body() body: DatabaseQueryDto) {
    const query = body.query;
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
  async createCity(@Body() data: CreateCityDto) {
    const city = await this.adminService.createCity(data as CreateCityData);
    return {
      success: true,
      data: city,
    };
  }

  @Patch('cities/:id')
  async updateCity(@Param('id') id: string, @Body() data: Partial<CreateCityDto>) {
    const city = await this.adminService.updateCity(id, data as Partial<CreateCityData>);
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

  @Post('cities/:id/mayor')
  async createMayor(@Param('id') cityId: string, @Body() body: CreateMayorDto) {
    const mayor = await this.staffService.createMayor({ ...body, cityId });
    return { success: true, data: mayor };
  }

  @Post('cities/:id/invitations')
  async createInvitation(@Param('id') cityId: string, @Body() body: CreateInvitationDto) {
    const invitation = this.invitationRepository.create({
      email: body.email,
      name: body.name,
      cityId,
      role: body.role ?? 'assistant',
      status: 'pending',
      token: randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    await this.invitationRepository.save(invitation);

    return {
      success: true,
      data: invitation,
    };
  }

  @Get('activity')
  async getActivity() {
    const activity = await this.adminService.getRecentActivity();
    return {
      success: true,
      data: activity,
    };
  }

  @Get('demo/seed/status')
  getDemoSeedStatus() {
    return {
      success: true,
      data: {
        enabled: this.demoSeedService.isEnabled(),
      },
    };
  }

  @Post('demo/seed')
  async runDemoSeed(@Body() body: RunDemoSeedDto) {
    const result = await this.demoSeedService.runSeed({ reset: body.reset });
    return {
      success: true,
      data: result,
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
