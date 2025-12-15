import { ObjectType, Field, Float, InputType, ID } from '@nestjs/graphql';

@ObjectType()
export class AlertType {
    @Field(() => ID)
    id: string;

    @Field()
    symbol: string;

    @Field(() => Float)
    targetPrice: number;

    @Field()
    isTriggered: boolean;

    @Field()
    createdAt: Date;
}
