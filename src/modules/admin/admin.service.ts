import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import * as os from 'os';

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
    await Promise.resolve(); // Satisfy @typescript-eslint/require-await
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

    // We use a raw query or TypeORM's query builder to handle the geometry column with ST_GeomFromGeoJSON
    // If boundary is already a GeoJSON object, we can save it directly if TypeORM is configured for it,
    // but often with PostGIS it's safer to ensure the SRID and conversion.

    const city = this.cityRepository.create({
      id,
      name,
      primaryColor,
      secondaryColor,
      useGradient,
      logoUrl,
      features,
    });

    // Save the basic info first
    const savedCity = await this.cityRepository.save(city);

    // Update the boundary if provided (using raw query for PostGIS compatibility)
    if (boundary) {
      await this.cityRepository.query(
        `UPDATE cities SET boundary = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [JSON.stringify(boundary), id],
      );
    }

    return savedCity;
  }

  async getCityStats() {
    await Promise.resolve(); // Satisfy @typescript-eslint/require-await
    // Mocking stats for now, as User entity doesn't have city link yet
    return [
      { name: 'Paris', users: 12500, agents: 450 },
      { name: 'Lyon', users: 8400, agents: 210 },
      { name: 'Marseille', users: 5200, agents: 180 },
      { name: 'Toulouse', users: 3100, agents: 95 },
    ];
  }
}
