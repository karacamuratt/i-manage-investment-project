import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginRequestType, AccessTokenType } from './dto/auth.dto';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserType } from 'src/user/types/user.type';
import { CurrentUser, GqlAuthGuard } from './jwt-auth/jwt-auth.guard';
import { UpdateUserProfileInput } from 'src/user/dto/update-user-profile.input';
import { UserService } from 'src/user/user.service';

@Resolver()
export class AuthResolver {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService
    ) {}

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

    @Query(() => UserType, { nullable: true })
    @UsePipes(new ValidationPipe())
    @UseGuards(GqlAuthGuard)
    async getUserProfile (
        @CurrentUser() user: any,
    ): Promise<UserType | null> {
        if (!user || !user.id) {
            throw new Error('Unauthorized: User ID is missing.'); 
        }
    
        const userDocument = await this.userService.findOneById(user.id);

        if (!userDocument) {
            return null; 
        }

        const userObject = userDocument.toObject({ virtuals: true });

        return userObject as unknown as UserType;
    }

    @Mutation(() => UserType, { nullable: true })
    @UseGuards(GqlAuthGuard)
    @UsePipes(new ValidationPipe())
    async updateUserProfile(
        @CurrentUser() user: any,
        @Args('input') input: UpdateUserProfileInput,
    ): Promise<UserType | null> {
        if (!user || !user.id) {
            throw new Error('Unauthorized: User ID is missing.'); 
        }

        const updatedUserDocument = await this.userService.updateProfile(user.id, input);
        
        if (!updatedUserDocument) {
            return null;
        }

        const userObject = updatedUserDocument.toObject({ virtuals: true });

        return userObject as unknown as UserType;
    }
}
