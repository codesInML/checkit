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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ProcessOrderDto } from './dto/process-order.dto';

@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@UseGuards(AuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  private readonly logger = new LoggerService(OrderController.name);

  @Post()
  @ApiOperation({ summary: 'Create an order' })
  @ApiResponse({ status: 201, description: 'Order created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req) {
    const { user_id, role } = req.user;

    if (role !== Role.CUSTOMER)
      throw new ForbiddenException('Only customers can create an order');

    await this.orderService.create(createOrderDto, user_id);
    this.logger.log(`Created order for user ${user_id}`, OrderController.name);

    return { message: 'Order created' };
  }

  @Get()
  @ApiOperation({ summary: 'Fetch all orders' })
  @ApiResponse({
    status: 200,
    description:
      'Orders fetched successfully. If CUSTOMER, it fetches just their orders but returns all orders for ADMIN',
  })
  async findAll(@Req() req) {
    const { user_id, role } = req.user;
    if (role === Role.CUSTOMER)
      return this.orderService.findAllUserOrders(user_id);
    else return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch an order by id' })
  @ApiResponse({ status: 200, description: 'Order fetched successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const { user_id, role } = req.user;
    const order = await this.orderService.findOne(id);
    if (!order) throw new NotFoundException('Order not found');

    if (user_id !== order.user_id && role !== Role.ADMIN)
      throw new ForbiddenException('Not allowed');

    return order;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
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
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
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

  @Patch(':id/process')
  @ApiOperation({ summary: 'Process an order' })
  @ApiResponse({ status: 200, description: 'Order processed successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: ProcessOrderDto })
  async processOrder(
    @Param('id', ParseIntPipe) id: number,
    @Req() req,
    @Body() processOrderDto: ProcessOrderDto,
  ) {
    const { role } = req.user;
    if (role !== Role.ADMIN) throw new ForbiddenException('Not allowed');

    const order = await this.orderService.findOne(id);
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.REVIEWING)
      throw new ForbiddenException('Order is no longer in review');

    await this.orderService.processOrder(id, processOrderDto);
    this.logger.log(
      `Processed order ${id} for user ${order.user_id}`,
      OrderController.name,
    );

    return { message: 'Order processing' };
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete an order' })
  @ApiResponse({ status: 200, description: 'Order completed successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async completeOrder(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const { role } = req.user;
    if (role !== Role.ADMIN) throw new ForbiddenException('Not allowed');

    const order = await this.orderService.findOne(id);
    if (!order) throw new NotFoundException('Order not found');

    if (order.status !== OrderStatus.PROCESSING)
      throw new ForbiddenException('Order is not processing');

    await this.orderService.completeOrder(id);
    this.logger.log(
      `Completed order ${id} for user ${order.user_id}`,
      OrderController.name,
    );

    return { message: 'Order completed' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
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
