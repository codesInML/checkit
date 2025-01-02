import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderStatus, Role } from '@prisma/client';
import { AuthGuard } from 'src/guards/auth.guard';
import { CreateChatDto } from './dto/create-chat.dto';
import { ChatService } from './chat.service';
import { OrderService } from 'src/order/order.service';

@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Unauthorized.' })
@ApiResponse({ status: 403, description: 'Forbidden.' })
@ApiResponse({ status: 404, description: 'Order not found.' })
@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a chat' })
  @ApiResponse({ status: 201, description: 'Chat created successfully.' })
  async create(@Body() createChatDto: CreateChatDto, @Req() req) {
    const { user_id, role } = req.user;

    await this.validateCanSendChat(createChatDto.order_id, user_id, role);
    createChatDto.user_id = user_id;
    createChatDto.role = role;

    await this.chatService.create(createChatDto);

    return { message: 'Message sent' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch all chats for an order' })
  @ApiResponse({ status: 200, description: 'Chats fetched successfully.' })
  async findAll(@Param('id', ParseIntPipe) order_id: number, @Req() req) {
    const { user_id, role } = req.user;

    await this.validateCanSendChat(order_id, user_id, role);

    return await this.chatService.findMany(order_id);
  }

  async validateCanSendChat(id: number, user_id: number, role: Role) {
    const order = await this.orderService.findOne(id);
    if (!order) throw new NotFoundException('Order not found');

    if (order.user_id !== user_id && role !== Role.ADMIN)
      throw new ForbiddenException('Not allowed');

    if (order.status !== OrderStatus.REVIEWING)
      throw new ForbiddenException('Order is no longer in review');
  }
}
