import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
  ) {}

  async findAll(cityId: string): Promise<Event[]> {
    return await this.repository.find({
      where: { cityId },
      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: number, cityId: string): Promise<Event> {
    const event = await this.repository.findOneBy({ id, cityId });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async create(cityId: string, data: CreateEventDto): Promise<Event> {
    const event = this.repository.create({
      ...data,
      cityId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
    return await this.repository.save(event);
  }

  async update(id: number, cityId: string, data: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id, cityId);

    const { startDate, endDate, ...rest } = data;

    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);

    Object.assign(event, rest);
    return await this.repository.save(event);
  }

  async remove(id: number, cityId: string): Promise<void> {
    const event = await this.findOne(id, cityId);
    await this.repository.remove(event);
  }
}
