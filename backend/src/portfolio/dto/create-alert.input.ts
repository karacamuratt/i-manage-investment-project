import { InputType, Field, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsIn } from 'class-validator';

@InputType()
export class CreateAlertInput {
    @Field()
    @IsString()
    symbol: string;

    @Field(() => Float)
    @IsNumber()
    targetPrice: number;
}
