import { forwardRef, Module } from '@nestjs/common';
import { AlertGateway } from './alert.gateway';
import { BullModule } from '@nestjs/bull';
import { PriceAlertScheduler } from './price-alert.scheduler';
import { PriceAlertProcessor } from 'src/jobs/price-alert.processor';
import { PortfolioModule } from 'src/portfolio/portfolio.module';

@Module({
    imports: [
        BullModule.registerQueue(
            {
                name: 'price-alert-queue',
            }
        ),
        forwardRef(() => PortfolioModule),
    ],
    providers: [AlertGateway, PriceAlertScheduler, PriceAlertProcessor],
    exports: [AlertGateway],
})

export class AlertModule { }
