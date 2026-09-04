import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DockerService } from './docker.service';
import { DatabaseService } from './database.service';
import { DemoSeedService } from './demo-seed.service';
import { StaffService } from '../staff/staff.service';
import { PlatformAdminGuard } from '../../core/guards/platform-admin.guard';

jest.mock(
  'bcrypt',
  () => ({
    hash: jest.fn(),
    compare: jest.fn(),
  }),
  { virtual: true },
);

describe('AdminController', () => {
  let controller: AdminController;

  const adminService = {
    getBusinessStats: jest.fn(),
    getSystemStats: jest.fn(),
    findAllUsers: jest.fn(),
    findUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    findAllCities: jest.fn(),
    createCity: jest.fn(),
    updateCity: jest.fn(),
    deleteCity: jest.fn(),
    getCityStats: jest.fn(),
    getCityAgents: jest.fn(),
    getCityInvitations: jest.fn(),
    getRecentActivity: jest.fn(),
    forceAcceptInvitation: jest.fn(),
    cancelInvitation: jest.fn(),
  };
  const dockerService = { getContainers: jest.fn() };
  const databaseService = {
    getTables: jest.fn(),
    getTableData: jest.fn(),
    executeQuery: jest.fn(),
  };
  const staffService = {
    createMayor: jest.fn(),
    createInvitation: jest.fn(),
  };
  const demoSeedService = {
    isEnabled: jest.fn(),
    runSeed: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: adminService },
        { provide: DockerService, useValue: dockerService },
        { provide: DatabaseService, useValue: databaseService },
        { provide: StaffService, useValue: staffService },
        { provide: DemoSeedService, useValue: demoSeedService },
      ],
    })
      .overrideGuard(PlatformAdminGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = module.get(AdminController);
  });

  it('getStats combines business and system', async () => {
    adminService.getBusinessStats.mockResolvedValue({ users: 1 });
    adminService.getSystemStats.mockResolvedValue({ uptime: 1 });
    await expect(controller.getStats()).resolves.toEqual({
      success: true,
      data: { business: { users: 1 }, system: { uptime: 1 } },
    });
  });

  it('user CRUD endpoints', async () => {
    adminService.findAllUsers.mockResolvedValue([]);
    await expect(controller.getUsers()).resolves.toEqual({ success: true, data: [] });

    adminService.findUserById.mockResolvedValue({ id: 1 });
    await expect(controller.getUser(1)).resolves.toEqual({ success: true, data: { id: 1 } });

    adminService.updateUser.mockResolvedValue({ id: 1, name: 'A' });
    await expect(controller.updateUser(1, { name: 'A' } as never)).resolves.toMatchObject({
      success: true,
    });

    adminService.deleteUser.mockResolvedValue(undefined);
    await expect(controller.deleteUser(1)).resolves.toEqual({ success: true });
  });

  it('docker and database endpoints', async () => {
    dockerService.getContainers.mockResolvedValue([{ id: '1' }]);
    await expect(controller.getDockerStats()).resolves.toEqual({
      success: true,
      data: [{ id: '1' }],
    });

    databaseService.getTables.mockResolvedValue(['users']);
    await expect(controller.getTables()).resolves.toEqual({ success: true, data: ['users'] });

    databaseService.getTableData.mockResolvedValue({ data: [], total: 0 });
    await expect(controller.getTableData('users', '10', '0')).resolves.toMatchObject({
      success: true,
    });

    await expect(controller.executeQuery({} as never)).resolves.toEqual({
      success: false,
      error: 'Query is required',
    });

    databaseService.executeQuery.mockResolvedValue([{ id: 1 }]);
    await expect(controller.executeQuery({ query: 'SELECT 1' } as never)).resolves.toEqual({
      success: true,
      data: [{ id: 1 }],
    });

    databaseService.executeQuery.mockResolvedValue({ error: 'bad' });
    await expect(controller.executeQuery({ query: 'SELECT 1' } as never)).resolves.toEqual({
      success: false,
      error: 'bad',
    });
  });

  it('city endpoints', async () => {
    adminService.findAllCities.mockResolvedValue([]);
    await expect(controller.getCities()).resolves.toMatchObject({ success: true });

    adminService.createCity.mockResolvedValue({ id: 'c1' });
    await expect(controller.createCity({ id: 'c1', name: 'X' } as never)).resolves.toMatchObject({
      success: true,
    });

    adminService.updateCity.mockResolvedValue({ id: 'c1' });
    await expect(controller.updateCity('c1', {} as never)).resolves.toMatchObject({ success: true });

    adminService.deleteCity.mockResolvedValue(undefined);
    await expect(controller.deleteCity('c1')).resolves.toEqual({ success: true });

    adminService.getCityStats.mockResolvedValue([]);
    await expect(controller.getCityStats()).resolves.toMatchObject({ success: true });

    adminService.getCityAgents.mockResolvedValue([]);
    await expect(controller.getCityAgents('c1')).resolves.toMatchObject({ success: true });

    adminService.getCityInvitations.mockResolvedValue([]);
    await expect(controller.getCityInvitations('c1')).resolves.toMatchObject({ success: true });
  });

  it('staff mayor/invitation and activity', async () => {
    staffService.createMayor.mockResolvedValue({ id: 1 });
    await expect(
      controller.createMayor('c1', { email: 'm@x.fr' } as never),
    ).resolves.toMatchObject({ success: true });

    staffService.createInvitation.mockResolvedValue({ id: 2 });
    await expect(
      controller.createInvitation('c1', { email: 'a@x.fr', role: 'agent' } as never),
    ).resolves.toMatchObject({ success: true });

    adminService.getRecentActivity.mockResolvedValue([]);
    await expect(controller.getActivity()).resolves.toMatchObject({ success: true });
  });

  it('demo seed endpoints', async () => {
    demoSeedService.isEnabled.mockReturnValue(true);
    expect(controller.getDemoSeedStatus()).toEqual({
      success: true,
      data: { enabled: true },
    });

    demoSeedService.runSeed.mockResolvedValue({ output: 'ok', durationMs: 1 });
    await expect(controller.runDemoSeed({ reset: true } as never)).resolves.toMatchObject({
      success: true,
    });
  });

  it('invitation force-accept / cancel', async () => {
    adminService.forceAcceptInvitation.mockResolvedValue(null);
    await expect(controller.forceAcceptInvitation(1)).rejects.toThrow(NotFoundException);

    adminService.forceAcceptInvitation.mockResolvedValue({ id: 9 });
    await expect(controller.forceAcceptInvitation(1)).resolves.toMatchObject({ success: true });

    adminService.cancelInvitation.mockResolvedValue(undefined);
    await expect(controller.cancelInvitation(1)).resolves.toEqual({ success: true });
    await expect(controller.cancelInvitationDelete(1)).resolves.toEqual({ success: true });
  });
});
