import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { Model, type Types, Connection, ClientSession } from 'mongoose';
import { Container } from './schema/container.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Card } from 'src/card/schema/card.schema';
import { deleteAttachments } from '../utils/file-utils';
import { handleDatabaseOperationError } from 'src/utils/error-handler';

@Injectable()
export class ContainerService {
  constructor(
    @InjectModel(Container.name) private readonly containerModel: Model<Container>,
    @InjectModel(Card.name) private readonly cardModel: Model<Card>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  create(createContainerDto: CreateContainerDto) {
    return new this.containerModel(createContainerDto).save();
  }

  findAll() {
    return this.containerModel.find().populate('cards').exec();
  }

  findOne(id: string) {
    return this.containerModel.findById(id).populate('cards');
  }

  update(id: string, updateContainerDto: UpdateContainerDto) {
    return this.containerModel.findByIdAndUpdate(id, { $set: updateContainerDto }, { new: true });
  }

  async remove(id: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const container = await this.containerModel.findById(id).session(session).exec();
      if (!container) {
        throw new NotFoundException(`Container with id ${id} not found`);
      }

      // 刪除所有卡片及其附件
      await this.deleteCardsAndAttachments(container.cards, session);

      // 刪除容器本身
      await this.containerModel.findByIdAndDelete(id).session(session).exec();

      await session.commitTransaction();
      session.endSession();

      return { message: 'Container and its cards removed successfully' };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Transaction aborted due to error:', error.message);
      handleDatabaseOperationError(error);
    }
  }

  private async deleteCardsAndAttachments(cards: Types.ObjectId[], session: ClientSession) {
    // 查找所有卡片的詳細資料
    const cardDocuments = await this.cardModel
      .find({ _id: { $in: cards } })
      .session(session)
      .exec();

    const deletePromises = cardDocuments.map(async (card) => {
      // 刪除附件
      await deleteAttachments(card.attachments);

      // 刪除卡片
      await this.cardModel.findByIdAndDelete(card._id).session(session).exec();
    });

    await Promise.all(deletePromises); // 並行刪除所有卡片和附件
  }

  clear() {
    console.log('Clear All Containers!!', new Date().toLocaleTimeString());
    return this.containerModel.deleteMany();
  }
}
