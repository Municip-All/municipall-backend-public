import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class AiEngineService {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(AiEngineService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (apiKey && apiKey !== 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY is missing or using placeholder. AI features will be disabled.',
      );
    }
  }

  classifyReport(_text: string): string {
    if (!this.openai) {
      this.logger.error('OpenAI client not initialized. Cannot classify report.');
      return 'default';
    }
    // Logic for smart routing
    return 'technique';
  }

  generateSentimentSummary(_reports: any[]): string {
    if (!this.openai) {
      this.logger.error('OpenAI client not initialized. Cannot generate sentiment summary.');
      return 'Indisponible (Clé API manquante)';
    }
    return 'La satisfaction globale est positive.';
  }
}
