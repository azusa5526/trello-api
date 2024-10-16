import { Controller, Get, Post, Body, Patch, Param, Delete, UseFilters } from '@nestjs/common';
import { ContainerService } from './container.service';
import { CreateContainerDto } from './dto/create-container.dto';
import { UpdateContainerDto } from './dto/update-container.dto';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
    return this.containerService.update(+id, updateContainerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.containerService.remove(id);
  }
}
