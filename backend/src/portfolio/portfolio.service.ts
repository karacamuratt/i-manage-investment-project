import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Portfolio, PortfolioDocument } from './schemas/portfolio.schema';
import { CreatePortfolioInput, PortfolioType } from './dto/portfolio.dto';
import { RateService } from '../rate/rate.service';
import { User } from '../user/schemas/user.schema';
import { SellPortfolioInput } from './dto/sell-portfolio.dto';
import { getCalculatedGoldPrices } from 'src/gold/gold.service';

type PortfolioBase = Omit<PortfolioType, 'currentValueTRY'>;

@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);

    constructor(
        @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
        private readonly rateService: RateService,
    ) {}

    async create(input: CreatePortfolioInput, user: User): Promise<PortfolioType> {
        const goldPrices = await getCalculatedGoldPrices();
        const rateSymbol = `${input.symbol}/${user.baseCurrency}`;
        let currentRate;

        switch (input.symbol) {
            case 'XAU':
                currentRate = goldPrices.onsAltinPrice;
                break;
            case 'GRAM_ALTIN':
                currentRate = goldPrices.gramAltinPrice;
                break;
            case 'CEYREK_ALTIN':
                currentRate = goldPrices.ceyrekAltinPrice;
                break;
            case 'TAM_ALTIN':
                currentRate = goldPrices.tamAltinPrice;
                break;
            case 'ATA_ALTIN':
                currentRate = goldPrices.ataAltinPrice;
                break;
            case 'USD':
            case 'EUR':
                currentRate = await this.rateService.getRate(rateSymbol);
                break;
            default:
                throw new Error(`Desteklenmeyen veya fiyatı belirlenemeyen varlık: ${rateSymbol}`);
        }

        const newPortfolioItem = new this.portfolioModel({
            ...input,
            user: user._id,
            purchaseRateTRY: currentRate,
            baseCurrency: user.baseCurrency,
        });

        this.logger.log('newPortfolioItem: ' + newPortfolioItem);
        
        await newPortfolioItem.save();
        this.logger.log(`New portfolio item created for user ${user._id}`);
        
        const baseItem = newPortfolioItem.toJSON() as unknown as PortfolioBase;
        
        return this.calculateCurrentValue(baseItem);
    }

    private async calculateCurrentValue(item: PortfolioBase): Promise<PortfolioType> {
        const calculatedItem: PortfolioType = { 
            ...item, 
            currentValueTRY: 0
        }; 
        
        const { symbol, amount, baseCurrency } = calculatedItem;

        if (symbol === baseCurrency) {
            calculatedItem.currentValueTRY = amount;
            return calculatedItem;
        }
        
        const goldPrices = await getCalculatedGoldPrices();
        let currentRate: number | undefined;

        switch (symbol) {
            case 'XAU':
                currentRate = goldPrices.onsAltinPrice;
                break;
            case 'GRAM_ALTIN':
                currentRate = goldPrices.gramAltinPrice;
                break;
            case 'CEYREK_ALTIN':
                currentRate = goldPrices.ceyrekAltinPrice;
                break;
            case 'TAM_ALTIN':
                currentRate = goldPrices.tamAltinPrice;
                break;
            case 'ATA_ALTIN':
                currentRate = goldPrices.ataAltinPrice;
                break;
        }

        try {
            if (currentRate !== undefined) {
                calculatedItem.currentValueTRY = amount * currentRate;

            } else {
                const rateSymbol = `${symbol}/${baseCurrency}`;
                const rate = await this.rateService.getRate(rateSymbol); 
                
                if (rate > 0) {
                    calculatedItem.currentValueTRY = amount * rate; 
                } else {
                    calculatedItem.currentValueTRY = 0;
                }
            }
        } catch (e) {
            this.logger.warn(`Rate calculation failed for ${symbol}: ${e.message}`);
            calculatedItem.currentValueTRY = 0;
        }
        
        return calculatedItem; 
    }

    async findAllByUser(userId: string): Promise<PortfolioType[]> {
        const portfolioItems = await this.portfolioModel.find({ user: userId }).exec();
        const itemsWithValues = await Promise.all(
            portfolioItems.map(async (item) => {
                const baseItem = item.toJSON() as unknown as PortfolioBase;

                let dateObject: Date;

                if (!baseItem.purchaseRateTRY) {
                    baseItem.purchaseRateTRY = 0; 
                }
                
                if (typeof baseItem.createdAt === 'string' || typeof baseItem.createdAt === 'number') {
                    dateObject = new Date(Number(baseItem.createdAt));
                } else {
                    dateObject = baseItem.createdAt;
                }
                
                const calculatedBaseItem = await this.calculateCurrentValue(baseItem);

                const finalItem: PortfolioType = { 
                    ...calculatedBaseItem, 
                    createdAt: dateObject
                };

                return {
                    id: finalItem.id,
                    symbol: finalItem.symbol,
                    amount: finalItem.amount,
                    baseCurrency: finalItem.baseCurrency,
                    currentValueTRY: finalItem.currentValueTRY,
                    createdAt: finalItem.createdAt, 
                    purchaseRateTRY: finalItem.purchaseRateTRY
                } as PortfolioType;
            })
        );
        
        return itemsWithValues;
    }

    async sellPortfolio(userId: string, input: SellPortfolioInput): Promise<PortfolioType> {
        const { id, amount } = input;
        const item = await this.portfolioModel.findOne({ 
            _id: id, 
            user: userId 
        }).exec();

        if (!item) {
            throw new NotFoundException(`No portfolio records were found matching ID ${id}.`);
        }

        if (item.amount < amount) {
            throw new BadRequestException(`The quantity to be sold (${amount}) exceeds the available quantity (${item.amount}).`);
        }

        let updatedItem: PortfolioDocument;

        if (item.amount === amount) {
            await this.portfolioModel.deleteOne({ _id: id }).exec();
            item.amount = 0; 
            updatedItem = item;
        } else {
            item.amount -= amount;
            updatedItem = await item.save();
        }
        
        const baseItem = updatedItem.toJSON() as unknown as PortfolioBase;

        const calculatedItem = await this.calculateCurrentValue(baseItem);
        
        return {
            ...calculatedItem,
            amount: calculatedItem.amount, 
            createdAt: calculatedItem.createdAt.toISOString(), 
        } as unknown as PortfolioType;
    }
}
