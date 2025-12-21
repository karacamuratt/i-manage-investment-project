import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class PriceAlertScheduler {
    private readonly logger = new Logger(PriceAlertScheduler.name);

    constructor(
        @InjectQueue('price-alert-queue') private priceAlertQueue: Queue,
    ) { }

    @Cron(CronExpression.EVERY_2_HOURS)
    async handleCron() {
        this.logger.log('CRON JOB triggered: Checking price-alert-trigger job to queue.');

        await this.priceAlertQueue.add('alert-trigger', {
            timestamp: new Date().toISOString(),
        }, {
            jobId: `alert-trigger-${Date.now()}`,
        });
    }

    async onApplicationBootstrap() {
        this.logger.log('Application started: Forcing initial alert-trigger job.');
        await this.priceAlertQueue.add('alert-trigger', { initial: true });
    }
}
