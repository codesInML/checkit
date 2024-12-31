import { Prisma } from '@prisma/client';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto implements Omit<Prisma.OrderCreateInput, 'user'> {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description?: string;

  @IsString()
  specifications?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsDateString()
  due_date?: string;
}
