import { Module } from '@nestjs/common';
import { RateScheduler } from './rate.scheduler';
import { JobsModule } from 'src/jobs/jobs.module';

@Module({
    imports: [
        JobsModule,
    ],
    providers: [RateScheduler],
})

export class SchedulerModule {}
