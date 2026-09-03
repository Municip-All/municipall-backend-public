/**
 * Seed de démo Municip'All — Le Kremlin-Bicêtre
 *
 * Usage (depuis le repo backend, avec les variables DATABASE_* du dev) :
 *   npm run seed:demo
 *
 * Sur le VPS dev (dans le conteneur backend) :
 *   docker compose -f docker-compose.dev.yml exec backend-dev npm run seed:demo
 *
 * Options :
 *   --no-reset   Ajoute sans supprimer les données demo existantes
 *   --dry-run    Affiche le plan sans écrire en base
 */

import { DataSource, In, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/modules/user/user.entity';
import { City } from '../src/modules/city-config/entities/city.entity';
import { Report } from '../src/modules/reports/entities/report.entity';
import { ReportMessage } from '../src/modules/reports/entities/report-message.entity';
import { ContactTicket } from '../src/modules/contact-messages/entities/contact-ticket.entity';
import { ContactTicketMessage } from '../src/modules/contact-messages/entities/contact-ticket-message.entity';
import { CitizenFeedback } from '../src/modules/feedback/entities/citizen-feedback.entity';
import { Event } from '../src/modules/events/entities/event.entity';
import { ConstructionWork } from '../src/modules/construction-works/entities/construction-work.entity';
import { AuditLog } from '../src/modules/audit/entities/audit-log.entity';
import { Invitation } from '../src/modules/admin/entities/invitation.entity';
import {
  BULK_QUESTION_COUNT,
  BULK_REPORT_COUNT,
  BULK_SUGGESTION_COUNT,
  CITIZEN_NAMES,
  CITY_CENTER,
  CONSTRUCTION_SEEDS,
  CONTACT_SEEDS,
  DEMO_CITY_ID,
  DEMO_EMAIL_DOMAIN,
  DEMO_PASSWORD,
  EVENT_SEEDS,
  INVITATION_SEEDS,
  REPORT_SEEDS,
  STAFF_USERS,
  TIMELINE_FEEDBACK_COUNT,
} from './seed-demo-data';
import {
  buildBulkQuestions,
  buildBulkReports,
  buildBulkSuggestions,
  buildTimelineFeedback,
} from './seed-demo-generators';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const RESET = !args.has('--no-reset');

function log(msg: string) {
  console.log(`[seed:demo] ${msg}`);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(9 + (days % 8), (days * 7) % 60, 0, 0);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d;
}

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

/** Dispersion GPS autour du centre-ville */
function coords(index: number): { lat: number; lon: number } {
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.003 + (index % 5) * 0.0012;
  return {
    lat: CITY_CENTER.lat + Math.sin(angle) * radius,
    lon: CITY_CENTER.lon + Math.cos(angle) * radius,
  };
}

function isTerminalReportStatus(status: string): boolean {
  return status === 'Résolu' || status === 'Clôturé';
}

function isTerminalContactStatus(ticketType: string, status: string): boolean {
  if (ticketType === 'suggestion') {
    return status === 'Réalisée' || status === 'Non retenue' || status === 'Clôturé';
  }
  return status === 'Clôturé';
}

async function createDataSource(): Promise<DataSource> {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'municipall',
    entities: [
      User,
      City,
      Report,
      ReportMessage,
      ContactTicket,
      ContactTicketMessage,
      CitizenFeedback,
      Event,
      ConstructionWork,
      AuditLog,
      Invitation,
    ],
    synchronize: false,
  });
  await ds.initialize();
  return ds;
}

async function resetDemoData(ds: DataSource) {
  log(`Nettoyage des données demo pour ${DEMO_CITY_ID}…`);

  const ticketIds = (
    await ds.getRepository(ContactTicket).find({
      where: { tenantId: DEMO_CITY_ID },
      select: ['id'],
    })
  ).map((t) => t.id);

  if (ticketIds.length > 0) {
    await ds.getRepository(ContactTicketMessage).delete({ ticketId: In(ticketIds) });
  }

  const reportIds = (
    await ds.getRepository(Report).find({
      where: { tenantId: DEMO_CITY_ID },
      select: ['id'],
    })
  ).map((r) => r.id);

  if (reportIds.length > 0) {
    await ds.getRepository(ReportMessage).delete({ reportId: In(reportIds) });
  }

  await ds.getRepository(CitizenFeedback).delete({ tenantId: DEMO_CITY_ID });
  await ds.getRepository(ContactTicket).delete({ tenantId: DEMO_CITY_ID });
  await ds.getRepository(Report).delete({ tenantId: DEMO_CITY_ID });
  await ds.getRepository(AuditLog).delete({ tenantId: DEMO_CITY_ID });
  await ds.getRepository(Event).delete({ cityId: DEMO_CITY_ID });
  await ds.getRepository(ConstructionWork).delete({ tenantId: DEMO_CITY_ID });
  await ds.getRepository(User).delete({
    cityId: DEMO_CITY_ID,
    email: Like(`%${DEMO_EMAIL_DOMAIN}`),
  });
  await ds.getRepository(Invitation).delete({
    cityId: DEMO_CITY_ID,
    email: Like(`%${DEMO_EMAIL_DOMAIN}`),
  });

  log('Nettoyage terminé.');
}

async function upsertCity(ds: DataSource) {
  const repo = ds.getRepository(City);
  let city = await repo.findOneBy({ id: DEMO_CITY_ID });
  const payload: Partial<City> = {
    id: DEMO_CITY_ID,
    name: "Municip'All — Le Kremlin-Bicêtre",
    officialName: 'Le Kremlin-Bicêtre',
    primaryColor: '#0B0080',
    secondaryColor: '#6366F1',
    useGradient: true,
    logoUrl: '/logo.png',
    backgroundColorLight: '#F4F6F9',
    backgroundColorDark: '#0F1117',
    dataRetentionPolicy:
      'Données de signalement conservées 24 mois. Messages de contact : 36 mois. Comptes inactifs : anonymisation après 3 ans.',
    contactEmail: 'contact@mairie-kremlin-bicetre.demo.fr',
    contactPhone: '01 84 80 00 00',
    contactHelpText:
      'Une question sur vos démarches ? Notre équipe vous répond du lundi au vendredi.',
    features: ['flux-live', 'agenda', 'reports', 'weather', 'contact', 'social'],
    isTransportFeatureAllowed: true,
    isTransportFeatureEnabled: true,
    neighborhoods: [
      {
        id: 'centre',
        name: 'Centre-ville',
        points: [
          [2.355, 48.808],
          [2.365, 48.808],
          [2.365, 48.812],
          [2.355, 48.812],
        ],
      },
      {
        id: 'closeaux',
        name: 'Les Closeaux',
        points: [
          [2.348, 48.806],
          [2.354, 48.806],
          [2.354, 48.81],
          [2.348, 48.81],
        ],
      },
      {
        id: 'plateau',
        name: 'Plateau',
        points: [
          [2.362, 48.812],
          [2.368, 48.812],
          [2.368, 48.816],
          [2.362, 48.816],
        ],
      },
    ],
    usefulNumbers: [
      { label: 'Urgences', phone: '112', icon: 'alert' },
      { label: 'Police municipale', phone: '01 45 21 00 00', icon: 'shield' },
      { label: 'PMU — Propreté', phone: '01 45 21 00 01', icon: 'trash' },
    ],
    usefulLinks: [
      { label: 'Site de la ville', url: 'https://www.ville-kremlin-bicetre.fr', icon: 'globe' },
      { label: 'Démarches en ligne', url: 'https://www.service-public.fr', icon: 'file' },
    ],
    associations: [
      {
        id: 'asso-1',
        name: 'Les Amis du Plateau',
        category: 'association',
        description: 'Animations et jardin partagé.',
        address: '12 rue du Plateau, 94240 Le Kremlin-Bicêtre',
        contactEmail: 'amis.plateau@demo.fr',
        website: 'https://example.com',
      },
      {
        id: 'asso-2',
        name: 'Club sportif municipal',
        category: 'association',
        description: 'Football, basket, gym pour tous les âges.',
        address: 'Gymnase Jean-Moulin',
        contactPhone: '01 45 21 00 02',
      },
      {
        id: 'groupe-1',
        name: 'Parole de parents',
        category: 'groupe-parole',
        description: 'Échanges entre parents sur la scolarité et le quotidien.',
        address: 'Maison des associations',
      },
      {
        id: 'autre-1',
        name: 'Conseil local jeunes',
        category: 'autre',
        description: 'Instance consultative des 16-25 ans.',
        address: 'Mairie — espace jeunesse',
      },
      {
        id: 'asso-3',
        name: 'Solidarité Kremlin',
        category: 'association',
        description: 'Aide alimentaire et vestimentaire.',
        address: '8 rue de Paris, 94240 Le Kremlin-Bicêtre',
        contactPhone: '01 45 21 00 03',
      },
      {
        id: 'groupe-2',
        name: 'Café des seniors',
        category: 'groupe-parole',
        description: 'Accueil et échanges chaque mardi matin.',
        address: 'Centre social Les Closeaux',
      },
    ],
    publicProfile: {
      mayorName: 'Sophie Martin',
      mayorTitle: 'Maire de Le Kremlin-Bicêtre',
      welcomeText: 'Bienvenue sur l\'application de votre commune.',
      description:
        'Le Kremlin-Bicêtre, ville dynamique au sud de Paris, met la proximité au cœur de son action.',
      address: 'Place du 8 mai 1945, 94240 Le Kremlin-Bicêtre',
      website: 'https://www.ville-kremlin-bicetre.fr',
      openingHours: 'Lun–Ven 8h30–12h30 et 13h30–17h30 · Sam 9h–12h',
    },
    wasteConfig: {
      services: [
        { type: 'Ordures ménagères', icon: 'trash', color: '#22c55e', days: [2, 5], time: '07:00' },
        { type: 'Tri sélectif', icon: 'recycle', color: '#3b82f6', days: [4], time: '07:00' },
        { type: 'Verre', icon: 'wine', color: '#a855f7', days: [3], time: '07:00' },
      ],
    },
  };

  if (city) {
    Object.assign(city, payload);
    await repo.save(city);
    log('Commune mise à jour.');
  } else {
    city = repo.create(payload as City);
    await repo.save(city);
    log('Commune créée.');
  }
}

async function insertFeedback(
  ds: DataSource,
  userId: number,
  resourceType: 'report' | 'contact_ticket',
  resourceId: number,
  stars: number,
  message: string | undefined,
  createdAt: Date,
) {
  await ds.query(
    `
    INSERT INTO citizen_feedback (tenant_id, user_id, resource_type, resource_id, stars, message, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [DEMO_CITY_ID, userId, resourceType, resourceId, stars, message ?? null, createdAt],
  );
}

async function seedUsers(ds: DataSource) {
  const repo = ds.getRepository(User);
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const staffByEmail: Record<string, number> = {};
  const agentIds: number[] = [];
  const citizenIds: number[] = [];

  for (const staff of STAFF_USERS) {
    const user = repo.create({
      email: staff.email,
      name: staff.name,
      surname: staff.surname,
      role: staff.role,
      password: passwordHash,
      cityId: DEMO_CITY_ID,
      points: 0,
    });
    await repo.save(user);
    staffByEmail[staff.email] = user.id;
    if (staff.role === 'agent') agentIds.push(user.id);
    log(`Staff: ${staff.email} (id ${user.id})`);
  }

  for (let i = 0; i < CITIZEN_NAMES.length; i++) {
    const c = CITIZEN_NAMES[i];
    const user = repo.create({
      email: `citoyen${i + 1}${DEMO_EMAIL_DOMAIN}`,
      name: c.name,
      surname: c.surname,
      role: 'citizen',
      password: passwordHash,
      cityId: DEMO_CITY_ID,
      points: c.points,
      neighborhood: c.neighborhood,
      expoPushToken: i < 5 ? `ExponentPushToken[demo-citoyen-${i + 1}]` : undefined,
    });
    await repo.save(user);
    citizenIds.push(user.id);
  }
  log(`${citizenIds.length} citoyens créés.`);

  const mayorEmail = STAFF_USERS.find((s) => s.role === 'mayor')!.email;
  const assistantEmail = STAFF_USERS.find((s) => s.role === 'assistant')!.email;

  return {
    mayorId: staffByEmail[mayorEmail],
    assistantId: staffByEmail[assistantEmail],
    agentIds,
    citizenIds,
  };
}

async function insertReport(
  ds: DataSource,
  seed: (typeof REPORT_SEEDS)[number],
  index: number,
  userId: number,
  agentId: number,
): Promise<number> {
  const { lat, lon } = coords(index);
  const createdAt = daysAgo(seed.daysAgo);
  const updatedAt = isTerminalReportStatus(seed.status)
    ? addHours(createdAt, 48)
    : addHours(createdAt, 12);

  const result = await ds.query(
    `
    INSERT INTO reports (tenant_id, user_id, category, status, description, image_url, is_resident, created_at, updated_at, lat, lon)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id
    `,
    [
      DEMO_CITY_ID,
      userId,
      seed.category,
      seed.status,
      seed.description,
      seed.withImage ? `https://picsum.photos/seed/report${index}/400/300` : null,
      index % 7 !== 0,
      createdAt,
      updatedAt,
      lat,
      lon,
    ],
  );

  const reportId = Number(result[0].id);
  const msgRepo = ds.getRepository(ReportMessage);

  const initialMsg = msgRepo.create({
    reportId,
    senderId: userId,
    senderRole: 'citizen',
    body: seed.description,
    createdAt,
  });
  await msgRepo.save(initialMsg);

  let lastMsgAt = createdAt;
  for (const msg of seed.messages ?? []) {
    const senderId = msg.role === 'agent' ? agentId : userId;
    lastMsgAt = addHours(createdAt, msg.hoursAfter ?? 1);
    await msgRepo.save(
      msgRepo.create({
        reportId,
        senderId,
        senderRole: msg.role,
        body: msg.body,
        createdAt: lastMsgAt,
      }),
    );
  }

  if (seed.feedback && isTerminalReportStatus(seed.status)) {
    const feedbackAt = addHours(updatedAt, (seed.feedback.daysAfterClose ?? 1) * 24);
    await insertFeedback(ds, userId, 'report', reportId, seed.feedback.stars, seed.feedback.message, feedbackAt);
  }

  return reportId;
}

async function seedReports(
  ds: DataSource,
  seeds: (typeof REPORT_SEEDS)[number][],
  citizenIds: number[],
  agentIds: number[],
  offsetIndex = 0,
) {
  const auditRepo = ds.getRepository(AuditLog);
  const reportIds: number[] = [];

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const userId = citizenIds[(i + offsetIndex) % citizenIds.length];
    const agentId = agentIds[i % agentIds.length];
    const reportId = await insertReport(ds, seed, offsetIndex + i, userId, agentId);
    reportIds.push(reportId);

    const createdAt = daysAgo(seed.daysAgo);
    await auditRepo.save(
      auditRepo.create({
        tenantId: DEMO_CITY_ID,
        userId,
        action: 'report.created',
        resourceType: 'report',
        resourceId: reportId,
        metadata: { category: seed.category },
        createdAt,
      }),
    );

    if (seed.status !== 'En attente') {
      await auditRepo.save(
        auditRepo.create({
          tenantId: DEMO_CITY_ID,
          userId: agentId,
          action: 'report.message_sent',
          resourceType: 'report',
          resourceId: reportId,
          createdAt: addHours(createdAt, 2),
        }),
      );
    }

    if (isTerminalReportStatus(seed.status)) {
      await auditRepo.save(
        auditRepo.create({
          tenantId: DEMO_CITY_ID,
          userId: agentId,
          action: 'report.status_updated',
          resourceType: 'report',
          resourceId: reportId,
          metadata: { status: seed.status, previous: 'En cours' },
          createdAt: addHours(createdAt, 36),
        }),
      );
    }
  }

  return reportIds;
}

async function seedContacts(
  ds: DataSource,
  seeds: (typeof CONTACT_SEEDS)[number][],
  citizenIds: number[],
  agentIds: number[],
  offsetIndex = 0,
) {
  const ticketRepo = ds.getRepository(ContactTicket);
  const msgRepo = ds.getRepository(ContactTicketMessage);
  const auditRepo = ds.getRepository(AuditLog);
  let count = 0;

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const userId = citizenIds[(i + 3 + offsetIndex) % citizenIds.length];
    const agentId = agentIds[i % agentIds.length];
    const createdAt = daysAgo(seed.daysAgo);
    const terminal = isTerminalContactStatus(seed.ticketType, seed.status);

    const ticket = await ticketRepo.save(
      ticketRepo.create({
        tenantId: DEMO_CITY_ID,
        userId,
        subject: seed.subject,
        ticketType: seed.ticketType,
        status: seed.status,
        createdAt,
        updatedAt: terminal ? addHours(createdAt, 72) : addHours(createdAt, 24),
        closedAt: terminal ? addHours(createdAt, 72) : undefined,
        closedByUserId: terminal ? agentId : undefined,
      }),
    );

    let lastAt = createdAt;
    await msgRepo.save(
      msgRepo.create({
        ticketId: ticket.id,
        senderId: userId,
        senderRole: 'citizen',
        body: seed.body,
        createdAt,
      }),
    );

    for (const msg of seed.messages ?? []) {
      const senderId = msg.role === 'agent' ? agentId : userId;
      lastAt = addHours(createdAt, msg.hoursAfter ?? 2);
      await msgRepo.save(
        msgRepo.create({
          ticketId: ticket.id,
          senderId,
          senderRole: msg.role,
          body: msg.body,
          createdAt: lastAt,
        }),
      );
      if (msg.role === 'agent') {
        await auditRepo.save(
          auditRepo.create({
            tenantId: DEMO_CITY_ID,
            userId: agentId,
            action: 'contact.reply_sent',
            resourceType: 'contact_ticket',
            resourceId: ticket.id,
            createdAt: lastAt,
          }),
        );
      }
    }

    if (terminal) {
      await auditRepo.save(
        auditRepo.create({
          tenantId: DEMO_CITY_ID,
          userId: agentId,
          action: 'contact.closed',
          resourceType: 'contact_ticket',
          resourceId: ticket.id,
          metadata: { status: seed.status },
          createdAt: addHours(createdAt, 48),
        }),
      );
    }

    if (seed.feedback && terminal) {
      await insertFeedback(
        ds,
        userId,
        'contact_ticket',
        ticket.id,
        seed.feedback.stars,
        seed.feedback.message,
        addHours(lastAt, (seed.feedback.daysAfterClose ?? 1) * 24),
      );
    }

    count++;
  }

  return count;
}

async function seedTimelineFeedback(
  ds: DataSource,
  citizenIds: number[],
  agentIds: number[],
  startIndex: number,
) {
  const items = buildTimelineFeedback(TIMELINE_FEEDBACK_COUNT);
  let created = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const userId = citizenIds[(i + 5) % citizenIds.length];
    const agentId = agentIds[i % agentIds.length];
    const { lat, lon } = coords(startIndex + i);

    const result = await ds.query(
      `
      INSERT INTO reports (tenant_id, user_id, category, status, description, is_resident, created_at, updated_at, lat, lon)
      VALUES ($1, $2, 'Autre', 'Résolu', $3, true, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        DEMO_CITY_ID,
        userId,
        `[Satisfaction] Dossier clôturé #${i + 1}`,
        daysAgo(item.daysAgo + 5),
        daysAgo(item.daysAgo),
        lat,
        lon,
      ],
    );
    const reportId = Number(result[0].id);
    await insertFeedback(
      ds,
      userId,
      'report',
      reportId,
      item.stars,
      item.message,
      daysAgo(item.daysAgo),
    );
    created++;
  }
  log(`${created} avis timeline satisfaction créés.`);
}

async function seedInvitations(ds: DataSource, mayorId: number) {
  const repo = ds.getRepository(Invitation);
  for (const inv of INVITATION_SEEDS) {
    const createdAt = daysAgo(inv.daysAgo);
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + 14);
    await repo.save(
      repo.create({
        email: inv.email,
        cityId: DEMO_CITY_ID,
        status: inv.status,
        token: `demo-token-${inv.email.split('@')[0]}`,
        role: inv.role,
        name: inv.name,
        invitedById: mayorId,
        createdAt,
        expiresAt: inv.status === 'expired' ? daysAgo(1) : expiresAt,
      }),
    );
  }
  log(`${INVITATION_SEEDS.length} invitations créées.`);
}

async function seedTeamActivity(
  ds: DataSource,
  mayorId: number,
  assistantId: number,
  agentIds: number[],
) {
  const repo = ds.getRepository(AuditLog);
  const actions = [
    'report.message_sent',
    'report.status_updated',
    'contact.reply_sent',
    'contact.closed',
    'city.config_updated',
  ] as const;
  let count = 0;

  for (let day = 0; day < 28; day++) {
    for (let j = 0; j < 2; j++) {
      const userId =
        j % 3 === 0 ? mayorId : j % 3 === 1 ? assistantId : agentIds[j % agentIds.length];
      const action = actions[(day + j) % actions.length];
      await repo.save(
        repo.create({
          tenantId: DEMO_CITY_ID,
          userId,
          action,
          resourceType: action.startsWith('city') ? 'city' : action.startsWith('contact') ? 'contact_ticket' : 'report',
          resourceId: 1000 + day * 10 + j,
          metadata:
            action === 'report.status_updated' ? { status: 'Résolu', previous: 'En cours' } : undefined,
          createdAt: daysAgo(day),
        }),
      );
      count++;
    }
  }
  log(`${count} entrées d'activité équipe créées.`);
}

async function seedEvents(ds: DataSource) {
  const repo = ds.getRepository(Event);
  for (const seed of EVENT_SEEDS) {
    const start = seed.daysFromNow >= 0 ? daysFromNow(seed.daysFromNow) : daysAgo(-seed.daysFromNow);
    const end = new Date(start);
    end.setHours(start.getHours() + (seed.durationDays > 0 ? seed.durationDays * 24 : 3));
    await repo.save(
      repo.create({
        cityId: DEMO_CITY_ID,
        title: seed.title,
        description: seed.description,
        location: seed.location,
        category: seed.category,
        startDate: start,
        endDate: end,
      }),
    );
  }
  log(`${EVENT_SEEDS.length} événements créés.`);
}

async function seedConstruction(ds: DataSource) {
  for (let i = 0; i < CONSTRUCTION_SEEDS.length; i++) {
    const seed = CONSTRUCTION_SEEDS[i];
    const { lat, lon } = coords(i + 50);
    const startDate =
      'daysAgo' in seed ? daysAgo(seed.daysAgo) : daysFromNow(seed.daysFromNow);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + seed.durationDays);

    await ds.query(
      `
      INSERT INTO construction_works ("tenantId", title, description, "locationName", status, "impactType", "startDate", "endDate", coordinates, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($9, $10), 4326), NOW(), NOW())
      `,
      [
        DEMO_CITY_ID,
        seed.title,
        seed.description,
        seed.locationName,
        seed.status,
        seed.impactType,
        startDate,
        endDate,
        lon,
        lat,
      ],
    );
  }
  log(`${CONSTRUCTION_SEEDS.length} travaux créés.`);
}


async function main() {
  log(`Ville cible : ${DEMO_CITY_ID}`);
  if (DRY_RUN) {
    log('Mode dry-run — aucune écriture.');
    log(`Signalements manuels : ${REPORT_SEEDS.length} + bulk ${BULK_REPORT_COUNT}`);
    log(`Contacts manuels : ${CONTACT_SEEDS.length} + bulk ${BULK_QUESTION_COUNT + BULK_SUGGESTION_COUNT}`);
    log(`Citoyens : ${CITIZEN_NAMES.length} · Staff : ${STAFF_USERS.length}`);
    log(`Timeline satisfaction : ${TIMELINE_FEEDBACK_COUNT}`);
    return;
  }

  const ds = await createDataSource();
  try {
    if (RESET) {
      await resetDemoData(ds);
    }

    await upsertCity(ds);
    const { mayorId, agentIds, assistantId, citizenIds } = await seedUsers(ds);

    const manualReports = await seedReports(ds, [...REPORT_SEEDS], citizenIds, agentIds, 0);
    log(`${manualReports.length} signalements scénarisés créés.`);

    const bulkReports = await seedReports(
      ds,
      buildBulkReports(BULK_REPORT_COUNT),
      citizenIds,
      agentIds,
      REPORT_SEEDS.length,
    );
    log(`${bulkReports.length} signalements bulk créés.`);

    const manualContacts = await seedContacts(ds, [...CONTACT_SEEDS], citizenIds, agentIds, 0);
    log(`${manualContacts} conversations scénarisées créées.`);

    const bulkQuestions = await seedContacts(
      ds,
      buildBulkQuestions(BULK_QUESTION_COUNT),
      citizenIds,
      agentIds,
      CONTACT_SEEDS.length,
    );
    log(`${bulkQuestions} questions bulk créées.`);

    const bulkSuggestions = await seedContacts(
      ds,
      buildBulkSuggestions(BULK_SUGGESTION_COUNT),
      citizenIds,
      agentIds,
      CONTACT_SEEDS.length + BULK_QUESTION_COUNT,
    );
    log(`${bulkSuggestions} suggestions bulk créées.`);

    await seedTimelineFeedback(
      ds,
      citizenIds,
      agentIds,
      REPORT_SEEDS.length + BULK_REPORT_COUNT,
    );
    await seedEvents(ds);
    await seedConstruction(ds);
    await seedInvitations(ds, mayorId);
    await seedTeamActivity(ds, mayorId, assistantId, agentIds);

    const [reports, tickets, feedbackCount, events, works, citizens, audits] =
      await Promise.all([
        ds.getRepository(Report).count({ where: { tenantId: DEMO_CITY_ID } }),
        ds.getRepository(ContactTicket).count({ where: { tenantId: DEMO_CITY_ID } }),
        ds.getRepository(CitizenFeedback).count({ where: { tenantId: DEMO_CITY_ID } }),
        ds.getRepository(Event).count({ where: { cityId: DEMO_CITY_ID } }),
        ds.getRepository(ConstructionWork).count({ where: { tenantId: DEMO_CITY_ID } }),
        ds.getRepository(User).count({ where: { cityId: DEMO_CITY_ID, role: 'citizen' } }),
        ds.getRepository(AuditLog).count({ where: { tenantId: DEMO_CITY_ID } }),
      ]);

    log('');
    log('══════════════════════════════════════════');
    log('  Seed terminé — comptes de démo');
    log('══════════════════════════════════════════');
    log(`  Mot de passe (tous) : ${DEMO_PASSWORD}`);
    log(`  Tenant : ${DEMO_CITY_ID}`);
    log('');
    log('  Backoffice mairie :');
    for (const s of STAFF_USERS) {
      log(`    ${s.email} (${s.role})`);
    }
    log('');
    log('  App mobile (exemples) :');
    log(`    citoyen1${DEMO_EMAIL_DOMAIN}`);
    log(`    citoyen12${DEMO_EMAIL_DOMAIN}`);
    log('');
    log('  Volumes en base :');
    log(`    Signalements : ${reports}`);
    log(`    Conversations : ${tickets}`);
    log(`    Avis satisfaction : ${feedbackCount}`);
    log(`    Événements : ${events}`);
    log(`    Travaux : ${works}`);
    log(`    Citoyens : ${citizens}`);
    log(`    Logs audit : ${audits}`);
    log('══════════════════════════════════════════');
  } finally {
    await ds.destroy();
  }
}

main().catch((err) => {
  console.error('[seed:demo] Échec :', err);
  process.exit(1);
});
