import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Card } from './schema/card.schema';
import { Container } from '../container/schema/container.schema';
import { deleteAttachments } from '../utils/file-utils';
import { DIR } from '../constant';

@Injectable()
export class CardService {
  constructor(
    @InjectModel(Card.name) private readonly cardModel: Model<Card>,
    @InjectModel(Container.name) private readonly containerModel: Model<Container>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(containerId: string, createCardDto: CreateCardDto) {
    const container = await this.containerModel.findById(containerId);
    if (!container) {
      throw new NotFoundException(`Container with id ${containerId} not found`);
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // 建立並保存新卡片至 Container
      const card = new this.cardModel({ ...createCardDto, containerId });
      await card.save();

      await this.containerModel
        .findByIdAndUpdate(containerId, { $push: { cards: card._id } }, { new: true })
        .exec();
      return card;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new InternalServerErrorException('Failed to create card and add to container');
    }
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
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
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

      // 刪除卡片本身
      await this.cardModel.findByIdAndDelete(id).exec();

      await session.commitTransaction();
      session.endSession();

      // 刪除卡片的附件檔案
      await deleteAttachments(card.attachments);

      return { message: 'Card and its attachments removed successfully' };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new InternalServerErrorException('Failed to remove card and its attachments');
    }
  }

  clear() {
    console.log('Clear All Cards!!', new Date().toLocaleTimeString());
    return this.cardModel.deleteMany();
  }

  async addAttachments(id: string, attachments: any[]) {
    const updatedCard = await this.cardModel
      .findByIdAndUpdate(
        id,
        { $push: { attachments: { $each: attachments } } }, // 使用 $each 一次性推入多個附件
        { new: true },
      )
      .exec();

    if (!updatedCard) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    return updatedCard;
  }

  async removeAttachment(cardId: string, attachmentUrl: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const card = await this.cardModel.findById(cardId).exec();
      if (!card) {
        throw new NotFoundException(`Card with id ${cardId} not found`);
      }

      const attachment = card.attachments.find((att) => att.url === attachmentUrl);
      if (!attachment) {
        throw new BadRequestException(`Attachment with URL ${attachmentUrl} not found`);
      }

      // 使用 $pull 操作符從 attachments 中移除附件
      const updatedCard = await this.cardModel
        .findByIdAndUpdate(cardId, { $pull: { attachments: { url: attachmentUrl } } }, { new: true })
        .exec();

      if (!updatedCard) {
        throw new NotFoundException(`Failed to update card with id ${cardId}`);
      }

      await session.commitTransaction();
      session.endSession();

      // 刪除卡片的單一附件檔案
      await deleteAttachments({ url: attachmentUrl });

      return updatedCard;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove attachment');
    }
  }

  async setCoverImage(cardId: string, filename: string) {
    const card = await this.cardModel.findById(cardId).exec();
    if (!card) {
      throw new NotFoundException(`Card with id ${cardId} not found`);
    }

    const fileUrl = `${DIR.UPLOAD_DIR}/${filename}`;
    const updatedCard = await this.cardModel
      .findByIdAndUpdate(
        cardId,
        {
          $set: { coverImage: fileUrl }, // 更新 coverImage
          $push: { attachments: { url: fileUrl, title: filename, uploadedAt: new Date() } }, // 新增至 attachments
        },
        { new: true },
      )
      .exec();

    if (!updatedCard) {
      throw new NotFoundException(`Card with id ${cardId} not found`);
    }

    return updatedCard;
  }
}
