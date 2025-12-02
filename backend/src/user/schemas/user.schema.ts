import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
    _id: mongoose.Types.ObjectId;

    @Prop({ required: true, unique: true, index: true })
    email: string;

    @Prop({ default: 'TRY' })
    baseCurrency: string;

    @Prop({ default: false })
    isPremium: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
