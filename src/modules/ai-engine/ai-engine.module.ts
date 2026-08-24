import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiEngineService } from './ai-engine.service';
import { AiEnrichmentProcessor, AI_ENRICHMENT_QUEUE } from './ai-enrichment.processor';

@Module({
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
    TypeOrmModule.forFeature([]),
  ],
  providers: [AiEngineService, AiEnrichmentProcessor],
  exports: [AiEngineService],
})
export class AiEngineModule {}
