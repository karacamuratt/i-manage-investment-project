import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AuthModule } from './auth/auth.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { RedisModule } from './redis/redis.module';
import { RateModule } from './rate/rate.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
            uri: configService.get<string>('MONGO_URI'),
        }),
        inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
    }),
    UserModule,
    AuthModule,
    PortfolioModule,
    TransactionModule,
    RateModule,
    RedisModule,
    JobsModule,
    SchedulerModule
  ],
  controllers: [],
  providers: [],
})

export class AppModule {}
