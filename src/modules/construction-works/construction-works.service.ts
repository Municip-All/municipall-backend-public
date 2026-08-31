import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConstructionWork } from './entities/construction-work.entity';
import { CreateConstructionWorkDto } from './dto/create-construction-work.dto';
import { UpdateConstructionWorkDto } from './dto/update-construction-work.dto';

@Injectable()
export class ConstructionWorksService {
  constructor(
    @InjectRepository(ConstructionWork)
    private readonly repository: Repository<ConstructionWork>,
  ) {}

  async findAll(tenantId: string): Promise<ConstructionWork[]> {
    return await this.repository.find({
      where: { tenantId },
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number, tenantId: string): Promise<ConstructionWork> {
    const work = await this.repository.findOne({ where: { id, tenantId } });
    if (!work) throw new NotFoundException('Construction work not found');
    return work;
  }

  async create(tenantId: string, data: CreateConstructionWorkDto): Promise<ConstructionWork> {
    const work = this.repository.create({
      tenantId,
      title: data.title,
      description: data.description,
      locationName: data.locationName,
      status: data.status,
      impactType: data.impactType,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
    return await this.repository.save(work);
  }

  async update(
    id: number,
    tenantId: string,
    data: UpdateConstructionWorkDto,
  ): Promise<ConstructionWork> {
    const work = await this.findOne(id, tenantId);
    if (data.startDate) work.startDate = new Date(data.startDate);
    if (data.endDate) work.endDate = new Date(data.endDate);
    if (data.title) work.title = data.title;
    if (data.description) work.description = data.description;
    if (data.locationName) work.locationName = data.locationName;
    if (data.status) work.status = data.status;
    if (data.impactType) work.impactType = data.impactType;

    return await this.repository.save(work);
  }

  async remove(id: number, tenantId: string): Promise<void> {
    const work = await this.findOne(id, tenantId);
    await this.repository.remove(work);
  }
}
