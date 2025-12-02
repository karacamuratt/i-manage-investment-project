import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Portfolio, PortfolioSchema } from './schemas/portfolio.schema';
import { PortfolioService } from './portfolio.service';
import { PortfolioResolver } from './portfolio.resolver';
import { RateModule } from '../rate/rate.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ 
            name: Portfolio.name, 
            schema: PortfolioSchema 
        }]),
        RateModule,
        AuthModule,
    ],
    providers: [PortfolioService, PortfolioResolver],
})

export class PortfolioModule {}
