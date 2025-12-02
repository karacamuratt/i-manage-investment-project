import { Field, ObjectType, Float } from '@nestjs/graphql';
import { InvestmentCurrency } from '../schemas/portfolio.schema';

@ObjectType()
export class AssetAllocation {
    @Field(() => InvestmentCurrency)
    currencyType: InvestmentCurrency;
    
    @Field(() => Float)
    percentage: number;
    
    @Field(() => Float)
    currentValue: number;
}

@ObjectType()
export class PortfolioSummary {
    @Field(() => Float)
    totalCurrentValueInBase: number;
    
    @Field(() => [AssetAllocation])
    assetAllocation: AssetAllocation[];
}
