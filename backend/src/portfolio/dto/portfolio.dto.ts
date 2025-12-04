import { ObjectType, Field, Float, InputType } from '@nestjs/graphql';

@ObjectType()
export class PortfolioType {
    @Field()
    id: string;

    @Field()
    symbol: string;

    @Field(() => Float)
    amount: number;

    @Field()
    baseCurrency: string;
    
    @Field(() => Float, { nullable: true }) 
    currentValueTRY: number;

    @Field(() => Float, { nullable: true })
    purchaseRateTRY: number;

    @Field() 
    isManualRate: Boolean;

    @Field()
    createdAt: Date;
}

@InputType()
export class CreatePortfolioInput {
    @Field()
    symbol: string;
    
    @Field(() => Float)
    amount: number;

    @Field(() => Float, { nullable: true })
    purchaseRateTRY: number;

    @Field(() => Boolean, { defaultValue: false} ) 
    isManualRate: boolean;
}
