import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
    private readonly otpPrefix = 'otp:';
    private readonly ratePrefix = 'rate:';

    constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

    async setOtp(email: string, code: string, ttlSeconds: number = 300): Promise<string> {
        const key = this.otpPrefix + email;
        return this.redisClient.setex(key, ttlSeconds, code);
    }

    async getAndDelOtp(email: string, isDeleting: boolean): Promise<string | null> {
        const key = this.otpPrefix + email;
        const code = await this.redisClient.get(key);

        if (code && isDeleting) {
            await this.redisClient.del(key);
        }

        return code;
    }

    async getRate(pair: string): Promise<number | null> {
        const key = this.ratePrefix + pair;
        const rateString = await this.redisClient.get(key);
        
        return rateString ? parseFloat(rateString) : null; 
    }

    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
            await this.redisClient.set(key, value, 'EX', ttl);
        } else {
            await this.redisClient.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.redisClient.get(key);
    }

    async getAndDel(key: string): Promise<string | null> {
        const value = await this.redisClient.get(key);
        
        if (value) {
            await this.redisClient.del(key);
        }

        return value;
    }
}
