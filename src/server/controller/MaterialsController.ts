import { Controller, UsePipes } from '@nestjs/common';
import { type MaterialDTO, type MaterialVO, type MaterialQuery, materialsDTOSchema } from 'interface/Material';
import MaterialService from 'service/MaterialService';

import { Post, Get, Body, Query, createPipe } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private materialService: MaterialService) {}

  @Post('materials')
  @UsePipes(createPipe(materialsDTOSchema))
  async create(@Body() materials: MaterialDTO[]): Promise<MaterialVO[]> {
    return await this.materialService.create(materials);
  }

  @Get('materials')
  async findAll(@Query() query: MaterialQuery) {
    return await this.materialService.findAll(query);
  }
}
