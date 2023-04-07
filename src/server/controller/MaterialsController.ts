import { Controller } from '@nestjs/common';

import { type MaterialDTO, type MaterialVO, materialDTOSchema } from 'interface/material';
import MaterialService from 'service/MaterialService';

import { createSchemaPipe, Post, Body } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Post('/materials')
  async create(@Body(createSchemaPipe(materialDTOSchema)) material: MaterialDTO): Promise<MaterialVO> {
    return await this.materialService.create(material);
  }
}
