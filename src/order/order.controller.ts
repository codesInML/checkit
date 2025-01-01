import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Req,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { OrderStatus, Role } from '@prisma/client';
import { LoggerService } from 'src/logger/logger.service';

@UseGuards(AuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new LoggerService(OrderController.name);

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const { user_id, role } = req.user;

    if (role !== Role.CUSTOMER)
      throw new ForbiddenException('Only customers can create an order');

    await this.orderService.create(createOrderDto, user_id);
    this.logger.log(`Created order for user ${user_id}`, OrderController.name);

    return { message: 'Order created' };
  }

  @Get()
  async findAll(@Req() req) {
    const { user_id, role } = req.user;
    if (role === Role.CUSTOMER)
      return this.orderService.findAllUserOrders(user_id);
    else return this.orderService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const { user_id, role } = req.user;
    const order = await this.orderService.findOne(id);
    if (!order) throw new NotFoundException('Order not found');

    if (user_id !== order.user_id && role !== Role.ADMIN)
      throw new ForbiddenException('Not allowed');

    return order;
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req() req,
  ) {
    const { user_id } = req.user;

    await this.validateIsUserOrder(id, user_id);

    await this.orderService.update(id, updateOrderDto);
    this.logger.log(
      `Updated order ${id} for user ${user_id}`,
      OrderController.name,
    );

    return { message: 'Order updated' };
  }

  @Patch(':id/cancel')
  async cancelOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const { user_id } = req.user;

    await this.validateIsUserOrder(id, user_id);

    await this.orderService.cancelOrder(id);
    this.logger.log(
      `Cancelled order ${id} for user ${user_id}`,
      OrderController.name,
    );

    return { message: 'Order cancelled' };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const { user_id } = req.user;

    await this.validateIsUserOrder(id, user_id);

    await this.orderService.remove(id);
    this.logger.log(
      `Deleted order ${id} for user ${user_id}`,
      OrderController.name,
    );
    return { message: 'Order deleted' };
  }

  async validateIsUserOrder(id: number, user_id: number) {
    const order = await this.orderService.findOne(id);
    if (!order) throw new NotFoundException('Order not found');

    if (order.user_id !== user_id) throw new ForbiddenException('Not allowed');

    if (order.status !== OrderStatus.REVIEWING)
      throw new ForbiddenException('Order is no longer in review');
  }
}
