import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

export class CreateContainerDto {
  @ApiProperty()
  @MaxLength(64)
  name: string;
}
