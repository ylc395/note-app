import { Controller } from '@nestjs/common';

import {
  type MaterialDTO,
  type MaterialVO,
  type ClientMaterialQuery,
  type AnnotationDTO,
  type AnnotationVO,
  type AnnotationPatchDTO,
  materialDTOSchema,
  ClientMaterialQuerySchema,
  annotationDTOSchema,
  annotationPatchSchema,
} from 'model/material';
import MaterialService from 'service/MaterialService';

import { createSchemaPipe, Post, Body, Get, Query, Param, Delete, Patch } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('/materials/:id/blob')
  async getBlob(@Param('id') materialId: string): Promise<ArrayBuffer | string> {
    return await this.materialService.getBlob(materialId);
  }

  @Post('/materials/:id/annotations')
  async createAnnotation(
    @Param('id') materialId: string,
    @Body(createSchemaPipe(annotationDTOSchema)) annotation: AnnotationDTO,
  ): Promise<AnnotationVO> {
    return await this.materialService.createAnnotation(materialId, annotation);
  }

  @Get('/materials/:id/annotations')
  async queryAnnotations(@Param('id') materialId: string): Promise<AnnotationVO[]> {
    return await this.materialService.queryAnnotations(materialId);
  }

  @Get('/materials/:id/tree-fragment')
  async queryTreeFragment(@Param('id') materialId: string): Promise<MaterialVO[]> {
    return await this.materialService.getTreeFragment(materialId);
  }

  @Delete('/materials/annotations/:annotationId')
  async removeAnnotation(@Param('annotationId') annotationId: string): Promise<void> {
    return await this.materialService.removeAnnotation(annotationId);
  }

  @Patch('/materials/annotations/:annotationId')
  async updateAnnotation(
    @Param('annotationId') annotationId: string,
    @Body(createSchemaPipe(annotationPatchSchema)) patch: AnnotationPatchDTO,
  ): Promise<AnnotationVO> {
    return await this.materialService.updateAnnotation(annotationId, patch);
  }

  @Get('/materials/:id')
  async queryOne(@Param('id') materialId: string): Promise<MaterialVO> {
    return await this.materialService.query(materialId);
  }

  @Post('/materials')
  async create(@Body(createSchemaPipe(materialDTOSchema)) material: MaterialDTO): Promise<MaterialVO> {
    return await this.materialService.create(material);
  }

  @Get('/materials')
  async query(@Query(createSchemaPipe(ClientMaterialQuerySchema)) query: ClientMaterialQuery): Promise<MaterialVO[]> {
    return await this.materialService.query(query);
  }
}
