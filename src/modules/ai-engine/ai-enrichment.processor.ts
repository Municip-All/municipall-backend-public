import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { AiEngineService, AiEnrichmentPayload } from './ai-engine.service';

export const AI_ENRICHMENT_QUEUE = 'ai-enrichment';

export type AiEnrichmentJobData = AiEnrichmentPayload;

@Processor(AI_ENRICHMENT_QUEUE)
export class AiEnrichmentProcessor extends WorkerHost {
  private readonly logger = new Logger(AiEnrichmentProcessor.name);

  constructor(
    private readonly aiEngineService: AiEngineService,
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async process(job: Job<AiEnrichmentJobData>): Promise<void> {
    const { report_id, tenant_id, user_id, content, lat, lon } = job.data;
    this.logger.log(
      `Processing AI enrichment for report ${report_id} (attempt ${job.attemptsMade + 1})`,
    );

    const aiResult = await this.aiEngineService.enrichReport({
      report_id,
      tenant_id,
      user_id,
      content,
      lat,
      lon,
    });

    if (!aiResult) {
      throw new Error(`AI enrichment returned null for report ${report_id}`);
    }

    await this.dataSource.query(
      `UPDATE reports SET
        category = $1, ai_category = $1, municipal_service = $2,
        sentiment_score = $3, ai_confidence = $4, is_spam = $5,
        duplicate_of_id = $6, ai_processed = TRUE,
        status = CASE
          WHEN $5 = TRUE THEN 'Rejeté'
          WHEN $6 IS NOT NULL THEN 'Doublon'
          ELSE status
        END
      WHERE id = $7 AND tenant_id = $8`,
      [
        aiResult.category,
        aiResult.municipal_service,
        aiResult.sentiment_score,
        aiResult.ai_confidence,
        aiResult.is_spam,
        aiResult.duplicate_of_id ?? null,
        report_id,
        tenant_id,
      ],
    );

    this.logger.log(`AI enrichment completed for report ${report_id}`);
  }
}
