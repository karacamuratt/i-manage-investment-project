import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RateProcessor } from './rate.processor';
import { RateModule } from '../rate/rate.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PriceAlertScheduler } from 'src/scheduler/price-alert.scheduler';
import { PriceAlertProcessor } from './price-alert.processor';
import { PortfolioModule } from 'src/portfolio/portfolio.module';

@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                redis: {
                    host: configService.get<string>('REDIS_HOST'),
                    port: configService.get<number>('REDIS_PORT'),
                },
            }),
            inject: [ConfigService],
        }),
        BullModule.registerQueue(
            {
                name: 'rate-queue',
            },
            {
                name: 'price-alert-queue',
            }
        ),
        RateModule,
        PortfolioModule
    ],
    providers: [
        RateProcessor,
        PriceAlertProcessor,
        PriceAlertScheduler
    ],
    exports: [BullModule],
})

export class JobsModule { }
