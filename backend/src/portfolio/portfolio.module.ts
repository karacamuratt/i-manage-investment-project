import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Portfolio, PortfolioSchema } from './schemas/portfolio.schema';
import { PortfolioService } from './portfolio.service';
import { PortfolioResolver } from './portfolio.resolver';
import { RateModule } from '../rate/rate.module';
import { AuthModule } from 'src/auth/auth.module';
import { GoldModule } from 'src/gold/gold.module';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AlertModule } from 'src/gateway/alert.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            {
                name: Portfolio.name,
                schema: PortfolioSchema
            },
            {
                name: Alert.name,
                schema: AlertSchema
            }
        ]),
        RateModule,
        AuthModule,
        GoldModule,
        AlertModule
    ],
    providers: [PortfolioService, PortfolioResolver],
    exports: [
        PortfolioService,
    ],
})

export class PortfolioModule { }
