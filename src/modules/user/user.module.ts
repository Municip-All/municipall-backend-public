import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserServices } from './user.services';
import { UserRepository } from './user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserServices, UserRepository],
  exports: [UserServices],
})
export class UserModule {}
