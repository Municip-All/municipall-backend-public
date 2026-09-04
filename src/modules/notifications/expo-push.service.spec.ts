import { ExpoPushService } from './expo-push.service';

describe('ExpoPushService', () => {
  const service = new ExpoPushService();

  afterEach(() => jest.restoreAllMocks());

  it('returns zeros when no valid tokens', async () => {
    await expect(
      service.sendBatch([{ to: 'bad', title: 't', body: 'b' }]),
    ).resolves.toEqual({ sent: 0, failed: 0 });
  });

  it('counts sent and failed tickets', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ status: 'ok' }, { status: 'error', message: 'fail' }],
      }),
    } as Response);
    await expect(
      service.sendBatch([
        { to: 'ExponentPushToken[a]', title: 't', body: 'b' },
        { to: 'ExponentPushToken[b]', title: 't', body: 'b' },
      ]),
    ).resolves.toEqual({ sent: 1, failed: 1 });
  });

  it('counts failed on http error and network error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'err',
    } as Response);
    await expect(
      service.sendBatch([{ to: 'ExponentPushToken[a]', title: 't', body: 'b' }]),
    ).resolves.toEqual({ sent: 0, failed: 1 });

    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('net'));
    await expect(
      service.sendBatch([{ to: 'ExponentPushToken[a]', title: 't', body: 'b' }]),
    ).resolves.toEqual({ sent: 0, failed: 1 });
  });
});
