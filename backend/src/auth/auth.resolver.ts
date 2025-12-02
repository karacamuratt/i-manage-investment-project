import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginRequestType, AccessTokenType } from './dto/auth.dto';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Mutation(() => LoginRequestType, { name: 'loginRequest' })
    @UsePipes(new ValidationPipe())
    async loginRequest(@Args('email') email: string) {
        const success = await this.authService.loginRequest(email);
        
        return { 
            success: success, 
            message: success ? 'The login code has been sent to your email address.' : 'The user was not found or the operation failed.' 
        };
    }

    @Mutation(() => AccessTokenType, { name: 'verifyOtp' })
    @UsePipes(new ValidationPipe())
    async verifyOtp(
        @Args('email') email: string,
        @Args('otp') otp: string,
    ) {
        const accessTokenString = await this.authService.verifyOtp(email, otp);
        return { accessToken: accessTokenString };
    }
}