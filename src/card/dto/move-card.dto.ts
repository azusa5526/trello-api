import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MoveCardDto {
  @ApiProperty({ description: '卡片在目標容器中的新索引位置', example: 2 })
  @IsInt()
  @Min(0)
  newIndex: number;
}
