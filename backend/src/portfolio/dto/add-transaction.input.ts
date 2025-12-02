import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, Min, IsMongoId } from 'class-validator';
import { TransactionType } from '../schemas/transaction.schema';

@InputType()
export class AddTransactionInput {
    @Field(() => String)
    @IsMongoId()
    portfolioId: string;

    @Field(() => TransactionType)
    @IsNotEmpty()
    type: TransactionType;

    @Field(() => Float)
    @IsNumber()
    @Min(0.001)
    amount: number;

    @Field(() => Float)
    @IsNumber()
    @Min(0)
    unitPriceInBase: number; 

    @Field(() => Date, { nullable: true })
    transactionDate?: Date;
}
