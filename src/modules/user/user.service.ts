import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateAvatar(userId: number, avatarUrl: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    user.avatar_url = avatarUrl;
    return this.userRepository.save(user);
  }

  async updateProfile(userId: number, profileData: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    // Only allow updating certain fields
    if (profileData.name) user.name = profileData.name;
    if (profileData.surname) user.surname = profileData.surname;
    if (profileData.email) user.email = profileData.email;
    if (profileData.neighborhood) user.neighborhood = profileData.neighborhood;

    return this.userRepository.save(user);
  }

  async updatePassword(
    userId: number,
    passwordData: { current: string; new: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.password !== passwordData.current) {
      throw new Error('Current password incorrect');
    }

    user.password = passwordData.new;
    return this.userRepository.save(user);
  }

  async getStats(userId: number): Promise<any> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    // Use the entityManager directly to count reports
    const reports = await this.userRepository.manager.count('Report', {
      where: { userId: userId },
    });

    return {
      reports: reports || 0,
      participations: 0, // To be implemented with events
      points: user.points || 0,
    };
  }

  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete({ id });
  }
}
