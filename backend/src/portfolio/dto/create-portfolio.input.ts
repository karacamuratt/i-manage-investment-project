import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { InvestmentCurrency } from '../schemas/portfolio.schema';

@InputType()
export class CreatePortfolioInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    name: string;

    @Field(() => InvestmentCurrency)
    @IsEnum(InvestmentCurrency)
    currencyType: InvestmentCurrency;
}
