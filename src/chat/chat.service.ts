import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createChatDto: CreateChatDto) {
    const { message, order_id, user_id, role } = createChatDto;
    return this.databaseService.chat.create({
      data: {
        message,
        is_from_customer: role === Role.CUSTOMER,
        order: { connect: { id: order_id } },
        user: { connect: { id: user_id } },
      },
    });
  }

  async findMany(order_id: number) {
    return this.databaseService.chat.findMany({ where: { order_id } });
  }
}
