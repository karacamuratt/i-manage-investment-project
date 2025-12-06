import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserProfileInput } from './dto/update-user-profile.input';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>
    ) {}

    async findOrCreate(email: string): Promise<UserDocument> { 
        let user = await this.userModel.findOne({ email });

        if (!user) {
            user = await this.userModel.create({ email, baseCurrency: 'TRY', isPremium: false });
        }

        return user; 
    }

    async findOneById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async updateProfile(userId: string, input: UpdateUserProfileInput): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(
            userId,
            { 
                firstName: input.firstName,
                lastName: input.lastName,
            },
            { new: true }
        ).exec();
    }
}
