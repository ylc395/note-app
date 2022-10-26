import { Controller, Inject } from '@nestjs/common';
import type { Material } from 'model/Material';
import MaterialService from 'service/MaterialService';

import { Post, Body } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(@Inject(MaterialService) private materialService: MaterialService) {}

  @Post('materials')
  async create(@Body() materials: Partial<Material>[]): Promise<Material[]> {
    return await this.materialService.create(materials);
  }
}
