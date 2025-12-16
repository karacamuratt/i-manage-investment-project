import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { RateService } from '../rate/rate.service';
import { PortfolioService } from 'src/portfolio/portfolio.service';

@Processor('price-alert-queue')
export class PriceAlertProcessor {
    private readonly logger = new Logger(PriceAlertProcessor.name);

    constructor(private readonly portfolioService: PortfolioService) { }

    @Process('alert-trigger')
    async triggerPriceAlerts(job: Job) {
        this.logger.log(`Processing job ${job.id} to trigger the price alerts.`);

        try {
            await this.portfolioService.checkAllAlerts();

            this.logger.log(`Job ${job.id} completed successfully.`);
        } catch (error) {
            this.logger.error(`Job ${job.id} failed: ${error.message}`, error.stack);
            throw error;
        }
    }
}
