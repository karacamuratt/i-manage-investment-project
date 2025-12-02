import { Module } from '@nestjs/common';
import { Rate, RateSchema } from './schemas/rate.schema';
import { RateService } from './rate.service';
import { RateResolver } from './rate.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        HttpModule,
        ConfigModule,
        ScheduleModule.forRoot(),
        MongooseModule.forFeature([{ name: Rate.name, schema: RateSchema }])
    ],
    providers: [RateService, RateResolver],
    exports: [RateService],
})

export class RateModule {}
