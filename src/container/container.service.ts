import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { Model, type Types } from 'mongoose';
import { Container } from './schema/container.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Card } from 'src/card/schema/card.schema';
import { deleteAttachments } from '../utils/file-utils';

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

  update(id: string, updateContainerDto: UpdateContainerDto) {
    console.log(`This action updates a #${id} container`);
    return this.containerModel.findByIdAndUpdate(id, { $set: updateContainerDto }, { new: true });
  }

  async remove(id: string) {
    const container = await this.containerModel.findById(id).exec();
    if (!container) {
      throw new NotFoundException(`Container with id ${id} not found`);
    }

    // 刪除所有卡片及其附件
    await this.deleteCardsAndAttachments(container.cards);

    // 最後刪除容器本身
    await this.containerModel.findByIdAndDelete(id).exec();
  }

  clear() {
    console.log('Clear All Containers!!', new Date().toLocaleTimeString());
    return this.containerModel.deleteMany();
  }

  // 刪除卡片及其附件的函數
  private async deleteCardsAndAttachments(cards: Types.ObjectId[]) {
    // 根據 ObjectId 陣列查詢所有卡片的詳細資料
    const cardDocuments = await this.cardModel.find({ _id: { $in: cards } }).exec();

    const deletePromises = cardDocuments.map(async (card) => {
      // 刪除卡片的附件
      await deleteAttachments(card.attachments);

      // 刪除卡片本身
      await this.cardModel.findByIdAndDelete(card._id).exec();
    });

    await Promise.all(deletePromises); // 並行刪除所有卡片和附件
  }
}
