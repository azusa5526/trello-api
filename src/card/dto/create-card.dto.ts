import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaxLength, IsOptional } from 'class-validator';
import { Attachment } from '../schema/card.schema';

export class CreateCardDto {
  @ApiProperty()
  @MaxLength(64)
  title: string;

  @ApiPropertyOptional()
  @MaxLength(256)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  date?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ type: [Attachment], description: 'List of attachments' })
  @IsOptional()
  attachments?: Attachment[];
}
