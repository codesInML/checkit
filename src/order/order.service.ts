import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { DatabaseService } from 'src/database/database.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createOrderDto: CreateOrderDto, user_id: number) {
    return this.databaseService.order.create({
      data: { ...createOrderDto, user: { connect: { id: user_id } } },
    });
  }

  async findAll() {
    return this.databaseService.order.findMany();
  }

  async findAllUserOrders(user_id: number) {
    return this.databaseService.order.findMany({ where: { user_id } });
  }

  async findOne(id: number) {
    return this.databaseService.order.findUnique({ where: { id } });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    return this.databaseService.order.update({
      where: { id },
      data: updateOrderDto,
    });
  }

  async cancelOrder(id: number) {
    return this.databaseService.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async remove(id: number) {
    return this.databaseService.order.delete({ where: { id } });
  }
}
