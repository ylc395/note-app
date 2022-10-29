import { Controller } from '@nestjs/common';
import type { MaterialDTO, MaterialVO } from 'dto/Material';
import MaterialService from 'service/MaterialService';

import { Post, Body } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private materialService: MaterialService) {}

  @Post('materials')
  async create(@Body() materials: MaterialDTO[]): Promise<MaterialVO[]> {
    return await this.materialService.create(materials);
  }
}
