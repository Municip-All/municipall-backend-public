import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(tenantId: string, data: any): Promise<Report> {
    const report = this.reportRepository.create({
      tenantId,
      category: data.category,
      description: data.description,
      imageUrl: data.imageUrl,
      userId: data.userId,
      // Convert lat/lon to PostGIS geometry Point
      location: {
        type: 'Point',
        coordinates: [data.lon, data.lat],
      },
    });

    return this.reportRepository.save(report);
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
    return [];
  }
}
