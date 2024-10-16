import { ApiProperty } from '@nestjs/swagger';
import { MaxLength, IsOptional } from 'class-validator';

export class CreateCardDto {
  @ApiProperty()
  @MaxLength(64)
  title: string;

  @ApiProperty()
  @MaxLength(256)
  @IsOptional()
  description?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsOptional()
  date?: Date;

  @ApiProperty()
  @IsOptional()
  coverImage?: string;

  @ApiProperty()
  @IsOptional()
  attachments?: string[];
}
