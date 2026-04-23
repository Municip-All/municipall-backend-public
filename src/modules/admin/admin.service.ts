import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import * as os from 'os';

import { Invitation } from './entities/invitation.entity';

export interface CreateCityData {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor?: string;
  useGradient?: boolean;
  logoUrl?: string;
  features?: string[];
  boundary?: unknown;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
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
      satisfaction: 4.8,
    };
  }

  async getSystemStats() {
    await Promise.resolve();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg()[0];
    const cpuCount = os.cpus().length;

    return {
      cpu: {
        load: Math.round((cpuLoad / cpuCount) * 100),
        cores: cpuCount,
      },
      memory: {
        total: Math.round((totalMem / 1024 / 1024 / 1024) * 100) / 100,
        used: Math.round((usedMem / 1024 / 1024 / 1024) * 100) / 100,
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

  async findAllCities() {
    return this.cityRepository.find({
      order: { name: 'ASC' },
    });
  }

  async createCity(data: CreateCityData) {
    const { id, name, primaryColor, secondaryColor, useGradient, logoUrl, features, boundary } =
      data;

    const city = this.cityRepository.create({
      id,
      name,
      primaryColor,
      secondaryColor,
      useGradient,
      logoUrl,
      features,
    });

    const savedCity = await this.cityRepository.save(city);

    if (boundary) {
      await this.cityRepository.query(
        `UPDATE cities SET boundary = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [JSON.stringify(boundary), id],
      );
    }

    return savedCity;
  }

  async updateCity(id: string, data: Partial<CreateCityData>) {
    const { boundary, ...otherData } = data;

    await this.cityRepository.update(id, otherData);

    if (boundary) {
      await this.cityRepository.query(
        `UPDATE cities SET boundary = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [JSON.stringify(boundary), id],
      );
    }

    return this.cityRepository.findOneBy({ id });
  }

  async deleteCity(id: string) {
    return this.cityRepository.delete(id);
  }

  async getCityStats() {
    const cities = await this.cityRepository.find();

    const stats = await Promise.all(
      cities.map(async (city) => {
        const userCount = await this.userRepository.count({
          where: { cityId: city.id, role: 'citizen' },
        });
        const agentCount = await this.userRepository.count({
          where: { cityId: city.id, role: 'agent' },
        });
        const pendingInvites = await this.invitationRepository.count({
          where: { cityId: city.id, status: 'pending' },
        });

        return {
          name: city.name,
          users: userCount,
          agents: agentCount,
          pending: pendingInvites,
        };
      }),
    );

    return stats;
  }

  async getCityAgents(cityId: string) {
    return this.userRepository.find({
      where: { cityId, role: 'agent' },
      order: { created_at: 'DESC' },
    });
  }

  async getCityInvitations(cityId: string) {
    return this.invitationRepository.find({
      where: { cityId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  async forceAcceptInvitation(id: number) {
    const invitation = await this.invitationRepository.findOneBy({ id });
    if (!invitation) return null;

    invitation.status = 'accepted';
    await this.invitationRepository.save(invitation);

    // Create a dummy agent user for testing
    const dummyAgent = this.userRepository.create({
      name: 'Agent',
      surname: 'Test',
      email: invitation.email,
      role: 'agent',
      cityId: invitation.cityId,
      password: 'password123',
    });
    await this.userRepository.save(dummyAgent);

    return dummyAgent;
  }
}
