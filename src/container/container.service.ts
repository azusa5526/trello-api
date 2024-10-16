import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { Model } from 'mongoose';
import { Container } from './schema/container.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Card } from 'src/card/schema/card.schema';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel(Container.name) private readonly containerModel: Model<Container>,
    @InjectModel(Card.name) private readonly cardModel: Model<Card>,
  ) {}

  create(createContainerDto: CreateContainerDto) {
    console.log('This action adds a new container');
    return new this.containerModel(createContainerDto).save();
  }

  findAll() {
    return this.containerModel.find().populate('cards').exec();
  }

  findOne(id: string) {
    return this.containerModel.findById(id).populate('cards');
  }

  update(id: number, updateContainerDto: UpdateContainerDto) {
    console.log(`This action updates a #${id} container`);
    return this.containerModel.findByIdAndUpdate(id, { $set: updateContainerDto }, { new: true });
  }

  async remove(id: string) {
    const container = await this.containerModel.findById(id).exec();
    if (!container) {
      throw new NotFoundException(`Container with id ${id} not found`);
    }

    // 刪除容器中的所有卡片
    await this.cardModel.deleteMany({ _id: { $in: container.cards } }).exec();
    // 最後刪除容器本身
    await this.containerModel.findByIdAndDelete(id).exec();
  }
}
