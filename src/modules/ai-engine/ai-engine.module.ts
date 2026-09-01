import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiEngineService } from './ai-engine.service';
import { AiEngineController } from './ai-engine.controller';
import { AiEnrichmentProcessor, AI_ENRICHMENT_QUEUE } from './ai-enrichment.processor';

@Module({
  controllers: [AiEngineController],
  imports: [
    BullModule.registerQueue({
      name: AI_ENRICHMENT_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: { age: 24 * 3600 },
      },
    }),
  ],
  providers: [AiEngineService, AiEnrichmentProcessor],
  // ReportsModule injects @InjectQueue(AI_ENRICHMENT_QUEUE) — export BullModule so the queue is visible there.
  exports: [AiEngineService, BullModule],
})
export class AiEngineModule {}
