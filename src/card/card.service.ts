import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Card } from './schema/card.schema';
import { Container } from '../container/schema/container.schema';

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

    const card = new this.cardModel({ ...createCardDto, containerId: containerId });
    await card.save();

    container.cards.push(card._id); // 將卡片ID加入容器
    await container.save();
    console.log(`This action adds a new card to container: ${container.id}`);
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

    // 找到該卡片所屬的容器，並將其從容器的 cards 列表中移除
    const container = await this.containerModel.findById(card.containerId).exec();
    if (container) {
      // 使用 filter 方法將 cards 陣列中的對應卡片移除
      container.cards.pull(card._id); // 使用 Mongoose 的 pull 方法移除卡片的 ObjectId
      await container.save(); // 保存更新後的容器
    }

    // 刪除卡片本身
    await this.cardModel.findByIdAndDelete(id).exec();
  }

  clear() {
    console.log('Clear All Cards!!', new Date().toLocaleTimeString());
    return this.cardModel.deleteMany();
  }
}
