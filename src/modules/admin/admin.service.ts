import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import * as os from 'os';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
  ) {}

  async getBusinessStats() {
    const totalUsers = await this.userRepository.count();
    const agents = await this.userRepository.count({ where: { role: 'agent' } });
    const citizens = await this.userRepository.count({ where: { role: 'citizen' } });
    const cities = await this.cityRepository.count();

    return {
      cities,
      users: totalUsers,
      agents,
      citizens,
      satisfaction: 4.8, // Mocked for now, until we have a feedback table
    };
  }

  async getSystemStats() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg()[0]; // 1 minute load average
    const cpuCount = os.cpus().length;

    return {
      cpu: {
        load: Math.round((cpuLoad / cpuCount) * 100),
        cores: cpuCount,
      },
      memory: {
        total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
        used: Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100,
        percentage: Math.round((usedMem / totalMem) * 100),
      },
      uptime: os.uptime(),
      platform: os.platform(),
    };
  }

  async findAllUsers() {
    return this.userRepository.find({
      order: { created_at: 'DESC' },
    });
  }
}
