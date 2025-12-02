import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';

import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';


async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: [
            'http://localhost:3001',
            'http://127.0.0.1:3001',
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // BULL BOARD
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/bull-board'); 

    const queueNames = ['rate-queue']; 

    const queues = queueNames.map((name) => {
        const queue = app.get<Queue>(getQueueToken(name)); 
        
        return new BullAdapter(queue); 
    });

    createBullBoard({
        queues,
        serverAdapter,
    });

    app.use('/bull-board', serverAdapter.getRouter()); 
    
    await app.listen(3000);
}

bootstrap();
