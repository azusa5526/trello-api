import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card } from './schema/card.schema';
import { Container } from '../container/schema/container.schema';
import { deleteAttachments } from '../utils/file-utils';

@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name) private readonly cardModel: Model<Card>,
    @InjectModel(Container.name) private readonly containerModel: Model<Container>,
  ) {}

  async create(containerId: string, createCardDto: CreateCardDto) {
    const container = await this.containerModel.findById(containerId);
    if (!container) {
      throw new NotFoundException(`Container with id ${containerId} not found`);
    }

    // 建立並保存新卡片
    const card = new this.cardModel({ ...createCardDto, containerId });
    await card.save();

    await this.containerModel
      .findByIdAndUpdate(containerId, { $push: { cards: card._id } }, { new: true })
      .exec();
    return card;
  }

  async findAll(containerId: string) {
    const container = await this.containerModel.findById(containerId).populate('cards').exec();
    if (!container) {
      throw new NotFoundException(`Container with id ${containerId} not found`);
    }
    return container.cards;
  }

  findOne(id: string) {
    return this.cardModel.findById(id);
  }

  update(id: string, updateCardDto: UpdateCardDto) {
    this.cardModel.findByIdAndUpdate(id, { $set: updateCardDto }, { new: true });
  }

  async remove(id: string) {
    const card = await this.cardModel.findById(id).exec();
    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    // 使用 $pull 操作符從容器的 cards 陣列中移除卡片的 ObjectId
    await this.containerModel
      .findOneAndUpdate(
        { _id: card.containerId }, // 找到對應的容器
        { $pull: { cards: card._id } }, // 從 cards 陣列中移除該卡片的 ObjectId
      )
      .exec();

    // 刪除卡片的附件檔案
    await deleteAttachments(card.attachments);

    // 刪除卡片本身
    await this.cardModel.findByIdAndDelete(id).exec();
  }

  clear() {
    console.log('Clear All Cards!!', new Date().toLocaleTimeString());
    return this.cardModel.deleteMany();
  }

  async addAttachments(id: string, attachments: any[]) {
    const card = await this.cardModel.findById(id).exec();
    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    card.attachments.push(...attachments); // 將新附件加入列表
    return card.save();
  }
}
