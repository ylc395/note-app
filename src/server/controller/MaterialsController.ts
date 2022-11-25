import { Controller, ParseIntPipe } from '@nestjs/common';
import { type MaterialDTO, type MaterialVO, type MaterialQuery, materialsDTOSchema } from 'interface/Material';
import MaterialService from 'service/MaterialService';

import { Post, Get, Body, Query, Param, createSchemaPipe } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private materialService: MaterialService) {}

  @Post('/materials')
  async create(@Body(createSchemaPipe(materialsDTOSchema)) materials: MaterialDTO[]): Promise<MaterialVO[]> {
    return await this.materialService.create(materials);
  }

  @Get('/materials')
  async findAll(@Query() query: MaterialQuery): Promise<MaterialVO[]> {
    return await this.materialService.findAll(query);
  }

  @Get('/materials/:id')
  async findOne(@Param('id', ParseIntPipe) id: MaterialVO['id']): Promise<MaterialVO> {
    return await this.materialService.findOne(id);
  }
}
