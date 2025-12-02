import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RateDocument = Rate & Document;

@Schema()
export class Rate {
    @Prop({ required: true, unique: true })
    symbolPair: string; 

    @Prop({ required: true, type: Number })
    value: number; 

    @Prop({ default: Date.now })
    updatedAt: Date; 
}

export const RateSchema = SchemaFactory.createForClass(Rate);
