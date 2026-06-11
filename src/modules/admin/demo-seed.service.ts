import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export type DemoSeedOptions = {
  reset?: boolean;
};

export type DemoSeedResult = {
  output: string;
  durationMs: number;
};

@Injectable()
export class DemoSeedService {
  private readonly logger = new Logger(DemoSeedService.name);

  isEnabled(): boolean {
    if (process.env.DEMO_SEED_ENABLED === 'false') {
      return false;
    }
    if (process.env.NODE_ENV === 'production' && process.env.DEMO_SEED_ENABLED !== 'true') {
      return false;
    }
    return true;
  }

  async runSeed(options: DemoSeedOptions = {}): Promise<DemoSeedResult> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('Le seed de démo est désactivé sur cet environnement.');
    }

    const reset = options.reset !== false;
    const npmArgs = ['run', 'seed:demo'];
    if (!reset) {
      npmArgs.push('--', '--no-reset');
    }

    const started = Date.now();
    this.logger.log(`Lancement seed de démo (reset=${reset})…`);

    try {
      const { stdout, stderr } = await execFileAsync('npm', npmArgs, {
        cwd: process.cwd(),
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 5 * 60 * 1000,
      });

      const output = [stdout, stderr].filter(Boolean).join('\n').trim();
      const durationMs = Date.now() - started;
      this.logger.log(`Seed terminé en ${durationMs}ms`);

      return { output, durationMs };
    } catch (err) {
      const durationMs = Date.now() - started;
      const execErr = err as {
        stdout?: string;
        stderr?: string;
        message?: string;
      };
      const output = [execErr.stdout, execErr.stderr].filter(Boolean).join('\n').trim();
      this.logger.error(`Seed échoué après ${durationMs}ms`, output || execErr.message);

      throw new InternalServerErrorException({
        message: 'Échec du seed de démo.',
        output: output || execErr.message || 'Erreur inconnue',
        durationMs,
      });
    }
  }
}
