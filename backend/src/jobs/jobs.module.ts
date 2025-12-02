import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RateProcessor } from './rate.processor';
import { RateModule } from '../rate/rate.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
        BullModule.registerQueue({
        name: 'rate-queue',
        }),
        RateModule,
    ],
    providers: [RateProcessor],
    exports: [BullModule],
})

export class JobsModule {}
