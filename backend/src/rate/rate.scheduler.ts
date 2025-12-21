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

    @Cron(CronExpression.EVERY_2_HOURS)
    async handleCron() {
        this.logger.log('CRON JOB triggered: Adding update-rates job to queue.');

        await this.rateQueue.add(
            'update-rates',
            { source: 'cron' },
            {
                jobId: 'rate-update',
                removeOnComplete: true,
                removeOnFail: true,
            },
        );
    }

    /*
    async onApplicationBootstrap() {
        this.logger.log('Application started: Forcing initial rate update job.');
        await this.rateQueue.add('update-rates', { initial: true });
    }
    */
}
