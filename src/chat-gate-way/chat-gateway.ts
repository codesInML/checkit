import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { LoggerService } from 'src/logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import { OrderStatus, Role } from '@prisma/client';
import { OrderService } from 'src/order/order.service';
import { CreateChatDto } from 'src/chat/dto/create-chat.dto';

enum WsEvents {
  JOIN_ROOM = 'join-room',
  SEND_MESSAGE = 'send-message',
  RECEIVE_MESSAGE = 'receive-message',
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateWay implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly orderService: OrderService,
  ) {}

  private readonly logger = new LoggerService(ChatGateWay.name);

  async handleConnection(client: Socket) {
    try {
      const authorizationHeader = client.handshake.headers.authorization;

      if (!authorizationHeader) {
        this.logger.error('Authorization header missing', ChatGateWay.name);
        client.disconnect();
        return;
      }

      const [type, token] = authorizationHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        this.logger.error('Invalid authorization format', ChatGateWay.name);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client['user'] = payload;
      const { user_id, role } = payload;

      this.logger.log(
        `${role} with socket id ${client.id} and user_id ${user_id} connected.`,
        ChatGateWay.name,
      );
    } catch (error) {
      this.logger.error(
        `Token verification failed: ${error.message}`,
        ChatGateWay.name,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const { role, user_id } = client['user'];

      this.logger.log(
        `${role} with id ${user_id} disconnected`,
        ChatGateWay.name,
      );
    } catch (error) {
      this.logger.error(error.message, ChatGateWay.name);
    }
  }

  @SubscribeMessage(WsEvents.JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody() data: { order_id: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { user_id, role } = client['user'];
      const { order_id } = data;

      if (!(await this.canSendChat(order_id, user_id, role))) return;

      const room = this.getRoomId(order_id);
      client.join(room);

      this.logger.log(
        `${role} with id ${user_id} joined ${room}`,
        ChatGateWay.name,
      );
    } catch (error) {
      this.logger.error(error.message, ChatGateWay.name);
    }
  }

  @SubscribeMessage(WsEvents.SEND_MESSAGE)
  async handleSendMessage(
    @MessageBody() data: CreateChatDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { user_id, role } = client['user'];
      const { order_id } = data;

      if (!(await this.canSendChat(order_id, user_id, role))) return;

      client.to(this.getRoomId(order_id)).emit(WsEvents.RECEIVE_MESSAGE, data);
    } catch (error) {
      this.logger.error(error.message, ChatGateWay.name);
    }
  }

  private async canSendChat(order_id: number, user_id: number, role: Role) {
    const order = await this.orderService.findOne(order_id);
    if (!order) return false;
    if (order.user_id !== user_id && role !== Role.ADMIN) return false;
    if (order.status !== OrderStatus.REVIEWING) return false;
    return true;
  }

  private getRoomId(order_id: number) {
    return `room-${order_id}`;
  }
}
