import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Card } from 'src/card/entities/card.entity';
import { ApiObjectIdProperty } from 'src/utils/swagger-utils';

@Schema()
export class Container extends Document {
  @ApiObjectIdProperty()
  _id: string;

  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty({ isArray: true, type: Card })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Card' }] })
  cards: Types.ObjectId[];

  @ApiProperty()
  @Prop({ required: true, default: 0 })
  sortIndex: number;
}

export const ContainerSchema = SchemaFactory.createForClass(Container);
