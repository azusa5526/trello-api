import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Card, CardSchema } from './schema/card.schema';
import { Container, ContainerSchema } from 'src/container/schema/container.schema';
import { SharpPipe } from 'src/utils/sharp-pipe';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
    MongooseModule.forFeature([{ name: Container.name, schema: ContainerSchema }]),
  ],
  controllers: [CardController],
  providers: [CardService, SharpPipe],
})
export class CardModule {}
