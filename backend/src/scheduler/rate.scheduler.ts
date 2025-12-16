import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class RateScheduler {
    private readonly logger = new Logger(RateScheduler.name);

    constructor(
        @InjectQueue('rate-queue') private rateQueue: Queue,
    ) { }

    @Cron(CronExpression.EVERY_4_HOURS)
    async handleCron() {
        this.logger.log('CRON JOB triggered: Adding update-rates job to queue.');

        await this.rateQueue.add('update-rates', {
            timestamp: new Date().toISOString(),
        }, {
            jobId: `rate-update-${Date.now()}`,
        });
    }

    /*
    async onApplicationBootstrap() {
        this.logger.log('Application started: Forcing initial rate update job.');
        await this.rateQueue.add('update-rates', { initial: true });
    }
    */
}
