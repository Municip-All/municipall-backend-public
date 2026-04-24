import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private readonly datasource: DataSource) {
    super(User, datasource.createEntityManager());
  }

  async findByMail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.findOne({ where: { id } });
  }

  async CreateUser(userData: Partial<User>): Promise<User> {
    const user = this.create(userData);
    return this.save(user);
  }

  async UpdateUser(userId: number, avatar_Url: string): Promise<User | null> {
    await this.update({ id: userId }, { avatar_url: avatar_Url });
    return this.findOne({ where: { id: userId } });
  }

  async deleteUser(id: number): Promise<void> {
    await this.delete({ id });
  }
}
