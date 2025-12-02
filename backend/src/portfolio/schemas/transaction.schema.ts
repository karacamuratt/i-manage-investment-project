import { registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;
export enum TransactionType {
    BUY = 'BUY',
    SELL = 'SELL',
}

registerEnumType(TransactionType, {
    name: 'TransactionType',
    description: '(BUY) or (SELL)',
});

@Schema({ timestamps: true })
export class Transaction {
    @Prop({ type: Types.ObjectId, ref: 'Portfolio', required: true })
    portfolioId: Types.ObjectId;

    @Prop({ enum: TransactionType, required: true })
    type: TransactionType;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    unitPriceInBase: number;

    @Prop({ default: Date.now })
    transactionDate: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
