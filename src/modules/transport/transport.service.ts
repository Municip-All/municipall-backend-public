import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRIM_BASE = 'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia';
const MAX_LINES = 12;

export type TransportMode = 'metro' | 'rer' | 'train' | 'tram' | 'bus' | 'other';

export type TransportDisruptionStatus = 'normal' | 'disrupted';

export interface TransportLineDisruptionDto {
  lineId: string;
  lineName: string;
  mode: TransportMode;
  status: TransportDisruptionStatus;
  messages: string[];
}

export interface TransportDisruptionsResponseDto {
  lines: TransportLineDisruptionDto[];
  fetchedAt: string;
}

type NavitiaLine = {
  id?: string;
  name?: string;
  commercial_mode?: { id?: string; name?: string };
  physical_mode?: { id?: string; name?: string };
};

type NavitiaDisruption = {
  messages?: Array<{ text?: string; channel?: { name?: string } } | string>;
  impacted_objects?: Array<{
    pt_object?: { embedded_type?: string; id?: string; name?: string };
  }>;
};

type NavitiaLinesResponse = {
  lines?: NavitiaLine[];
  disruptions?: NavitiaDisruption[];
};

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);

  constructor(private readonly configService: ConfigService) {}

  private getApiKey(): string {
    const key = this.configService.get<string>('IDFM_API_KEY')?.trim();
    if (!key) {
      throw new ServiceUnavailableException(
        'Service transports temporairement indisponible (configuration serveur)',
      );
    }
    return key;
  }

  private primHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      apiKey: this.getApiKey(),
    };
  }

  private handlePrimError(status: number, context: string): never {
    this.logger.warn(`PRIM ${status} ${context}`);
    if (status === 401 || status === 403) {
      throw new ServiceUnavailableException(
        'Service transports indisponible (clé API IDFM invalide ou expirée)',
      );
    }
    throw new BadGatewayException('Impossible de récupérer les données IDFM');
  }

  private async primFetch<T>(path: string, query?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${PRIM_BASE}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }

    const response = await fetch(url.toString(), {
      headers: this.primHeaders(),
    });

    if (!response.ok) {
      this.handlePrimError(response.status, url.pathname);
    }

    return response.json() as Promise<T>;
  }

  private resolveMode(line: NavitiaLine): TransportMode {
    const label = [line.commercial_mode?.name, line.physical_mode?.name, line.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (label.includes('metro') || label.includes('métro')) return 'metro';
    if (label.includes('rer')) return 'rer';
    if (label.includes('tram')) return 'tram';
    if (label.includes('train') || label.includes('transilien')) return 'train';
    if (label.includes('bus')) return 'bus';
    return 'other';
  }

  private stripHtml(text: string): string {
    return text
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractDisruptionTexts(disruption: NavitiaDisruption): string[] {
    const messages: string[] = [];

    for (const entry of disruption.messages ?? []) {
      const raw = typeof entry === 'string' ? entry : entry?.text;
      if (!raw?.trim()) continue;
      const clean = this.stripHtml(raw);
      if (clean) messages.push(clean);
    }

    return [...new Set(messages)].slice(0, 5);
  }

  private mapDisruptionsByLineId(disruptions: NavitiaDisruption[]): Map<string, string[]> {
    const byLine = new Map<string, string[]>();

    for (const disruption of disruptions) {
      const texts = this.extractDisruptionTexts(disruption);
      if (!texts.length) continue;

      for (const impacted of disruption.impacted_objects ?? []) {
        const pt = impacted.pt_object;
        if (pt?.embedded_type !== 'line' || !pt.id) continue;

        const existing = byLine.get(pt.id) ?? [];
        byLine.set(pt.id, [...new Set([...existing, ...texts])].slice(0, 5));
      }
    }

    return byLine;
  }

  async getDisruptionsNear(lat: number, lon: number): Promise<TransportDisruptionsResponseDto> {
    let payload: NavitiaLinesResponse;
    try {
      payload = await this.primFetch<NavitiaLinesResponse>(`/coords/${lon};${lat}/lines`, {
        distance: 1200,
        count: MAX_LINES,
        disable_geojson: 'true',
      });
    } catch (err) {
      if (err instanceof BadGatewayException || err instanceof ServiceUnavailableException) {
        throw err;
      }
      this.logger.warn(`PRIM coords/lines failed: ${String(err)}`);
      throw new BadGatewayException('Impossible de récupérer les lignes à proximité');
    }

    const disruptionsByLine = this.mapDisruptionsByLineId(payload.disruptions ?? []);
    const lines: TransportLineDisruptionDto[] = [];

    for (const line of (payload.lines ?? []).slice(0, MAX_LINES)) {
      if (!line.id || !line.name) continue;
      const messages = disruptionsByLine.get(line.id) ?? [];

      lines.push({
        lineId: line.id,
        lineName: line.name,
        mode: this.resolveMode(line),
        status: messages.length ? 'disrupted' : 'normal',
        messages,
      });
    }

    lines.sort((a, b) => {
      if (a.status === b.status) return a.lineName.localeCompare(b.lineName, 'fr');
      return a.status === 'disrupted' ? -1 : 1;
    });

    return {
      lines,
      fetchedAt: new Date().toISOString(),
    };
  }
}
