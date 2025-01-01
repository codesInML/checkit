import { Module } from '@nestjs/common';
import { ChatGateWay } from './chat-gateway';
import { OrderService } from 'src/order/order.service';
import { DatabaseService } from 'src/database/database.service';

@Module({
  providers: [ChatGateWay, OrderService, DatabaseService],
})
export class ChatGateWayModule {}
