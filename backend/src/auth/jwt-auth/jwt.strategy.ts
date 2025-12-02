import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

export interface JwtPayload {
    email: string;
    sub: string; // MongoDB ID
    baseCurrency: string;
    isPremium: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET')!,
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.userService.findOneById(payload.sub);

        if (!user) {
            console.error("ERROR: the user email {0} is not found in Database:", payload.email);
            throw new UnauthorizedException();
        }
    
        return user;
    }
}
