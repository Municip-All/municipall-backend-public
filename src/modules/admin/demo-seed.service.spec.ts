import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

const execFileMock = jest.fn();

jest.mock('child_process', () => ({
  execFile: (...args: unknown[]) => execFileMock(...args) as void,
}));

import { DemoSeedService } from './demo-seed.service';

describe('DemoSeedService', () => {
  let service: DemoSeedService;
  const configGet = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [DemoSeedService, { provide: ConfigService, useValue: { get: configGet } }],
    }).compile();
    service = module.get(DemoSeedService);
  });

  describe('isEnabled', () => {
    it('is false when DEMO_SEED_ENABLED=false', () => {
      configGet.mockImplementation((key: string) =>
        key === 'DEMO_SEED_ENABLED' ? 'false' : undefined,
      );
      expect(service.isEnabled()).toBe(false);
    });

    it('is false in production unless explicitly enabled', () => {
      configGet.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'DEMO_SEED_ENABLED') return undefined;
        return undefined;
      });
      expect(service.isEnabled()).toBe(false);
    });

    it('is true in production when DEMO_SEED_ENABLED=true', () => {
      configGet.mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'DEMO_SEED_ENABLED') return 'true';
        return undefined;
      });
      expect(service.isEnabled()).toBe(true);
    });

    it('is true in non-production by default', () => {
      configGet.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'development' : undefined,
      );
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe('runSeed', () => {
    it('throws when disabled', async () => {
      configGet.mockReturnValue('false');
      await expect(service.runSeed()).rejects.toThrow(ServiceUnavailableException);
    });

    it('runs npm seed successfully', async () => {
      configGet.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'development' : undefined,
      );
      execFileMock.mockImplementation(
        (
          _cmd: string,
          _args: string[],
          _opts: unknown,
          cb: (err: null, res: { stdout: string; stderr: string }) => void,
        ) => {
          cb(null, { stdout: 'seeded', stderr: '' });
        },
      );

      const result = await service.runSeed({ reset: true });
      expect(result.output).toContain('seeded');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('passes --no-reset when reset=false', async () => {
      configGet.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'development' : undefined,
      );
      execFileMock.mockImplementation(
        (
          _cmd: string,
          args: string[],
          _opts: unknown,
          cb: (err: null, res: { stdout: string; stderr: string }) => void,
        ) => {
          expect(args).toContain('--no-reset');
          cb(null, { stdout: 'ok', stderr: '' });
        },
      );
      await service.runSeed({ reset: false });
    });

    it('throws InternalServerErrorException on failure', async () => {
      configGet.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'development' : undefined,
      );
      execFileMock.mockImplementation(
        (
          _cmd: string,
          _args: string[],
          _opts: unknown,
          cb: (err: Error & { stderr?: string }) => void,
        ) => {
          const err = new Error('fail') as Error & { stderr?: string };
          err.stderr = 'boom';
          cb(err);
        },
      );
      await expect(service.runSeed()).rejects.toThrow(InternalServerErrorException);
    });
  });
});
