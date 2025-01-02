import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto implements Omit<Prisma.OrderCreateInput, 'user'> {
  @ApiProperty({
    example: 'New Yam Order',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '1000 tubers of yam',
  })
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'Fresh and big yam tubers',
  })
  @IsString()
  specifications?: string;

  @ApiProperty({
    example: 1000,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: '2022-12-31T23:59:59.999Z',
  })
  @IsDateString()
  due_date?: string;
}
