import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
            auth: { userId },
        });
    }

    return socket;
};

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
};
