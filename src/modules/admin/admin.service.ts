import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../user/user.entity';
import { City } from '../city-config/entities/city.entity';
import * as os from 'os';
import { CanonicalRole } from '../../core/auth/permissions';
import { AuditService } from '../audit/audit.service';
import { FeedbackService } from '../feedback/feedback.service';

import { Invitation } from './entities/invitation.entity';
import { UpdateAdminUserDto } from './dto/update-user.dto';
import { UpdateCityDto } from '../city-config/dto/update-city.dto';
import { CreateCityDto } from './dto/create-city.dto';

const SALT_ROUNDS = 12;

const USER_PUBLIC_FIELDS = [
  'id',
  'name',
  'surname',
  'email',
  'role',
  'avatar_url',
  'cityId',
  'points',
  'neighborhood',
  'created_at',
  'update_at',
] as const;

export type PublicUser = Pick<User, (typeof USER_PUBLIC_FIELDS)[number]>;

function sanitizeUser(user: User): PublicUser {
  const sanitized = {} as PublicUser;
  for (const key of USER_PUBLIC_FIELDS) {
    (sanitized as Record<string, unknown>)[key] = user[key];
  }
  return sanitized;
}

function normalizeAssignableRole(role: string): CanonicalRole {
  const n = role.trim().toLowerCase();
  if (n === 'mayor' || n === 'maire') return CanonicalRole.MAYOR;
  if (n === 'assistant' || n === 'conseiller') return CanonicalRole.ASSISTANT;
  if (n === 'agent') return CanonicalRole.AGENT;
  if (n === 'citizen' || n === 'citoyen') return CanonicalRole.CITIZEN;
  throw new BadRequestException(`Rôle non autorisé : ${role}`);
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private readonly auditService: AuditService,
    private readonly feedbackService: FeedbackService,
  ) {}

  async getBusinessStats() {
    const totalUsers = await this.userRepository.count();
    const agents = await this.userRepository.count({ where: { role: 'agent' } });
    const citizens = await this.userRepository.count({ where: { role: 'citizen' } });
    const cities = await this.cityRepository.count();

    let satisfaction = 0;
    try {
      const allFeedbacks = await this.feedbackService.listForMayor('', 10000);
      if (allFeedbacks.length > 0) {
        const avg = allFeedbacks.reduce((sum, f) => sum + f.stars, 0) / allFeedbacks.length;
        satisfaction = Math.round((avg / 5) * 100) / 100;
      }
    } catch {
      satisfaction = 0;
    }

    return {
      cities,
      users: totalUsers,
      agents,
      citizens,
      satisfaction,
    };
  }

  async getSystemStats() {
    await Promise.resolve();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg()[0];
    const cpuCount = os.cpus().length;

    return {
      cpu: {
        load: Math.round((cpuLoad / cpuCount) * 100),
        cores: cpuCount,
      },
      memory: {
        total: Math.round((totalMem / 1024 / 1024 / 1024) * 100) / 100,
        used: Math.round((usedMem / 1024 / 1024 / 1024) * 100) / 100,
        percentage: Math.round((usedMem / totalMem) * 100),
      },
      uptime: os.uptime(),
      platform: os.platform(),
    };
  }

  async findAllUsers(): Promise<PublicUser[]> {
    const users = await this.userRepository.find({
      select: [...USER_PUBLIC_FIELDS],
      order: { created_at: 'DESC' },
    });
    return users;
  }

  async findUserById(id: number): Promise<PublicUser> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [...USER_PUBLIC_FIELDS],
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return user;
  }

  async updateUser(id: number, dto: UpdateAdminUserDto): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    const before = {
      role: user.role,
      cityId: user.cityId,
      email: user.email,
    };

    if (dto.name !== undefined) user.name = dto.name.trim();
    if (dto.surname !== undefined) user.surname = dto.surname.trim();
    if (dto.role !== undefined) {
      user.role = normalizeAssignableRole(dto.role);
    }
    if (dto.cityId !== undefined) {
      const cityId = dto.cityId.trim() || undefined;
      if (cityId) {
        const city = await this.cityRepository.findOne({ where: { id: cityId } });
        if (!city) {
          throw new BadRequestException('Ville introuvable.');
        }
      }
      user.cityId = cityId;
    }
    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    }

    const staffRoles = [CanonicalRole.MAYOR, CanonicalRole.ASSISTANT, CanonicalRole.AGENT];
    if (staffRoles.includes(user.role as CanonicalRole) && !user.cityId) {
      throw new BadRequestException(
        'Un compte staff (maire, assistant ou agent) doit être rattaché à une ville.',
      );
    }

    await this.userRepository.save(user);

    await this.auditService.log({
      tenantId: user.cityId ?? 'platform',
      userId: 0,
      action: 'admin.user_updated',
      resourceType: 'user',
      resourceId: user.id,
      metadata: {
        before,
        after: {
          role: user.role,
          cityId: user.cityId,
          passwordReset: Boolean(dto.password),
        },
      },
    });

    return sanitizeUser(user);
  }

  async deleteUser(id: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    await this.auditService.log({
      tenantId: user.cityId ?? 'platform',
      userId: 0,
      action: 'admin.user_deleted',
      resourceType: 'user',
      resourceId: user.id,
      metadata: {
        email: user.email,
        role: user.role,
        cityId: user.cityId,
      },
    });

    await this.userRepository.remove(user);
  }

  async findAllCities() {
    try {
      return await this.cityRepository.find({
        order: { name: 'ASC' },
      });
    } catch (error) {
      this.logger.error('[DATABASE ERROR] Failed to fetch cities:', error);
      // Fallback: try to fetch without geometry/json fields if they are corrupted
      try {
        return await this.cityRepository.find({
          select: [
            'id',
            'name',
            'primaryColor',
            'secondaryColor',
            'useGradient',
            'logoUrl',
            'features',
            'dataRetentionPolicy',
          ],
          order: { name: 'ASC' },
        });
      } catch (innerError) {
        this.logger.error('[DATABASE ERROR] Fatal city fetch error:', innerError);
        return [];
      }
    }
  }

  async createCity(data: CreateCityDto) {
    const {
      id,
      name,
      primaryColor,
      secondaryColor,
      useGradient,
      logoUrl,
      features,
      boundary,
      neighborhoods,
      dataRetentionPolicy,
      contactEmail,
      contactPhone,
      contactHelpText,
      contractNumber,
      contractSignedAt,
      contractNotes,
      municipalityContactName,
      municipalityContactRole,
      municipalityContactEmail,
      municipalityContactPhone,
      assignedTechName,
      assignedTechEmail,
      salesRepName,
      salesRepEmail,
      integrationType,
      isTransportFeatureAllowed,
    } = data;

    const city = this.cityRepository.create({
      id,
      name,
      officialName: name,
      primaryColor,
      secondaryColor,
      useGradient,
      logoUrl,
      features,
      neighborhoods,
      dataRetentionPolicy,
      contactEmail,
      contactPhone,
      contactHelpText,
      contractNumber,
      contractSignedAt,
      contractNotes,
      municipalityContactName,
      municipalityContactRole,
      municipalityContactEmail,
      municipalityContactPhone,
      assignedTechName,
      assignedTechEmail,
      salesRepName,
      salesRepEmail,
      integrationType: integrationType ?? 'mobile_app',
      isTransportFeatureAllowed: isTransportFeatureAllowed ?? false,
      isTransportFeatureEnabled: false,
    });

    const savedCity = await this.cityRepository.save(city);

    if (boundary) {
      await this.cityRepository.query(
        `UPDATE cities SET boundary = ST_GeomFromGeoJSON($1) WHERE id = $2`,
        [JSON.stringify(boundary), id],
      );
    }

    return savedCity;
  }

  async updateCity(id: string, data: UpdateCityDto) {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.dataRetentionPolicy !== undefined)
      updateData.data_retention_policy = data.dataRetentionPolicy;
    if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail;
    if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone;
    if (data.contactHelpText !== undefined) updateData.contact_help_text = data.contactHelpText;
    if (data.primaryColor !== undefined) updateData.primary_color = data.primaryColor;
    if (data.secondaryColor !== undefined) updateData.secondary_color = data.secondaryColor;
    if (data.useGradient !== undefined) updateData.use_gradient = data.useGradient;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
    if (data.backgroundColorLight !== undefined)
      updateData.background_color_light = data.backgroundColorLight;
    if (data.backgroundColorDark !== undefined)
      updateData.background_color_dark = data.backgroundColorDark;
    if (data.neighborhoods !== undefined) updateData.neighborhoods = data.neighborhoods;
    if (data.wasteConfig !== undefined) updateData.waste_config = data.wasteConfig;
    if (data.isTransportFeatureEnabled !== undefined)
      updateData.is_transport_feature_enabled = data.isTransportFeatureEnabled;
    if (data.associations !== undefined) updateData.associations = data.associations;
    if (data.publicProfile !== undefined) updateData.public_profile = data.publicProfile;

    await this.cityRepository.update(id, updateData);

    return await this.cityRepository.findOneBy({ id });
  }

  async deleteCity(id: string) {
    return await this.cityRepository.delete(id);
  }

  async getCityStats() {
    const cities = await this.cityRepository.find();

    const stats = await Promise.all(
      cities.map(async (city) => {
        const userCount = await this.userRepository.count({
          where: { cityId: city.id, role: 'citizen' },
        });
        const agentCount = await this.userRepository.count({
          where: { cityId: city.id, role: 'agent' },
        });
        const pendingInvites = await this.invitationRepository.count({
          where: { cityId: city.id, status: 'pending' },
        });

        return {
          name: city.name,
          users: userCount,
          agents: agentCount,
          pending: pendingInvites,
        };
      }),
    );

    return stats;
  }

  async getCityAgents(cityId: string) {
    const staff = await this.userRepository.find({
      where: { cityId },
      order: { created_at: 'DESC' },
    });
    const staffRoles = new Set(['mayor', 'maire', 'mairie', 'assistant', 'agent', 'conseiller']);
    return staff.filter((u) => {
      const r = u.role.toLowerCase();
      return staffRoles.has(r) || r.startsWith('agent');
    });
  }

  async getCityInvitations(cityId: string) {
    return await this.invitationRepository.find({
      where: { cityId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelInvitation(id: number): Promise<void> {
    const invitation = await this.invitationRepository.findOneBy({ id });
    if (!invitation) {
      throw new NotFoundException('Invitation introuvable.');
    }
    if (invitation.status !== 'pending') {
      throw new BadRequestException('Seules les invitations en attente peuvent être annulées.');
    }
    await this.invitationRepository.delete(id);
  }

  async forceAcceptInvitation(id: number) {
    const invitation = await this.invitationRepository.findOneBy({ id });
    if (!invitation) return null;

    invitation.status = 'accepted';
    await this.invitationRepository.save(invitation);

    // Create a dummy agent user for testing
    const dummyAgent = this.userRepository.create({
      name: invitation.name ?? 'Agent',
      surname: 'Municipall',
      email: invitation.email,
      role: invitation.role ?? 'assistant',
      cityId: invitation.cityId,
      password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), SALT_ROUNDS),
    });
    await this.userRepository.save(dummyAgent);

    return dummyAgent;
  }

  async getRecentActivity() {
    const lastUsers = await this.userRepository.find({
      order: { created_at: 'DESC' },
      take: 5,
    });

    const lastCities = await this.cityRepository.find({
      order: { createdAt: 'DESC' },
      take: 3,
    });

    const activities = [
      ...lastUsers.map((u) => ({
        type: u.role === 'agent' ? 'agent' : 'user',
        text:
          u.role === 'agent'
            ? `Nouvel agent : ${u.name} ${u.surname}`
            : `Nouveau citoyen : ${u.name} ${u.surname}`,
        time: u.created_at,
        cityId: u.cityId,
      })),
      ...lastCities.map((c) => ({
        type: 'city',
        text: `Nouvelle ville partenaire : ${c.name}`,
        time: c.createdAt,
        cityId: c.id,
      })),
    ];

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }
}
