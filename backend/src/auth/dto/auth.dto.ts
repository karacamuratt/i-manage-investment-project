import { ObjectType, Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

@ObjectType()
export class LoginRequestType {
    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;
}

@ObjectType()
export class AccessTokenType {
    @Field()
    accessToken: string;
}

@InputType()
export class VerifyOtpInput {
    @Field()
    @IsEmail()
    email: string;

    @Field()
    @IsNotEmpty()
    @IsString()
    @Length(6, 6)
    otp: string;
}
