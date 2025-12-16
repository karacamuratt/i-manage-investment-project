import { Module } from '@nestjs/common';
import { RateScheduler } from './rate.scheduler';
import { JobsModule } from 'src/jobs/jobs.module';
import { PriceAlertScheduler } from './price-alert.scheduler';

@Module({
    imports: [
        JobsModule,
    ],
    providers: [RateScheduler, PriceAlertScheduler],
})

export class SchedulerModule { }
