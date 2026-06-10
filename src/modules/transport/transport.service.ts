import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRIM_BASE = 'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia';
const IDFM_COVERAGE = 'idfm';
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

type NavitiaPlace = {
  id?: string;
  name?: string;
  embedded_type?: string;
  commercial_mode?: { id?: string; name?: string };
  physical_mode?: { id?: string; name?: string };
  line?: { id?: string; name?: string; commercial_mode?: { name?: string } };
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

  private async primFetch<T>(path: string, query?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${PRIM_BASE}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        apikey: this.getApiKey(),
      },
    });

    if (!response.ok) {
      this.logger.warn(`PRIM ${response.status} ${url.pathname}`);
      throw new BadGatewayException('Impossible de récupérer les données IDFM');
    }

    return response.json() as Promise<T>;
  }

  private resolveMode(place: NavitiaPlace): TransportMode {
    const label = [
      place.commercial_mode?.name,
      place.physical_mode?.name,
      place.line?.commercial_mode?.name,
      place.name,
    ]
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

  private extractLinesFromNearby(
    places: NavitiaPlace[],
  ): Map<string, { id: string; name: string; mode: TransportMode }> {
    const lines = new Map<string, { id: string; name: string; mode: TransportMode }>();

    for (const place of places) {
      if (place.embedded_type === 'line' && place.id && place.name) {
        lines.set(place.id, { id: place.id, name: place.name, mode: this.resolveMode(place) });
        continue;
      }
      if (place.line?.id && place.line?.name) {
        lines.set(place.line.id, {
          id: place.line.id,
          name: place.line.name,
          mode: this.resolveMode(place),
        });
      }
    }

    return lines;
  }

  private extractDisruptionMessages(payload: unknown): string[] {
    if (!payload || typeof payload !== 'object') return [];
    const root = payload as Record<string, unknown>;
    const reports = Array.isArray(root.line_reports) ? root.line_reports : [];
    const messages: string[] = [];

    for (const report of reports) {
      if (!report || typeof report !== 'object') continue;
      const r = report as Record<string, unknown>;

      const disruptions = Array.isArray(r.disruptions) ? r.disruptions : [];
      for (const d of disruptions) {
        if (!d || typeof d !== 'object') continue;
        const disruption = d as Record<string, unknown>;
        const msg =
          (typeof disruption.message === 'string' && disruption.message) ||
          (typeof disruption.cause === 'string' && disruption.cause) ||
          (typeof disruption.severity === 'string' && disruption.severity) ||
          '';
        if (msg.trim()) messages.push(msg.trim());
      }

      if (typeof r.message === 'string' && r.message.trim()) {
        messages.push(r.message.trim());
      }
    }

    return [...new Set(messages)].slice(0, 5);
  }

  async getDisruptionsNear(lat: number, lon: number): Promise<TransportDisruptionsResponseDto> {
    const nearbyPath = `/coverage/${IDFM_COVERAGE}/coords/${lon};${lat}/places_nearby`;
    const nearbyUrl = new URL(`${PRIM_BASE}${nearbyPath}`);
    nearbyUrl.searchParams.set('distance', '1200');
    nearbyUrl.searchParams.set('count', '40');
    nearbyUrl.searchParams.append('type[]', 'line');
    nearbyUrl.searchParams.append('type[]', 'stop_point');
    nearbyUrl.searchParams.set('disable_geojson', 'true');

    const nearbyResponse = await fetch(nearbyUrl.toString(), {
      headers: { Accept: 'application/json', apikey: this.getApiKey() },
    });
    if (!nearbyResponse.ok) {
      this.logger.warn(`PRIM places_nearby ${nearbyResponse.status}`);
      throw new BadGatewayException('Impossible de récupérer les lignes à proximité');
    }
    const nearby = (await nearbyResponse.json()) as { places_nearby?: NavitiaPlace[] };

    const lineMap = this.extractLinesFromNearby(nearby.places_nearby ?? []);
    const lineEntries = [...lineMap.values()].slice(0, MAX_LINES);

    const lines: TransportLineDisruptionDto[] = [];

    for (const line of lineEntries) {
      const lineId = encodeURIComponent(line.id);
      const reportsPath = `/line_reports/line_reports/coverage/${IDFM_COVERAGE}/lines/${lineId}/line_reports`;

      let messages: string[] = [];
      try {
        const reportsPayload = await this.primFetch<unknown>(reportsPath, { count: 10 });
        messages = this.extractDisruptionMessages(reportsPayload);
      } catch (err) {
        this.logger.debug(`line_reports skip ${line.name}: ${String(err)}`);
      }

      lines.push({
        lineId: line.id,
        lineName: line.name,
        mode: line.mode,
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
