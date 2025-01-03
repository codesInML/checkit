import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { DatabaseService } from 'src/database/database.service';
import { OrderStatus } from '@prisma/client';
import { ProcessOrderDto } from './dto/process-order.dto';

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

  async getReviewingOrders(user_id: number) {
    return this.databaseService.order.findMany({
      where: { status: OrderStatus.REVIEWING, user_id },
    });
  }

  async getUsersReviewingOrders(user_ids: number[]) {
    return this.databaseService.order.findMany({
      where: { status: OrderStatus.REVIEWING, user_id: { in: user_ids } },
    });
  }

  async cancelOrder(id: number) {
    return this.databaseService.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async processOrder(id: number, processOrderDto: ProcessOrderDto) {
    return this.databaseService.order.update({
      where: { id },
      data: { status: OrderStatus.PROCESSING, ...processOrderDto },
    });
  }

  async remove(id: number) {
    return this.databaseService.order.delete({ where: { id } });
  }
}
