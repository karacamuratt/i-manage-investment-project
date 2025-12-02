import { IsEmail } from 'class-validator';

export class LoginRequestDto {
    @IsEmail()
    email: string;
}
