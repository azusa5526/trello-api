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
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MongooseExceptionFilter } from 'src/filters/mongoose-exception/mongoose-exception.filter';
import { Card } from './schema/card.schema';
import { FilesInterceptor } from '@nestjs/platform-express';
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
    const filename = `${uniqueSuffix}-${file.originalname}`;
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
