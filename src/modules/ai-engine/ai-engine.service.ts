import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AiEnrichmentPayload {
  report_id: number;
  tenant_id: string;
  user_id?: number;
  content: string;
  lat?: number;
  lon?: number;
}

export interface AiEnrichmentResult {
  category: string;
  municipal_service: string;
  sentiment_score: number;
  is_spam: boolean;
  duplicate_of_id: number | null;
  ai_confidence: number;
  ai_status: string;
  reply?: string;
}

@Injectable()
export class AiEngineService {
  private readonly logger = new Logger(AiEngineService.name);
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('IA_BASE_URL') ?? 'http://localhost:8000';
  }

  /**
   * Appelle le pipeline IA (FastAPI) pour enrichir un signalement déjà créé.
   * Retourne null si le service IA est injoignable (le backend continue normalement).
   */
  async enrichReport(payload: AiEnrichmentPayload): Promise<AiEnrichmentResult | null> {
    try {
      const res = await fetch(`${this.baseUrl}/reporting/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        this.logger.warn(`IA enrich returned ${res.status}: ${await res.text()}`);
        return null;
      }

      const data = (await res.json()) as AiEnrichmentResult;
      this.logger.log(
        `IA enriched report ${payload.report_id} → category=${data.category} spam=${data.is_spam}`,
      );
      return data;
    } catch (err) {
      this.logger.error(`IA enrich unreachable: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Chatbot citoyen via l'IA.
   */
  async chatCitoyen(
    user_id: string,
    message: string,
  ): Promise<{ reply: string; category: string; sentiment_score: number } | null> {
    try {
      const res = await fetch(`${this.baseUrl}/reporting/chat/citoyen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id, message }),
      });
      if (!res.ok) return null;
      return (await res.json()) as { reply: string; category: string; sentiment_score: number };
    } catch (err) {
      this.logger.error(`IA chat/citoyen unreachable: ${(err as Error).message}`);
      return null;
    }
  }
}
