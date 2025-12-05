import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';
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
        if (!this.apiKey) {
            throw new InternalServerErrorException('METALS_API_KEY is missing.');
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_11AM)
    async handleCronUpdateRates() {
        this.logger.log('Updating exchange rates via Metals API...');

        for (const pair of this.currencyPairsToFetch) {
            await this.fetchAndSaveRate(pair);
        }

        this.logger.log('Exchange rates update completed.');
    }

    private async fetchAndSaveRate(symbolPair: string): Promise<void> {
        const [base, target] = symbolPair.split('/');

        this.logger.log(`Fetching ${symbolPair} from Metals API...`);

        const url = `${this.baseUrl}?access_key=${this.apiKey}&base=${base}&symbols=${target}`;

        try {
            const response = await lastValueFrom(this.httpService.get(url));
            const data = response.data;

            if (!data.success) {
                this.logger.error(`MetalsAPI error for ${symbolPair}: ${data.error?.info}`);
                return;
            }

            const rateValue = data.rates[target];

            let finalRate = rateValue;

            if (!finalRate) {
                const reverseUrl = `${this.baseUrl}?access_key=${this.apiKey}&base=${target}&symbols=${base}`;
                const reverseRes = await lastValueFrom(this.httpService.get(reverseUrl));

                if (!reverseRes.data.success) {
                    this.logger.error(`Reverse fetch failed for ${symbolPair}`);
                    return;
                }

                const reverseRate = reverseRes.data.rates[base];

                if (reverseRate) {
                    finalRate = 1 / reverseRate;
                }
            }

            if (!finalRate || isNaN(finalRate)) {
                this.logger.error(`Invalid rate for ${symbolPair}`);
                return;
            }

            await this.rateModel.findOneAndUpdate(
                { symbolPair },
                { value: finalRate, updatedAt: new Date() },
                { upsert: true, new: true }
            );

            this.logger.log(`Saved ${symbolPair}: ${finalRate}`);

        } catch (err) {
            this.logger.error(`Metals API request failed for ${symbolPair}: ${err.message}`);
        }
    }

    async getRate(symbolPair: string): Promise<number> {
        const redisKey = `rate:${symbolPair}`;
        const redisRate = await this.redisService.get(redisKey);

        if (redisRate) {
            this.logger.verbose(`Redis cache hit: ${symbolPair} = ${redisRate}`);
            return parseFloat(redisRate);
        }

        const dbRate = await this.rateModel.findOne({ symbolPair }).exec();

        if (dbRate) {
            this.logger.verbose(`MongoDB cache hit: ${symbolPair} = ${dbRate.value}`);

            await this.redisService.set(redisKey, dbRate.value.toString(), 300);

            return dbRate.value;
        }

        this.logger.warn(`Cache miss and DB data miss → Fetching from MetalsAPI: ${symbolPair}`);
        await this.fetchAndSaveRate(symbolPair);

        const newRate = await this.rateModel.findOne({ symbolPair }).exec();

        if (newRate) {
            await this.redisService.set(redisKey, newRate.value.toString(), 300);
            return newRate.value;
        }

        this.logger.error(`Failed to fetch rate for ${symbolPair}`);
        return 0;
    }
}
