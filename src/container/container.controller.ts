import { Controller, Get, Post, Body, Patch, Param, Delete, UseFilters, Put } from '@nestjs/common';
import { ContainerService } from './container.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MongooseExceptionFilter } from '../filters/mongoose-exception/mongoose-exception.filter';
import { Container } from './schema/container.schema';

@ApiTags('Container')
@UseFilters(MongooseExceptionFilter)
@Controller('containers')
export class ContainerController {
  constructor(private readonly containerService: ContainerService) {}

  @Post()
  create(@Body() createContainerDto: CreateContainerDto) {
    return this.containerService.create(createContainerDto);
  }

  @ApiOkResponse({ type: Container, isArray: true })
  @Get()
  findAll() {
    return this.containerService.findAll();
  }

  @ApiOkResponse({ type: Container })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.containerService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContainerDto: UpdateContainerDto) {
    return this.containerService.update(id, updateContainerDto);
  }

  @ApiOperation({ summary: '更新容器排序' })
  @ApiBody({
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '64c88e07c0a0f15d2e6f1e59' },
          sortIndex: { type: 'number', example: 1 },
        },
      },
    },
  })
  @Put('order')
  updateOrder(@Body() containers: { _id: string; sortIndex: number }[]) {
    return this.containerService.updateContainerOrder(containers);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.containerService.remove(id);
  }

  @ApiOperation({ summary: 'WARNING!! 刪除所有 container' })
  @Delete()
  clear() {
    return this.containerService.clear();
  }
}
