import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/jwt-auth/jwt-auth.guard';
import { User } from '../user/schemas/user.schema';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioInput, PortfolioType } from './dto/portfolio.dto';
import { SellPortfolioInput } from './dto/sell-portfolio.dto';

@Resolver(() => PortfolioType)
@UseGuards(GqlAuthGuard)
export class PortfolioResolver {
    constructor(private readonly portfolioService: PortfolioService) {}

    @Mutation(() => PortfolioType)
    async createPortfolio(
    @Args('input') input: CreatePortfolioInput,
    @CurrentUser() user: User,
    ): Promise<PortfolioType> {
        return this.portfolioService.create(input, user);
    }

    @Query(() => [PortfolioType])
    @UseGuards(GqlAuthGuard)
    async getPortfolios(@CurrentUser() user: User) { 
        if (!user || !user._id) { 
            throw new UnauthorizedException("User info is not found");
        }

        const userId = user._id.toString(); 

        return this.portfolioService.findAllByUser(userId); 
    }

    @Mutation(() => PortfolioType)
    async sellPortfolio(
        @Args('input') input: SellPortfolioInput,
        @CurrentUser() user: User
    ): Promise<PortfolioType> {
        if (!user || !user._id) { 
            throw new UnauthorizedException("User info is not found");
        }

        const userId = user._id.toString(); 
        
        return this.portfolioService.sellPortfolio(userId, input);
    }
}
