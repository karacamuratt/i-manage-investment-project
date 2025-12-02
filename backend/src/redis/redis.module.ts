import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
        provide: 'REDIS_CLIENT',
        useFactory: async (configService: ConfigService) => {
            const Redis = require('ioredis');
            return new Redis({
                host: configService.get<string>('REDIS_HOST'),
                port: configService.get<number>('REDIS_PORT'),
            });
        },
        inject: [ConfigService],
        },
        RedisService,
    ],
    exports: [RedisService],
})

export class RedisModule {}
