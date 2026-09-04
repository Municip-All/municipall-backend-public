import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

const execMock = jest.fn();

jest.mock('child_process', () => ({
  exec: (...args: unknown[]) => execMock(...args) as void,
}));

import { DockerService } from './docker.service';

describe('DockerService', () => {
  let service: DockerService;
  const configGet = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DockerService, { provide: ConfigService, useValue: { get: configGet } }],
    }).compile();
    service = module.get(DockerService);
  });

  it('returns fallback containers when exec fails outside production', async () => {
    execMock.mockImplementation((_cmd: string, cb: (err: Error) => void) => {
      cb(new Error('docker not found'));
    });
    configGet.mockReturnValue('development');

    const containers = await service.getContainers();
    expect(containers.length).toBe(3);
    expect(containers[0].name).toBe('municipall-backend');
  });

  it('returns empty array when exec fails in production', async () => {
    execMock.mockImplementation((_cmd: string, cb: (err: Error) => void) => {
      cb(new Error('docker not found'));
    });
    configGet.mockReturnValue('production');

    await expect(service.getContainers()).resolves.toEqual([]);
  });

  it('parses docker ps and stats when exec succeeds', async () => {
    const psLine = JSON.stringify({
      ID: 'abc',
      Names: 'app',
      Image: 'img',
      Status: 'Up 1h',
      State: 'running',
    });
    const statsLine = JSON.stringify({
      ID: 'abc',
      Name: 'app',
      CPUPerc: '2%',
      MemUsage: '100MiB / 1GiB',
    });

    execMock
      .mockImplementationOnce((_cmd: string, cb: (err: null, res: { stdout: string }) => void) => {
        cb(null, { stdout: psLine + '\n' });
      })
      .mockImplementationOnce((_cmd: string, cb: (err: null, res: { stdout: string }) => void) => {
        cb(null, { stdout: statsLine + '\n' });
      });

    const containers = await service.getContainers();
    expect(containers).toEqual([
      expect.objectContaining({
        id: 'abc',
        name: 'app',
        cpu: '2%',
        memory: '100MiB / 1GiB',
      }),
    ]);
  });
});
