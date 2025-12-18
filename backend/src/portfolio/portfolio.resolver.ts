import { Resolver, Mutation, Args, Query, ID } from '@nestjs/graphql';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { CurrentUser } from '../auth/jwt-auth/jwt-auth.guard';
import { User } from '../user/schemas/user.schema';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioInput, PortfolioType } from './dto/portfolio.dto';
import { SellPortfolioInput } from './dto/sell-portfolio.dto';
import { CreateAlertInput } from './dto/create-alert.input';
import { AlertType } from './dto/alert.model.dto';
import { Alert } from './schemas/alert.schema';

@Resolver(() => PortfolioType)
@UseGuards(GqlAuthGuard)
export class PortfolioResolver {
    constructor(private readonly portfolioService: PortfolioService) { }

    @Mutation(() => PortfolioType)
    async createPortfolio(
        @Args('input') input: CreatePortfolioInput,
        @CurrentUser() user: User,
    ): Promise<PortfolioType> {
        return this.portfolioService.create(input, user);
    }

    @Mutation(() => AlertType)
    async createAlert(
        @Args('input') input: CreateAlertInput,
        @CurrentUser() user: User,
    ): Promise<Alert> {
        return this.portfolioService.createAlert(input, user);
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

    @Query(() => [Alert])
    async getActiveAlerts(
        @CurrentUser() user: User
    ): Promise<Alert[]> {
        if (!user || !user._id) {
            throw new UnauthorizedException("User info is not found");
        }

        const userId = user._id.toString();
        return this.portfolioService.getUserAlerts(userId);
    }

    @Mutation(() => Boolean)
    async deleteAlerts(
        @Args('ids', { type: () => [ID] }) ids: string[],
        @CurrentUser() user: User,
    ): Promise<boolean> {
        if (!user?._id) {
            throw new UnauthorizedException("User info is not found");
        }

        return this.portfolioService.deleteAlerts(
            user._id.toString(),
            ids,
        );
    }
}
