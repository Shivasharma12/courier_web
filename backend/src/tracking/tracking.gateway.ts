import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class TrackingGateway {
    @WebSocketServer()
    server: Server;

    @SubscribeMessage('joinTracking')
    handleJoinTracking(
        @MessageBody() trackingNumber: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(trackingNumber);
        return { event: 'joined', data: trackingNumber };
    }

    @SubscribeMessage('updateLocation')
    @UseGuards(WsJwtGuard)
    handleUpdateLocation(
        @MessageBody() data: { trackingNumber: string; lat: number; lng: number },
    ) {
        this.server.to(data.trackingNumber).emit('locationUpdated', {
            lat: data.lat,
            lng: data.lng,
            timestamp: new Date(),
        });
    }
}
