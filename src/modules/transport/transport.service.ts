import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PRIM_BASE = 'https://prim.iledefrance-mobilites.fr/marketplace/v2/navitia';
const MAX_LINES = 12;
const MAX_STOPS = 15;

export type TransportMode = 'metro' | 'rer' | 'train' | 'tram' | 'bus' | 'other';

export type TransportDisruptionStatus = 'normal' | 'disrupted';

export interface TransportLineDisruptionDto {
  lineId: string;
  lineName: string;
  mode: TransportMode;
  status: TransportDisruptionStatus;
  messages: string[];
}

export interface TransportStopMarkerDto {
  stopId: string;
  name: string;
  lat: number;
  lon: number;
  modes: string[];
  status: TransportDisruptionStatus;
  messages: string[];
}

export interface TransportDisruptionsResponseDto {
  lines: TransportLineDisruptionDto[];
  stops: TransportStopMarkerDto[];
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

type NavitiaPlaceNearby = {
  id?: string;
  name?: string;
  embedded_type?: string;
  coord?: { lat?: string | number; lon?: string | number };
  stop_area?: {
    id?: string;
    name?: string;
    coord?: { lat?: string | number; lon?: string | number };
    commercial_modes?: Array<{ name?: string }>;
  };
};

type NavitiaPlacesNearbyResponse = {
  places_nearby?: NavitiaPlaceNearby[];
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

  private shouldUseDemoFallback(): boolean {
    const forced = this.configService.get<string>('IDFM_DEMO_FALLBACK');
    if (forced === 'true') return true;
    if (forced === 'false') return false;
    return process.env.NODE_ENV !== 'production';
  }

  private demoFallback(): TransportDisruptionsResponseDto {
    this.logger.warn('Transport : fallback démo IDFM utilisé');
    return {
      lines: [
        {
          lineId: 'demo-metro-7',
          lineName: 'Métro 7',
          mode: 'metro',
          status: 'disrupted',
          messages: [
            'Trafic interrompu entre Maison Blanche et Villejuif Louis Aragon en raison de travaux de modernisation.',
          ],
        },
        {
          lineId: 'demo-tram-t3a',
          lineName: 'Tram T3a',
          mode: 'tram',
          status: 'disrupted',
          messages: ['Trafic ralenti sur l’ensemble de la ligne, perturbations à prévoir.'],
        },
        {
          lineId: 'demo-bus-47',
          lineName: 'Bus 47',
          mode: 'bus',
          status: 'disrupted',
          messages: ['Itinéraire dévié : arrêts non desservis avenue de Fontainebleau.'],
        },
        {
          lineId: 'demo-bus-185',
          lineName: 'Bus 185',
          mode: 'bus',
          status: 'normal',
          messages: [],
        },
      ],
      stops: [
        {
          stopId: 'demo-stop-1',
          name: 'Porte d’Italie',
          lat: 48.8178,
          lon: 2.3599,
          modes: ['metro', 'bus'],
          status: 'disrupted',
          messages: ['Métro 7 : trafic interrompu.'],
        },
        {
          stopId: 'demo-stop-2',
          name: 'Le Kremlin-Bicêtre',
          lat: 48.812,
          lon: 2.359,
          modes: ['metro', 'bus'],
          status: 'disrupted',
          messages: ['Métro 7 : trafic interrompu.'],
        },
        {
          stopId: 'demo-stop-3',
          name: 'Hôpital Kremlin-Bicêtre',
          lat: 48.8105,
          lon: 2.3641,
          modes: ['bus', 'tram'],
          status: 'disrupted',
          messages: ['Bus 47 : itinéraire dévié.'],
        },
        {
          stopId: 'demo-stop-4',
          name: 'Général Leclerc',
          lat: 48.8148,
          lon: 2.3552,
          modes: ['bus'],
          status: 'normal',
          messages: [],
        },
        {
          stopId: 'demo-stop-5',
          name: 'École de Mines',
          lat: 48.8162,
          lon: 2.3631,
          modes: ['bus'],
          status: 'normal',
          messages: [],
        },
      ],
      fetchedAt: new Date().toISOString(),
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

  private mapDisruptionsByStopId(disruptions: NavitiaDisruption[]): Map<string, string[]> {
    const byStop = new Map<string, string[]>();

    for (const disruption of disruptions) {
      const texts = this.extractDisruptionTexts(disruption);
      if (!texts.length) continue;

      for (const impacted of disruption.impacted_objects ?? []) {
        const pt = impacted.pt_object;
        if (pt?.embedded_type !== 'stop_area' || !pt.id) continue;

        const existing = byStop.get(pt.id) ?? [];
        byStop.set(pt.id, [...new Set([...existing, ...texts])].slice(0, 5));
      }
    }

    return byStop;
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

  private parseCoord(value: string | number | undefined): number | null {
    if (value == null || value === '') return null;
    const n = typeof value === 'number' ? value : Number.parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }

  private extractStopMarkers(
    places: NavitiaPlaceNearby[],
    disruptions: NavitiaDisruption[],
    areaLineMessages: string[],
  ): TransportStopMarkerDto[] {
    const disruptionsByStop = this.mapDisruptionsByStopId(disruptions);
    const stops: TransportStopMarkerDto[] = [];

    for (const place of places.slice(0, MAX_STOPS)) {
      if (place.embedded_type !== 'stop_area') continue;

      const stopArea = place.stop_area;
      const stopId = stopArea?.id ?? place.id;
      if (!stopId) continue;

      const coord = stopArea?.coord ?? place.coord;
      const lat = this.parseCoord(coord?.lat);
      const lon = this.parseCoord(coord?.lon);
      if (lat == null || lon == null) continue;

      const modes = [
        ...new Set((stopArea?.commercial_modes ?? []).map((m) => m.name).filter(Boolean)),
      ] as string[];
      const stopMessages = disruptionsByStop.get(stopId) ?? [];
      const messages = [...new Set([...stopMessages, ...areaLineMessages])].slice(0, 5);

      stops.push({
        stopId,
        name: place.name ?? stopArea?.name ?? 'Arrêt',
        lat,
        lon,
        modes,
        status: messages.length ? 'disrupted' : 'normal',
        messages,
      });
    }

    return stops;
  }

  async getDisruptionsNear(lat: number, lon: number): Promise<TransportDisruptionsResponseDto> {
    let linesPayload: NavitiaLinesResponse;
    let placesPayload: NavitiaPlacesNearbyResponse;

    try {
      [linesPayload, placesPayload] = await Promise.all([
        this.primFetch<NavitiaLinesResponse>(`/coords/${lon};${lat}/lines`, {
          distance: 1200,
          count: MAX_LINES,
          disable_geojson: 'true',
        }),
        this.primFetch<NavitiaPlacesNearbyResponse>(`/coords/${lon};${lat}/places_nearby`, {
          distance: 1200,
          count: MAX_STOPS,
          'type[]': 'stop_area',
          disable_geojson: 'true',
          depth: 2,
        }),
      ]);
    } catch (err) {
      if (this.shouldUseDemoFallback()) {
        this.logger.warn(`PRIM transport fetch failed, fallback démo: ${String(err)}`);
        return this.demoFallback();
      }
      if (err instanceof BadGatewayException || err instanceof ServiceUnavailableException) {
        throw err;
      }
      this.logger.warn(`PRIM transport fetch failed: ${String(err)}`);
      throw new BadGatewayException('Impossible de récupérer les lignes à proximité');
    }

    const disruptions = linesPayload.disruptions ?? [];
    const disruptionsByLine = this.mapDisruptionsByLineId(disruptions);
    const lines: TransportLineDisruptionDto[] = [];
    const areaLineMessages: string[] = [];

    for (const line of (linesPayload.lines ?? []).slice(0, MAX_LINES)) {
      if (!line.id || !line.name) continue;
      const messages = disruptionsByLine.get(line.id) ?? [];
      if (messages.length) {
        areaLineMessages.push(`${line.name} : ${messages[0]}`);
      }

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

    const stops = this.extractStopMarkers(
      placesPayload.places_nearby ?? [],
      disruptions,
      [...new Set(areaLineMessages)].slice(0, 5),
    );

    return {
      lines,
      stops,
      fetchedAt: new Date().toISOString(),
    };
  }
}
