import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseFilters } from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MongooseExceptionFilter } from 'src/filters/mongoose-exception/mongoose-exception.filter';
import { Card } from './schema/card.schema';

@ApiTags('cards')
@UseFilters(MongooseExceptionFilter)
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

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
