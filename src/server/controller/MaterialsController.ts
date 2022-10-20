import { Controller, Inject } from '@nestjs/common';
import type { Material } from 'model/Material';
import MaterialService from 'service/MaterialService';

import { Post, Body } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(@Inject(MaterialService) private materialService: MaterialService) {}

  @Post('materials')
  create(@Body() materials: Partial<Material>[]) {
    this.materialService.create(materials);
  }
}
