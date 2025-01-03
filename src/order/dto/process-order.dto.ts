import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ProcessOrderDto {
  @ApiProperty({
    example: 'We have concluded on the order',
  })
  @IsString()
  @IsNotEmpty()
  closing_summary: string;
}
