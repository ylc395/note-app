import { Controller } from '@nestjs/common';
import type { MaterialDTO, MaterialVO, MaterialQuery } from 'interface/Material';
import MaterialService from 'service/MaterialService';

import { Post, Get, Body, Query } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private materialService: MaterialService) {}

  @Post('materials')
  async create(@Body() materials: MaterialDTO[]): Promise<MaterialVO[]> {
    return await this.materialService.create(materials);
  }

  @Get('materials')
  async findAll(@Query() query: MaterialQuery) {
    return this.materialService.findAll(query);
  }
}
