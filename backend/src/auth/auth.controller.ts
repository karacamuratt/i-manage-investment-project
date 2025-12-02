import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    /*
    @Post('login-request')
    async loginRequest(@Body() loginRequestDto: LoginRequestDto) {
        return this.authService.sendOtp(loginRequestDto.email);
    }

    @Post('verify-otp')
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
    }
    */
}
