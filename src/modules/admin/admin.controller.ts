import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AdminService, CreateCityData } from './admin.service';
import { DockerService } from './docker.service';
import { DatabaseService } from './database.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dockerService: DockerService,
    private readonly databaseService: DatabaseService,
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

  @Get('cities/stats')
  async getCityStats() {
    const stats = await this.adminService.getCityStats();
    return {
      success: true,
      data: stats,
    };
  }
}
