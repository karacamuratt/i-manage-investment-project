import { Field, ID, Float, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

@InputType()
export class SellPortfolioInput {
    @Field(() => ID)
    @IsNotEmpty()
    id: string;

    @Field(() => Float)
    @IsNumber()
    @IsPositive()
    @IsNotEmpty()
    amount: number;
}
