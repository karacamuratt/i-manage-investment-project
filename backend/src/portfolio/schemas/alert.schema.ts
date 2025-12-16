import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

@Schema({ timestamps: true })
export class Alert {
    @Prop({ required: true })
    symbol: string;

    @Prop({ required: true })
    targetPrice: number;

    @Prop({ default: false })
    isTriggered: boolean;

    @Prop({ required: true })
    currentRate: number

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
