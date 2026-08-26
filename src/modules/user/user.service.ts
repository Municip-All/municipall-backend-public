import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { mergeNotificationPreferences, NotificationPreferences } from './notification-preferences';

const SALT_ROUNDS = 12;

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
    if (!user) throw new NotFoundException('User not found');
    user.avatar_url = avatarUrl;
    return this.userRepository.save(user);
  }

  async updateProfile(userId: number, profileData: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Only allow updating certain fields
    if (profileData.name) user.name = profileData.name;
    if (profileData.surname) user.surname = profileData.surname;
    if (profileData.email) user.email = profileData.email;
    if (profileData.neighborhood) user.neighborhood = profileData.neighborhood;
    if (profileData.cityId) user.cityId = profileData.cityId;

    return this.userRepository.save(user);
  }

  async updatePassword(
    userId: number,
    passwordData: { current: string; new: string; confirm: string },
  ): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (passwordData.new !== passwordData.confirm) {
      throw new BadRequestException(
        'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
      );
    }

    const isMatch = await bcrypt.compare(passwordData.current, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password incorrect');
    }

    user.password = await bcrypt.hash(passwordData.new, SALT_ROUNDS);
    return this.userRepository.save(user);
  }

  async updatePushToken(userId: number, expoPushToken: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.expoPushToken = expoPushToken;
    return this.userRepository.save(user);
  }

  async getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    return mergeNotificationPreferences(user.preferences);
  }

  async updateNotificationPreferences(
    userId: number,
    dto: UpdatePreferencesDto,
  ): Promise<NotificationPreferences> {
    const user = await this.findById(userId);
    if (!user) throw new BadRequestException('User not found');

    const current = mergeNotificationPreferences(user.preferences);
    const next: NotificationPreferences = {
      moderationAlerts: dto.moderationAlerts ?? current.moderationAlerts,
      weeklyReports: dto.weeklyReports ?? current.weeklyReports,
      citizenEngagement: dto.citizenEngagement ?? current.citizenEngagement,
      systemMaintenance: dto.systemMaintenance ?? current.systemMaintenance,
      contactInbox: dto.contactInbox ?? current.contactInbox,
      teamActivity: dto.teamActivity ?? current.teamActivity,
    };

    user.preferences = next as unknown as Record<string, unknown>;
    await this.userRepository.save(user);
    return next;
  }

  async getStats(userId: number): Promise<{
    reports: number;
    participations: number;
    points: number;
  }> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');

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

  async create(userData: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(userData);
    return this.userRepository.save(newUser);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete({ id });
  }
}
