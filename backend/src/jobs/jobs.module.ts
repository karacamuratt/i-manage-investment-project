import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RateModule } from '../rate/rate.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
        RateModule,
        PortfolioModule
    ],
    providers: [],
    exports: [BullModule],
})

export class JobsModule { }
