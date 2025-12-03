import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export enum InvestmentCurrency {
    USD = 'USD',
    EUR = 'EUR',
    XAU = 'XAU',
    TRY = 'TRY',
    GRAM_ALTIN = 'GRAM_ALTIN',
    CEYREK_ALTIN = 'CEYREK_ALTIN',
    TAM_ALTIN = 'TAM_ALTIN',
    ATA_ALTIN = 'ATA_ALTIN',
}

export type PortfolioDocument = Portfolio & mongoose.Document;

@Schema({ 
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret: any) => {
            ret.id = ret._id ? ret._id.toString() : null; 
        },
    },
})
export class Portfolio {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
    user: User;
    
    @Prop({ 
        type: String, 
        required: true,
        enum: Object.values(InvestmentCurrency),
    })
    symbol: string;
    
    @Prop({ type: Number, required: true })
    amount: number;
    
    @Prop({ type: String, required: true })
    baseCurrency: string;

    @Prop({ type: Number, required: true })
    purchaseRateTRY: number;
}

export const PortfolioSchema = SchemaFactory.createForClass(Portfolio);
