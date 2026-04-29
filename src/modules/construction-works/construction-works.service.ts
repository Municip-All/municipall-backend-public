import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConstructionWork } from './entities/construction-work.entity';

@Injectable()
export class ConstructionWorksService {
  constructor(
    @InjectRepository(ConstructionWork)
    private readonly repository: Repository<ConstructionWork>,
  ) {}

  async findAll(tenantId: string): Promise<ConstructionWork[]> {
    return this.repository.find({
      where: { tenantId },
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: number, tenantId: string): Promise<ConstructionWork> {
    const work = await this.repository.findOne({ where: { id, tenantId } });
    if (!work) throw new NotFoundException('Construction work not found');
    return work;
  }

  async create(tenantId: string, data: Partial<ConstructionWork>): Promise<ConstructionWork> {
    const work = this.repository.create({ ...data, tenantId });
    return this.repository.save(work);
  }

  async update(
    id: number,
    tenantId: string,
    data: Partial<ConstructionWork>,
  ): Promise<ConstructionWork> {
    const work = await this.findOne(id, tenantId);
    Object.assign(work, data);
    return this.repository.save(work);
  }

  async remove(id: number, tenantId: string): Promise<void> {
    const work = await this.findOne(id, tenantId);
    await this.repository.remove(work);
  }
}
