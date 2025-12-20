import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type AlertDocument = Alert & Document;

@ObjectType()
@Schema({
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (doc, ret: any) => {
            ret.id = ret._id ? ret._id.toString() : null;
            delete ret._id;
        },
    },
})
export class Alert {
    @Field(() => ID)
    id: string;

    @Prop({ required: true })
    @Field()
    symbol: string;

    @Prop({ required: true })
    @Field(() => Float)
    targetPrice: number;

    @Prop({ default: false })
    @Field()
    isTriggered: boolean;

    @Prop()
    currentRate: number

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
