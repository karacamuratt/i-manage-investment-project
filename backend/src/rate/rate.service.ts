import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Rate, RateDocument } from './schemas/rate.schema';

@Injectable()
export class RateService {
    private readonly logger = new Logger(RateService.name);
    private readonly baseUrl = 'https://www.alphavantage.co/query';
    private readonly apiKey: string;
    private readonly currencyPairsToFetch = ['USD/TRY', 'EUR/TRY', 'GBP/TRY']; 

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @InjectModel(Rate.name) private rateModel: Model<RateDocument>,
    ) {
        this.apiKey = this.configService.get<string>('ALPHA_VANTAGE_API_KEY')!;

        if (!this.apiKey) {
            this.logger.error('ALPHA_VANTAGE_API_KEY is not set.');
            throw new InternalServerErrorException('API key is missing.');
        }
    }
  
    @Cron(CronExpression.EVERY_DAY_AT_10AM) 
    async handleCronUpdateRates() {
        this.logger.log('Start: Updating exchange rates via cron...');
        
        for (const pair of this.currencyPairsToFetch) {
            await this.fetchAndSaveRate(pair);
        }
        
        this.logger.log('End: Exchange rates updated.');
    }

    private async fetchAndSaveRate(symbolPair: string): Promise<void> {
        if (!symbolPair || symbolPair.length < 5 || !symbolPair.includes('/')) {
            this.logger.error(`Invalid currency pair format: ${symbolPair}`);
            return; 
        }

        this.logger.log(`Fetching ${symbolPair} rate from Alpha Vantage...`);
        const [base, target] = symbolPair.split('/');
        
        const url = `${this.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${base}&to_currency=${target}&apikey=${this.apiKey}`;
        
        try {
            const response = await lastValueFrom(this.httpService.get(url));
            const data = response.data;
            
            if (data['Error Message'] || data.Information) {
                this.logger.error(`API Error for ${symbolPair}: ${data['Error Message'] || data.Information}`);
                return;
            }

            const rateKey = 'Realtime Currency Exchange Rate';
            const rateInfo = data[rateKey];
            const rateValue = parseFloat(rateInfo['5. Exchange Rate']);

            if (isNaN(rateValue) || rateValue <= 0) {
                this.logger.error(`Invalid exchange rate received: ${rateValue}`);
                return; 
            }

            await this.rateModel.findOneAndUpdate(
                { symbolPair }, 
                { value: rateValue, updatedAt: new Date() },
                { upsert: true, new: true }
            );

            this.logger.log(`Success: ${symbolPair} = ${rateValue}`);
            
        } catch (error) {
            this.logger.error(`API request failed: ${error.message}`);
        }
    }

    async getRate(symbolPair: string): Promise<number> {
        
        const cachedRate = await this.rateModel.findOne({ symbolPair }).exec();

        if (cachedRate) {
            this.logger.verbose(`Fetched from cache: ${symbolPair} = ${cachedRate.value}`);
            return cachedRate.value;
        }
        
        this.logger.warn(`Not found in cache. Fetching ${symbolPair} from API...`);
        await this.fetchAndSaveRate(symbolPair);
        
        const newlyFetchedRate = await this.rateModel.findOne({ symbolPair }).exec();

        if (newlyFetchedRate) {
            return newlyFetchedRate.value;
        }
        
        this.logger.error(`Exchange rate not found and could not be fetched from API: ${symbolPair}`);
        return 0; 
    }
}
