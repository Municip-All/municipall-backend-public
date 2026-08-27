import { User } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private readonly datasource: DataSource) {
    super(User, datasource.createEntityManager());
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = this.create(userData);
    return this.save(user);
  }
}
