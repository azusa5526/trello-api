import { Module } from '@nestjs/common';
import { ContainerService } from './container.service';
import { ContainerController } from './container.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Container, ContainerSchema } from './schema/container.schema';
import { Card, CardSchema } from 'src/card/schema/card.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Container.name, schema: ContainerSchema }]),
    MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
  ],
  controllers: [ContainerController],
  providers: [ContainerService],
})
export class ContainerModule {}
