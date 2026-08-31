import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { Invitation } from '../admin/entities/invitation.entity';
import { AuditService } from '../audit/audit.service';
import { CanonicalRole, normalizeToCanonicalRole } from '../../core/auth/permissions';
import { Report } from '../reports/entities/report.entity';
import { City } from '../city-config/entities/city.entity';
import { AuthService } from '../../core/auth/auth.service';

export interface TeamMemberView {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AgentKpiView {
  userId: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  reportsHandled: number;
  messagesSent: number;
  contactReplies: number;
  ticketsClosed: number;
  reportsResolved: number;
  resolutionRate: number;
  avgFirstResponseHours: number | null;
  satisfactionScore: number | null;
}

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
  ) {}

  async getInvitationPreview(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
    });
    if (!invitation) {
      throw new NotFoundException('Invitation introuvable.');
    }

    const city = await this.cityRepository.findOne({
      where: { id: invitation.cityId },
      select: ['name'],
    });

    const expired =
      invitation.status === 'expired' ||
      (invitation.expiresAt != null && invitation.expiresAt < new Date());

    return {
      email: invitation.email,
      suggestedName: invitation.name,
      role: invitation.role,
      cityId: invitation.cityId,
      cityName: city?.name ?? invitation.cityId,
      status: expired ? 'expired' : invitation.status,
      expiresAt: invitation.expiresAt?.toISOString(),
    };
  }

  async listTeam(tenantId: string): Promise<TeamMemberView[]> {
    const users = await this.userRepository.find({
      where: { cityId: tenantId },
      order: { created_at: 'DESC' },
    });

    return users
      .filter((u) => {
        const c = normalizeToCanonicalRole(u.role);
        return (
          c === CanonicalRole.MAYOR || c === CanonicalRole.ASSISTANT || c === CanonicalRole.AGENT
        );
      })
      .map((u) => ({
        id: u.id,
        name: u.name,
        surname: u.surname || '',
        email: u.email,
        role: u.role,
        createdAt: u.created_at.toISOString(),
      }));
  }

  async createInvitation(
    tenantId: string,
    invitedById: number,
    data: { email: string; name: string; role: 'assistant' | 'agent' },
  ) {
    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cet e-mail.');
    }

    const token = randomBytes(32).toString('hex');
    const invitation = this.invitationRepository.create({
      email: data.email,
      name: data.name,
      cityId: tenantId,
      role: data.role,
      invitedById,
      status: 'pending',
      token,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    await this.invitationRepository.save(invitation);

    await this.auditService.log({
      tenantId,
      userId: invitedById,
      action: 'team.invitation_created',
      resourceType: 'invitation',
      resourceId: invitation.id,
      metadata: { email: data.email, role: data.role },
    });

    return {
      id: invitation.id,
      email: invitation.email,
      name: invitation.name,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt?.toISOString(),
      acceptPath: `/invite/${token}`,
    };
  }

  async acceptInvitation(data: { token: string; name: string; surname: string; password: string }) {
    const invitation = await this.invitationRepository.findOne({
      where: { token: data.token, status: 'pending' },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation invalide ou déjà utilisée.');
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Cette invitation a expiré.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = this.userRepository.create({
      email: invitation.email,
      name: data.name,
      surname: data.surname,
      password: hashedPassword,
      role: invitation.role,
      cityId: invitation.cityId,
    });

    await this.userRepository.save(user);
    invitation.status = 'accepted';
    await this.invitationRepository.save(invitation);

    await this.auditService.log({
      tenantId: invitation.cityId,
      userId: user.id,
      action: 'team.invitation_accepted',
      resourceType: 'invitation',
      resourceId: invitation.id,
    });

    return await this.authService.login(user, { backofficeOnly: true });
  }

  async createMayor(data: {
    email: string;
    name: string;
    surname: string;
    password: string;
    cityId: string;
  }) {
    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cet e-mail.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const mayor = this.userRepository.create({
      email: data.email,
      name: data.name,
      surname: data.surname,
      password: hashedPassword,
      role: CanonicalRole.MAYOR,
      cityId: data.cityId,
    });

    await this.userRepository.save(mayor);
    return {
      id: mayor.id,
      email: mayor.email,
      role: mayor.role,
      cityId: mayor.cityId,
    };
  }

  async getTeamKpis(tenantId: string, days = 30): Promise<AgentKpiView[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const team = await this.listTeam(tenantId);
    const aggregates = await this.auditService.aggregateTeamKpis(tenantId, since);

    const resolvedByUser: Array<{ user_id: string; count: string }> =
      await this.reportRepository.query(
        `
        SELECT al.user_id, COUNT(DISTINCT al.resource_id)::text AS count
        FROM audit_logs al
        WHERE al.tenant_id = $1
          AND al.created_at >= $2
          AND al.action = 'report.status_updated'
          AND (al.metadata->>'status') IN ('Résolu', 'Clôturé')
        GROUP BY al.user_id
        `,
        [tenantId, since],
      );

    const resolvedMap = new Map(resolvedByUser.map((r) => [Number(r.user_id), Number(r.count)]));

    return team.map((member) => {
      const stats = aggregates.get(member.id) ?? {
        reportsStatusUpdated: 0,
        reportMessagesSent: 0,
        contactReplies: 0,
        contactClosed: 0,
      };

      const reportsHandled = stats.reportsStatusUpdated + stats.reportMessagesSent;
      const reportsResolved = resolvedMap.get(member.id) ?? 0;
      const resolutionRate =
        reportsHandled > 0 ? Math.round((reportsResolved / reportsHandled) * 100) : 0;

      return {
        userId: member.id,
        name: member.name,
        surname: member.surname,
        email: member.email,
        role: member.role,
        reportsHandled,
        messagesSent: stats.reportMessagesSent,
        contactReplies: stats.contactReplies,
        ticketsClosed: stats.contactClosed,
        reportsResolved,
        resolutionRate,
        avgFirstResponseHours: null,
        satisfactionScore: null,
      };
    });
  }

  async getTeamActivity(tenantId: string, limit = 50) {
    const logs = await this.auditService.findByTenant(tenantId, { limit });
    const userIds = [...new Set(logs.map((l) => l.userId))];
    const users =
      userIds.length > 0 ? await this.userRepository.find({ where: { id: In(userIds) } }) : [];
    const names = new Map(users.map((u) => [u.id, `${u.name} ${u.surname}`.trim()]));

    return logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: names.get(log.userId) ?? 'Utilisateur',
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }));
  }
}
