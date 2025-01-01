import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway(+process.env.PORT || 3000, { cors: { origin: '*' } })
export class ChatGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  handleConnection(client: Socket, ...args: any[]) {
    console.log('Client connected');
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected');
  }
}
