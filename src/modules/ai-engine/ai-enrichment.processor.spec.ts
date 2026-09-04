import { InternalServerErrorException } from '@nestjs/common';
import { Job } from 'bullmq';
import { DataSource } from 'typeorm';
import { AiEnrichmentProcessor } from './ai-enrichment.processor';
import { AiEngineService, AiEnrichmentPayload } from './ai-engine.service';

describe('AiEnrichmentProcessor', () => {
  const enrichReport = jest.fn();
  const query = jest.fn();
  let processor: AiEnrichmentProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new AiEnrichmentProcessor(
      { enrichReport } as unknown as AiEngineService,
      { query } as unknown as DataSource,
    );
  });

  it('process enriches and updates report', async () => {
    enrichReport.mockResolvedValue({
      category: 'Voirie',
      municipal_service: 'voirie',
      sentiment_score: 0.1,
      ai_confidence: 0.9,
      is_spam: false,
      duplicate_of_id: null,
    });
    query.mockResolvedValue(undefined);

    const job = {
      data: {
        report_id: 5,
        tenant_id: 'c1',
        user_id: 2,
        content: 'nid de poule',
        lat: 1,
        lon: 2,
      },
      attemptsMade: 0,
    } as Job<AiEnrichmentPayload>;

    await processor.process(job);

    expect(enrichReport).toHaveBeenCalledWith(job.data);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE reports SET'),
      expect.arrayContaining(['Voirie', 'voirie', 0.1, 0.9, false, null, false, 5, 'c1']),
    );
  });

  it('throws when AI returns null', async () => {
    enrichReport.mockResolvedValue(null);
    const job = {
      data: { report_id: 1, tenant_id: 'c1', content: 'x' },
      attemptsMade: 0,
    } as Job<AiEnrichmentPayload>;
    await expect(processor.process(job)).rejects.toThrow(InternalServerErrorException);
  });

  it('swallows DB errors after successful enrichment', async () => {
    enrichReport.mockResolvedValue({
      category: 'Autre',
      municipal_service: 'x',
      sentiment_score: 0,
      ai_confidence: 0.5,
      is_spam: true,
      duplicate_of_id: 9,
    });
    query.mockRejectedValue(new Error('db'));
    const job = {
      data: { report_id: 3, tenant_id: 'c1', content: 'spam' },
      attemptsMade: 1,
    } as Job<AiEnrichmentPayload>;
    await expect(processor.process(job)).resolves.toBeUndefined();
  });
});
