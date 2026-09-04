import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const service = {
    sendTargetedAlert: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: service }],
    }).compile();
    controller = module.get(NotificationsController);
  });

  it('sendTargeted uses tenantId from request', async () => {
    service.sendTargetedAlert.mockResolvedValue({ sent: 2 });
    const body = { title: 'Alerte', body: 'msg' } as never;
    await expect(controller.sendTargeted({ tenantId: 'c1' } as never, body)).resolves.toEqual({
      sent: 2,
    });
    expect(service.sendTargetedAlert).toHaveBeenCalledWith('c1', body);
  });

  it('sendTargeted falls back to body.cityId then city-1', async () => {
    service.sendTargetedAlert.mockResolvedValue({ sent: 0 });
    const withCity = { title: 't', body: 'b', cityId: 'from-body' } as never;
    await controller.sendTargeted({} as never, withCity);
    expect(service.sendTargetedAlert).toHaveBeenCalledWith('from-body', withCity);

    const bare = { title: 't', body: 'b' } as never;
    await controller.sendTargeted({} as never, bare);
    expect(service.sendTargetedAlert).toHaveBeenCalledWith('city-1', bare);
  });
});
