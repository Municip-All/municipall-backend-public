import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';

describe('AuditService', () => {
  let service: AuditService;
  const repo = {
    create: jest.fn((x) => x),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: getRepositoryToken(AuditLog), useValue: repo }],
    }).compile();
    service = module.get(AuditService);
  });

  it('log saves entry', async () => {
    repo.save.mockResolvedValue(undefined);
    await service.log({
      tenantId: 'c1',
      userId: 1,
      action: 'report.status_updated',
      resourceType: 'report',
      resourceId: 9,
    });
    expect(repo.save).toHaveBeenCalled();
  });

  it('findByTenant applies filters', async () => {
    repo.find.mockResolvedValue([]);
    await service.findByTenant('c1', { userId: 2, since: new Date('2026-01-01'), limit: 10 });
    expect(repo.find).toHaveBeenCalled();
  });

  it('countActionsByUser counts', async () => {
    repo.count.mockResolvedValue(3);
    await expect(
      service.countActionsByUser('c1', 1, new Date('2026-01-01'), ['report.status_updated']),
    ).resolves.toBe(3);
  });

  it('aggregateTeamKpis groups actions', async () => {
    repo.query.mockResolvedValue([
      { user_id: '1', action: 'report.status_updated', count: '2' },
      { user_id: '1', action: 'report.message_sent', count: '1' },
      { user_id: '1', action: 'contact.reply_sent', count: '4' },
      { user_id: '1', action: 'contact.closed', count: '1' },
      { user_id: '2', action: 'other', count: '9' },
    ]);
    const map = await service.aggregateTeamKpis('c1', new Date('2026-01-01'));
    expect(map.get(1)).toEqual({
      reportsStatusUpdated: 2,
      reportMessagesSent: 1,
      contactReplies: 4,
      contactClosed: 1,
    });
    expect(map.get(2)).toEqual({
      reportsStatusUpdated: 0,
      reportMessagesSent: 0,
      contactReplies: 0,
      contactClosed: 0,
    });
  });
});
