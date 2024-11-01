import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Document, Types } from 'mongoose';
import { ApiObjectIdProperty } from 'src/utils/swagger-utils';

@Schema()
export class Attachment {
  @ApiProperty({ example: 'uploads/sample.png' })
  @Prop()
  url: string;

  @ApiProperty({ example: 'Sample Image' })
  @Prop()
  title: string;

  @ApiProperty({ example: '2024-10-17T07:55:26.948Z' })
  @Prop()
  uploadedAt: Date;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

@Schema()
export class Card extends Document {
  @ApiObjectIdProperty()
  _id: Types.ObjectId;

  @ApiProperty()
  @Prop({ required: true })
  title: string;

  @ApiPropertyOptional()
  @Prop()
  @IsOptional()
  description: string;

  @ApiPropertyOptional()
  @Prop()
  @IsOptional()
  date: Date;

  @ApiPropertyOptional()
  @Prop()
  @IsOptional()
  coverImage: string;

  @ApiPropertyOptional({ type: [Attachment], description: 'List of attachments' })
  @Prop()
  @IsOptional()
  attachments: Attachment[];

  @ApiObjectIdProperty()
  @Prop({ type: Types.ObjectId, ref: 'Container', required: true })
  containerId: Types.ObjectId;

  @ApiProperty({ required: true, default: 0 })
  @Prop({ required: true, default: 0 })
  sortIndex: number;
}

export const CardSchema = SchemaFactory.createForClass(Card);
