import { Controller, Inject } from '@nestjs/common';
import type { RawMaterial } from 'model/Material';
import MaterialService from 'service/MaterialService';

import { Post, Body } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(@Inject(MaterialService) private materialService: MaterialService) {}

  @Post('materials')
  create(@Body() files: RawMaterial[]) {
    this.materialService.create(files);
  }
}
