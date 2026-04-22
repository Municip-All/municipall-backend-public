import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DockerService } from './docker.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dockerService: DockerService,
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
}
