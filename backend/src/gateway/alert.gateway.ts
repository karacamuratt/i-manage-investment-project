import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*', // TODO
    },
})
export class AlertGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log('WS CONNECTED:', client.id);
        console.log('AUTH:', client.handshake.auth);

        const userId = client.handshake.auth?.userId;
        if (userId) {
            client.join(userId);
            console.log('JOINED ROOM:', userId);
        }
    }

    handleDisconnect(client: Socket) {
    }

    emitPriceAlert(userId: string, payload: any) {
        console.log('EMIT PRICE ALERT →', {
            userId,
            payload,
        });
        this.server.to(userId).emit('price-alert', payload);
    }
}
