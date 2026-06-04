import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { User } from '../user/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(tenantId: string, data: CreateReportDto): Promise<Report> {
    const lat = Number(data.lat);
    const lon = Number(data.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new BadRequestException('Latitude et longitude sont requises.');
    }

    let isResident = true;
    if (data.userId) {
      const user = await this.reportRepository.manager.findOne(User, {
        where: { id: data.userId },
        select: ['cityId'],
      });

      if (user?.cityId) {
        isResident = user.cityId === tenantId;
      } else {
        isResident = false;
      }
    }

    const insertResult = await this.reportRepository
      .createQueryBuilder()
      .insert()
      .into(Report)
      .values({
        tenantId,
        category: data.category,
        description: data.description,
        imageUrl: data.imageUrl,
        userId: data.userId,
        status: data.status ?? 'En attente',
        isResident,
        location: () => `ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`,
      })
      .returning('id')
      .execute();

    const rawId = insertResult.raw[0]?.id ?? insertResult.identifiers[0]?.id;
    const id = Number(rawId);
    if (!Number.isFinite(id)) {
      throw new BadRequestException('Échec de la création du signalement.');
    }

    const savedReport = await this.reportRepository.findOneByOrFail({ id });

    if (data.userId) {
      try {
        await this.reportRepository.manager.increment('User', { id: data.userId }, 'points', 10);
      } catch (error) {
        console.error('Failed to award points to user:', error);
      }
    }

    return savedReport;
  }

  async findAll(tenantId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string): Promise<Report> {
    const report = await this.reportRepository.findOneBy({ id });
    if (report) {
      report.status = status;
      return this.reportRepository.save(report);
    }
    throw new BadRequestException('Report not found');
  }

  isInsideBoundary(_longitude: number, _latitude: number, _cityBoundary: any): boolean {
    return true;
  }

  async getClusteredReports(_bounds: any) {
    return await Promise.resolve([]);
  }
}
