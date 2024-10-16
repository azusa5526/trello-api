import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';
import { Card } from 'src/card/entities/card.entity';

@Schema()
export class Container extends Document {
  @ApiProperty()
  @Prop({ required: true })
  name: string;

  @ApiProperty({ isArray: true, type: Card })
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Card' }] })
  cards: Types.DocumentArray<Card>;
}

export const ContainerSchema = SchemaFactory.createForClass(Container);
