import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Portfolio, PortfolioDocument } from './schemas/portfolio.schema';
import { CreatePortfolioInput, PortfolioType } from './dto/portfolio.dto';
import { RateService } from '../rate/rate.service';
import { User } from '../user/schemas/user.schema';
import { Alert, AlertDocument } from './schemas/alert.schema'
import { SellPortfolioInput } from './dto/sell-portfolio.dto';
import { GoldService } from './../gold/gold.service';
import { CreateAlertInput } from './dto/create-alert.input';
import { AlertGateway } from 'src/gateway/alert.gateway';

type PortfolioBase = Omit<PortfolioType, 'currentValueTRY'>;

@Injectable()
export class PortfolioService {
    private readonly logger = new Logger(PortfolioService.name);

    constructor(
        @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
        @InjectModel(Alert.name) private readonly alertModel: Model<AlertDocument>,
        private readonly rateService: RateService,
        private readonly goldService: GoldService,
        private readonly alertGateway: AlertGateway
    ) { }

    async checkAllAlerts() {
        const activeAlerts = await this.alertModel.find({
            isTriggered: false,
        });

        for (const alert of activeAlerts) {
            let currentPrice;


            switch (alert.symbol) {
                case 'USD':
                case 'EUR':
                    currentPrice = await this.rateService.getRate(alert.symbol + '/TRY');
                    break;
                default:
                    const goldPrices = await this.goldService.getCalculatedGoldPrices();
                    currentPrice = goldPrices[alert.symbol];
            }

            if (currentPrice >= alert.targetPrice) {
                alert.isTriggered = true;
                await alert.save();

                this.alertGateway.emitPriceAlert(
                    alert.userId.toString(),
                    {
                        symbol: alert.symbol,
                        targetPrice: alert.targetPrice,
                        currentPrice,
                    }
                );
            }
        }
    }

    async createAlert(
        input: CreateAlertInput,
        user: User,
    ): Promise<Alert> {
        const existingAlert = await this.alertModel.findOne({
            symbol: input.symbol,
            targetPrice: input.targetPrice,
            userId: user._id,
            isTriggered: false,
        });

        if (existingAlert) {
            throw new ConflictException('Alert already exists for this symbol and price');
        }

        const alert = new this.alertModel({
            symbol: input.symbol,
            targetPrice: input.targetPrice,
            userId: user._id,
            isTriggered: false,
        });

        return alert.save();
    }

    async getUserAlerts(userId: string): Promise<Alert[]> {
        this.logger.log("getUserAlerts -> userId: " + userId);
        return this.alertModel
            .find({
                userId: new Types.ObjectId(userId),
                isTriggered: false,
            })
            .sort({ createdAt: -1 })
            .exec();
    }

    async deleteAlerts(userId: string, ids: string[]): Promise<boolean> {
        if (!ids.length) return true;

        const objectIds = ids.map(id => new Types.ObjectId(id));

        const result = await this.alertModel.deleteMany({
            _id: { $in: objectIds },
            userId: new Types.ObjectId(userId),
            isTriggered: false,
        });

        this.logger.log(`Deleted ${result.deletedCount} alerts`);

        return true;
    }

    async create(input: CreatePortfolioInput, user: User): Promise<PortfolioType> {
        const goldPrices = await this.goldService.getCalculatedGoldPrices();
        const rateSymbol = `${input.symbol}/${user.baseCurrency}`;
        let currentRate;

        if (input.purchaseRateTRY != 1) {
            currentRate = input.purchaseRateTRY;
        } else {
            switch (input.symbol) {
                case 'GRAM_ALTIN':
                    currentRate = input.purchaseRateTRY != 1 ? input.purchaseRateTRY : goldPrices.GRAM_ALTIN;
                    break;
                case 'CEYREK_ALTIN':
                    currentRate = input.purchaseRateTRY != 1 ? input.purchaseRateTRY : goldPrices.CEYREK_ALTIN;
                    break;
                case 'TAM_ALTIN':
                    currentRate = input.purchaseRateTRY != 1 ? input.purchaseRateTRY : goldPrices.TAM_ALTIN;
                    break;
                case 'ATA_ALTIN':
                    currentRate = input.purchaseRateTRY != 1 ? input.purchaseRateTRY : goldPrices.ATA_ALTIN;
                    break;
                case 'USD':
                case 'EUR':
                    currentRate = await this.rateService.getRate(rateSymbol);
                    break;
                default:
                    throw new Error(`Unsupported or unpriced asset: ${rateSymbol}`);
            }
        }

        const newPortfolioItem = new this.portfolioModel({
            ...input,
            user: user._id,
            purchaseRateTRY: currentRate,
            baseCurrency: user.baseCurrency,
            isManualRate: input.isManualRate
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

        const goldPrices = await this.goldService.getCalculatedGoldPrices();
        let currentRate: number | undefined;

        switch (symbol) {
            case 'GRAM_ALTIN':
                currentRate = calculatedItem.isManualRate ? item.purchaseRateTRY : goldPrices.GRAM_ALTIN;
                break;
            case 'CEYREK_ALTIN':
                currentRate = calculatedItem.isManualRate ? item.purchaseRateTRY : goldPrices.CEYREK_ALTIN;
                break;
            case 'TAM_ALTIN':
                currentRate = calculatedItem.isManualRate ? item.purchaseRateTRY : goldPrices.TAM_ALTIN;
                break;
            case 'ATA_ALTIN':
                currentRate = calculatedItem.isManualRate ? item.purchaseRateTRY : goldPrices.ATA_ALTIN;
                break;
        }

        try {
            if (currentRate !== undefined) {
                calculatedItem.currentValueTRY = amount * currentRate;
            } else {
                const rateSymbol = `${symbol}/${baseCurrency}`;
                const rate = calculatedItem.isManualRate ? item.purchaseRateTRY : await this.rateService.getRate(rateSymbol);

                if (rate && rate > 0) {
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
                    purchaseRateTRY: finalItem.purchaseRateTRY,
                    isManualRate: baseItem.isManualRate
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
