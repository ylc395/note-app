import { Controller } from '@nestjs/common';

import {
  type MaterialDTO,
  type MaterialVO,
  type MaterialQuery,
  materialDTOSchema,
  materialQuerySchema,
} from 'interface/material';
import MaterialService from 'service/MaterialService';

import { createSchemaPipe, Post, Body, Get, Query, Param } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('/materials/:id/blob')
  async getBlob(@Param('id') materialId: MaterialVO['id']): Promise<ArrayBuffer> {
    return await this.materialService.getBlob(materialId);
  }

  @Get('/materials/:id')
  async queryOne(@Param('id') materialId: MaterialVO['id']): Promise<MaterialVO> {
    return await this.materialService.queryById(materialId);
  }

  @Post('/materials')
  async create(@Body(createSchemaPipe(materialDTOSchema)) material: MaterialDTO): Promise<MaterialVO> {
    return await this.materialService.create(material);
  }

  @Get('/materials')
  async query(@Query(createSchemaPipe(materialQuerySchema)) query: MaterialQuery): Promise<MaterialVO[]> {
    return await this.materialService.query(query);
  }
}
