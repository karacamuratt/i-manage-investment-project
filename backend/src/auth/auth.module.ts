import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { RedisModule } from '../redis/redis.module';
import { JwtStrategy } from './jwt-auth/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthResolver } from './auth.resolver';
import { UserService } from 'src/user/user.service';

@Module({
    imports: [
        UserModule,
        RedisModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
        PassportModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        UserService,
        JwtStrategy,
        AuthResolver,
    ],
    exports: [
        AuthService,
        JwtStrategy,
        PassportModule, 
    ]
})

export class AuthModule {}
