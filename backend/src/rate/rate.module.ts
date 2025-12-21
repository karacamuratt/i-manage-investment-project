import { Module } from '@nestjs/common';
import { Rate, RateSchema } from './schemas/rate.schema';
import { RateService } from './rate.service';
import { RateResolver } from './rate.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { RateScheduler } from './rate.scheduler';
import { RateProcessor } from 'src/jobs/rate.processor';

@Module({
    imports: [
        HttpModule,
        ConfigModule,
        ScheduleModule.forRoot(),
        MongooseModule.forFeature([{ name: Rate.name, schema: RateSchema }]),
        BullModule.registerQueue(
            {
                name: 'rate-queue',
            }
        ),
    ],
    providers: [RateService, RateResolver, RateScheduler, RateProcessor],
    exports: [RateService],
})

export class RateModule { }
