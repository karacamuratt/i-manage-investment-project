import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RedisService } from '../redis/redis.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/user/schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        private readonly userService: UserService,
        private readonly redisService: RedisService,
        private readonly jwtService: JwtService,
    ) {}

    async loginRequest(email: string): Promise<boolean> {
        let user = await this.userModel.findOne({ email });

        if (!user) {
            try {
                user = await this.userModel.create({
                    email: email,
                    name: email.split('@')[0],
                    baseCurrency: 'TRY',
                    isPremium: false,
                });
                this.logger.log(`New user created: ${email}`);
            } catch (error) {
                this.logger.error(`Failed to create new user for ${email}. Error:`, error.message);
                return false;
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpKey = `otp:${email}`;

        await this.redisService.set(otpKey, otp); 

        this.logger.log(`OTP generated for ${email}: ${otp}. (Expires in 5 minutes)`);

        return true;
    }

    async sendOtp(email: string): Promise<{ message: string }> {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const ttl = 300; // 5 minutes

        this.logger.debug(`OTP for ${email}: ${otp}`);

        await this.redisService.setOtp(email, otp, ttl);

        // TODO: EMAIL SENDING SERVICE

        return { message: 'Verification code sent to email.' };
    }

    async verifyOtp(email: string, otp: string): Promise<string> {
        const storedOtp = await this.redisService.getAndDelOtp(email, false);

        if (!storedOtp || storedOtp !== otp) {
            throw new BadRequestException('Invalid or expired verification code.');
        }

        const user = await this.userService.findOrCreate(email);
        const userId = user._id.toString();

        const payload = { 
            email: user.email, 
            sub: userId, 
            baseCurrency: user.baseCurrency, 
            isPremium: user.isPremium 
        };

        const jwtResult = this.jwtService.sign(payload);

        if (jwtResult) {
            await this.redisService.getAndDelOtp(email, true);
        }

        return jwtResult;
    }
}
