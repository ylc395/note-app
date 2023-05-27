import { Controller } from '@nestjs/common';

import {
  type MaterialDTO,
  type MaterialVO,
  type MaterialQuery,
  type AnnotationDTO,
  type AnnotationVO,
  materialDTOSchema,
  materialQuerySchema,
  annotationDTOSchema,
} from 'interface/material';
import MaterialService from 'service/MaterialService';

import { createSchemaPipe, Post, Body, Get, Query, Param, Delete } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('/materials/:id/blob')
  async getBlob(@Param('id') materialId: string): Promise<ArrayBuffer> {
    return await this.materialService.getBlob(materialId);
  }

  @Post('/materials/:id/annotations')
  async createAnnotations(
    @Param('id') materialId: string,
    @Body(createSchemaPipe(annotationDTOSchema)) highlight: AnnotationDTO,
  ): Promise<AnnotationVO> {
    return await this.materialService.createAnnotations(materialId, highlight);
  }

  @Get('/materials/:id/annotations')
  async queryAnnotations(@Param('id') materialId: string): Promise<AnnotationVO[]> {
    return await this.materialService.queryAnnotations(materialId);
  }

  @Delete('/materials/:id/annotations/:annotationId')
  async removeAnnotation(@Param('id') materialId: string, @Param('annotationId') annotationId: string): Promise<void> {
    return await this.materialService.removeAnnotation(materialId, annotationId);
  }

  @Get('/materials/:id')
  async queryOne(@Param('id') materialId: string): Promise<MaterialVO> {
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
