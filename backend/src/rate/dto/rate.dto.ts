import { ObjectType, Field, Float } from '@nestjs/graphql';

@ObjectType()
export class RateType {
    @Field()
    symbol: string;
    
    @Field(() => Float)
    value: number;
    
    @Field()
    lastUpdated: Date;
}
