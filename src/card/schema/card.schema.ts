import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Document, Types } from 'mongoose';

@Schema()
export class Card extends Document {
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

  @ApiPropertyOptional()
  @Prop({ type: [String] })
  @IsOptional()
  attachments: string[];

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Container', required: true })
  containerId: Types.ObjectId;
}

export const CardSchema = SchemaFactory.createForClass(Card);
