import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { RateService } from '../rate/rate.service';

@Processor('rate-queue')
export class RateProcessor {
    private readonly logger = new Logger(RateProcessor.name);

    constructor(private readonly rateService: RateService) {}

    @Process('update-rates')
    async handleUpdateRates(job: Job) {
        this.logger.log(`Processing job ${job.id} to update all rates.`);
        
        try {
            //await this.rateService.fetchAndStoreRates(); 
            
            this.logger.log(`Job ${job.id} completed successfully.`);
        } catch (error) {
            this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
            throw error; 
        }
    }
}
