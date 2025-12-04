import { Module } from '@nestjs/common';
import { GoldService } from './gold.service';
import { RateModule } from '../rate/rate.module';

@Module({
    imports: [RateModule],
    providers: [GoldService],
    exports: [GoldService],
})

export class GoldModule {}
