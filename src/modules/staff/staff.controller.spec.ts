import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

jest.mock(
  'bcrypt',
  () => ({
    hash: jest.fn(),
    compare: jest.fn(),
  }),
  { virtual: true },
);

describe('StaffController', () => {
  let controller: StaffController;
  const service = {
    listTeam: jest.fn(),
    createInvitation: jest.fn(),
    getInvitationPreview: jest.fn(),
    acceptInvitation: jest.fn(),
    getTeamKpis: jest.fn(),
    getTeamActivity: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffController],
      providers: [{ provide: StaffService, useValue: service }],
    }).compile();
    controller = module.get(StaffController);
  });

  it('listTeam uses tenant or cityId', async () => {
    service.listTeam.mockResolvedValue([]);
    await controller.listTeam({ tenantId: 'c1' } as never);
    expect(service.listTeam).toHaveBeenCalledWith('c1');
    await controller.listTeam({ user: { cityId: 'from-user' } } as never);
    expect(service.listTeam).toHaveBeenCalledWith('from-user');
  });

  it('createInvitation requires user', async () => {
    await expect(
      controller.createInvitation({} as never, { email: 'a@b.c' } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('createInvitation delegates', async () => {
    service.createInvitation.mockResolvedValue({ id: 1 });
    const dto = { email: 'a@b.c', name: 'A', role: 'agent' } as never;
    await controller.createInvitation({ tenantId: 'c1', user: { sub: 9 } } as never, dto);
    expect(service.createInvitation).toHaveBeenCalledWith('c1', 9, dto);
  });

  it('preview and accept invitation', async () => {
    service.getInvitationPreview.mockResolvedValue({ email: 'a@b.c' });
    service.acceptInvitation.mockResolvedValue({ access_token: 'jwt' });
    await expect(controller.previewInvitation('tok')).resolves.toEqual({ email: 'a@b.c' });
    const dto = { token: 'tok', name: 'N', surname: 'S', password: 'p' } as never;
    await expect(controller.acceptInvitation(dto)).resolves.toEqual({ access_token: 'jwt' });
  });

  it('teamKpis and teamActivity', async () => {
    service.getTeamKpis.mockResolvedValue([]);
    service.getTeamActivity.mockResolvedValue([]);
    await controller.teamKpis({ tenantId: 'c1' } as never, 14);
    expect(service.getTeamKpis).toHaveBeenCalledWith('c1', 14);
    await controller.teamActivity({ tenantId: 'c1' } as never, { limit: 20 } as never);
    expect(service.getTeamActivity).toHaveBeenCalledWith('c1', 20);
  });
});
