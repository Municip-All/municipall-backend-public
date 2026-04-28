import { Injectable } from '@nestjs/common';
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
    const report = this.reportRepository.create({
      tenantId,
      category: data.category,
      description: data.description,
      imageUrl: data.imageUrl,
      userId: data.userId,
      location: {
        type: 'Point',
        coordinates: [data.lon, data.lat],
      },
    });

    // Check if the user is a resident of this city
    if (data.userId) {
      const user = await this.reportRepository.manager.findOne(User, {
        where: { id: data.userId },
        select: ['cityId'],
      });

      if (user && user.cityId) {
        report.isResident = user.cityId === tenantId;
      } else {
        report.isResident = false; // Unknown user or no resident city set
      }
    }

    const savedReport = await this.reportRepository.save(report);

    // Award points to the user (e.g., 10 points per report)
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
    throw new Error('Report not found');
  }

  isInsideBoundary(_longitude: number, _latitude: number, _cityBoundary: any): boolean {
    // Spatial logic can be implemented here using ST_Contains if needed
    return true;
  }

  async getClusteredReports(_bounds: any) {
    // Placeholder for advanced geospatial clustering logic
    return await Promise.resolve([]);
  }
}
