import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactMessagesService {
  constructor(
    @InjectRepository(ContactMessage)
    private readonly repository: Repository<ContactMessage>,
  ) {}

  async create(
    tenantId: string,
    userId: number,
    data: CreateContactMessageDto,
  ): Promise<ContactMessage> {
    const message = this.repository.create({
      tenantId,
      userId,
      subject: data.subject.trim(),
      body: data.body.trim(),
      status: 'En attente',
    });
    return this.repository.save(message);
  }

  async findByUser(tenantId: string, userId: number): Promise<ContactMessage[]> {
    return this.repository.find({
      where: { tenantId, userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async findAllForTenant(tenantId: string): Promise<ContactMessage[]> {
    return this.repository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async updateStatus(id: number, tenantId: string, status: string): Promise<ContactMessage> {
    const message = await this.repository.findOne({ where: { id, tenantId } });
    if (!message) {
      throw new NotFoundException('Message introuvable');
    }
    message.status = status;
    return this.repository.save(message);
  }
}
