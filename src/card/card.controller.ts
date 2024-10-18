import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseFilters,
  UseInterceptors,
  UploadedFiles,
  UploadedFile,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MongooseExceptionFilter } from 'src/filters/mongoose-exception/mongoose-exception.filter';
import { Card } from './schema/card.schema';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBody } from '@nestjs/swagger/dist/decorators/api-body.decorator';
import { SharpPipe } from 'src/utils/sharp-pipe';
import { DIR } from '../constant';
import * as fs from 'fs/promises';
import * as path from 'path';

@ApiTags('Card')
@UseFilters(MongooseExceptionFilter)
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post(':id/cover-image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } })) // 5MB 限制
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadCoverImage(
    @Param('id') id: string,
    @UploadedFile(SharpPipe) file: Express.Multer.File, // 使用 SharpPipe 壓縮圖片
  ) {
    const card = await this.cardService.findOne(id);
    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.originalname}`;
    const filepath = path.resolve(DIR.UPLOAD_DIR, filename);

    // 儲存圖片至 uploads 目錄
    await fs.writeFile(filepath, file.buffer);

    const fileUrl = `${DIR.UPLOAD_DIR}/${filename}`;

    // 更新卡片的 coverImage 和 attachments
    const updatedCard = await this.cardService.setCoverImage(id, fileUrl);

    return {
      message: 'Cover image uploaded successfully',
      card: updatedCard,
    };
  }

  @Patch(':id/cover-image')
  @ApiConsumes('application/json')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'uploads/image.jpg' },
      },
    },
  })
  async updateCoverImageByUrl(@Param('id') id: string, @Body('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL is required.');
    }

    // 更新卡片的 coverImage 和 attachments
    const updatedCard = await this.cardService.setCoverImage(id, url);

    return updatedCard;
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 10 * 1024 * 1024 }, // 限制每個檔案大小為 10MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async uploadAttachments(@Param('id') id: string, @UploadedFiles(SharpPipe) files: Express.Multer.File[]) {
    const card = await this.cardService.findOne(id);
    if (!card) {
      throw new NotFoundException(`Card with id ${id} not found`);
    }

    await fs.mkdir(DIR.UPLOAD_DIR, { recursive: true });

    const savedFiles = await Promise.all(files.map((file) => this.saveFile(file)));
    const attachments = savedFiles.map((file) => ({
      url: `${DIR.UPLOAD_DIR}/${file.filename}`,
      title: file.filename,
      uploadedAt: new Date(),
    }));

    return this.cardService.addAttachments(id, attachments);
  }

  // 儲存檔案至 uploads 目錄
  private async saveFile(file: Express.Multer.File): Promise<Express.Multer.File> {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${Buffer.from(file.originalname, 'latin1').toString('utf8')}`;
    const filepath = path.resolve(DIR.UPLOAD_DIR, filename);
    await fs.writeFile(filepath, file.buffer); // 寫入檔案
    return {
      ...file,
      filename,
      path: filepath,
    };
  }

  @Post()
  create(@Query('containerId') containerId: string, @Body() createCardDto: CreateCardDto) {
    console.log(containerId);
    return this.cardService.create(containerId, createCardDto);
  }

  @ApiOkResponse({ type: Card, isArray: true })
  @Get()
  findAll(@Query('containerId') containerId: string) {
    return this.cardService.findAll(containerId);
  }

  @ApiOkResponse({ type: Card })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cardService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCardDto: UpdateCardDto) {
    return this.cardService.update(id, updateCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cardService.remove(id);
  }

  @ApiOperation({ summary: 'WARNING!! 刪除所有 card' })
  @Delete()
  clear() {
    return this.cardService.clear();
  }
}
