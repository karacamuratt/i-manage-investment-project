import { Resolver, Query, Args, Float } from '@nestjs/graphql';
import { RateService } from './rate.service';
import { RateType } from './dto/rate.dto';

@Resolver(() => RateType)
export class RateResolver {
    constructor(private readonly rateService: RateService) {}

    @Query(() => Float)
    async getRate(
        @Args('symbolPair') symbolPair: string,
    ): Promise<number> {
        return this.rateService.getRate(symbolPair);
    }
}