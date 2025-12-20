import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rate, RateDocument } from './schemas/rate.schema';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class RateService {
    private readonly logger = new Logger(RateService.name);
    private readonly baseUrl = 'https://metals-api.com/api/latest';
    private readonly apiKey: string;

    private readonly currencyPairsToFetch = [
        'USD/TRY',
        'EUR/TRY',
        'XAU/USD',
        'TRY/USD',
        'TRY/EUR',
    ];

    constructor(
        private readonly httpService: HttpService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
        @InjectModel(Rate.name) private rateModel: Model<RateDocument>,
    ) {
        this.apiKey = this.configService.get<string>('METALS_API_KEY')!;
    }

    public async fetchAllRatesOnce(): Promise<void> {
        this.logger.log('Fetching all rates (ONE request)...');

        const symbols = ['TRY', 'EUR', 'XAU'];
        const url = `${this.baseUrl}?access_key=${this.apiKey}&base=USD&symbols=${symbols.join(',')}`;

        const response = await lastValueFrom(this.httpService.get(url));
        const data = response.data;

        if (!data.success) {
            this.logger.error(`MetalsAPI failed: ${data.error?.info}`);
            return;
        }

        const rates = data.rates;

        // calculate each pair
        for (const pair of this.currencyPairsToFetch) {
            const [base, target] = pair.split('/');

            const value = this.calculateRate(base, target, rates);

            if (!value) {
                this.logger.error(`Cannot calculate ${pair}`);
                continue;
            }

            await this.saveToDbAndRedis(pair, value);

            const newRate = await this.rateModel.findOne({ pair }).exec();

            if (newRate) {
                this.logger.verbose(
                    `[fetchAllRatesOnce()] Returned after Metals API fetch → ${pair} = ${newRate.value}`
                );

                const redisKey = `rate:${pair}`;
                await this.redisService.set(redisKey, newRate.value.toString(), 300);
            }
        }

        this.logger.log('All rates updated (ONE call).');
    }

    private calculateRate(base: string, target: string, rates: any): number {
        if (base === 'USD') {
            return rates[target];
        }

        if (target === 'USD') {
            return 1 / rates[base];
        }

        return (rates[target] / rates[base]);
    }

    private async saveToDbAndRedis(pair: string, value: number) {
        await this.rateModel.findOneAndUpdate(
            { symbolPair: pair },
            { value, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        await this.redisService.set(`rate:${pair}`, value.toString(), 300);

        this.logger.log(`Saved ${pair}: ${value}`);
    }

    async getRate(symbolPair: string): Promise<number> {
        const redisKey = `rate:${symbolPair}`;
        const redisVal = await this.redisService.get(redisKey);

        if (redisVal) {
            this.logger.verbose(
                `[CACHE-REDIS] Returned from Redis cache → ${symbolPair} = ${redisVal}`
            );
            return parseFloat(redisVal);
        }

        const dbRate = await this.rateModel.findOne({ symbolPair }).exec();

        if (dbRate) {
            this.logger.verbose(
                `[CACHE-MONGO] Returned from MongoDB cache → ${symbolPair} = ${dbRate.value}`
            );

            await this.redisService.set(redisKey, dbRate.value.toString(), 300);
            return dbRate.value;
        }

        /*
        await this.fetchAllRatesOnce(); // update everything

        const newRate = await this.rateModel.findOne({ symbolPair }).exec();

        if (newRate) {
            this.logger.verbose(
                `[FETCH-METALS-API] Returned after Metals API fetch → ${symbolPair} = ${newRate.value}`
            );
            await this.redisService.set(redisKey, newRate.value.toString(), 300);
            return newRate.value;
        }
        */

        this.logger.error(`[FAILED] Could not obtain rate for ${symbolPair}`);
        return 0;
    }
}
