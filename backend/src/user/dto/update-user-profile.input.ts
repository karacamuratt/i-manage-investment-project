import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class UpdateUserProfileInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    lastName: string;
}
