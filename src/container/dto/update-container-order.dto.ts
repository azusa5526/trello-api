import { IsArray, ValidateNested, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ContainerOrderItem {
  @ApiProperty()
  @IsString()
  _id: string;

  @ApiProperty()
  @IsInt()
  sortIndex: number;
}

export class UpdateContainerOrderDto {
  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContainerOrderItem)
  containers: ContainerOrderItem[];
}
