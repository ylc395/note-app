import { Controller } from '@nestjs/common';

import {
  type MaterialDTO,
  type MaterialVO,
  type MaterialQuery,
  type HighlightDTO,
  type HighlightVO,
  materialDTOSchema,
  materialQuerySchema,
} from 'interface/material';
import MaterialService from 'service/MaterialService';

import { createSchemaPipe, Post, Body, Get, Query, Param } from './decorators';
import { HighlightDTOSchema } from 'interface/material';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('/materials/:id/blob')
  async getBlob(@Param('id') materialId: MaterialVO['id']): Promise<ArrayBuffer> {
    return await this.materialService.getBlob(materialId);
  }

  @Post('/materials/:id/highlights')
  async createHighlight(
    @Param('id') materialId: MaterialVO['id'],
    @Body(createSchemaPipe(HighlightDTOSchema)) highlight: HighlightDTO,
  ): Promise<HighlightVO> {
    return await this.materialService.createHighlight(materialId, highlight);
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
