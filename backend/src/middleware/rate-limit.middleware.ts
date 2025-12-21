import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config'

export function createRateLimitMiddleware(
    redisService: RedisService,
    configService: ConfigService
) {
    return rateLimit({
        windowMs: configService.get<number>('RATE_LIMIT_WINDOW_MS'),
        max: configService.get<number>('RATE_LIMIT_MAX'),
        standardHeaders: true,
        legacyHeaders: false,

        store: new RedisStore({
            sendCommand: (...args: string[]) =>
                (redisService as any).redisClient.call(...args),
        }),

        handler: (req, res) => {
            res.status(429).json({
                message: 'Too many requests, please try again later.',
            });
        },
    });
}
