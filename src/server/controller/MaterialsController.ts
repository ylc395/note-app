import { Controller } from '@nestjs/common';

import {
  type NewMaterialDTO,
  type MaterialVO,
  type ClientMaterialQuery,
  type AnnotationVO,
  type AnnotationPatchDTO,
  type NewAnnotationDTO,
  type MaterialsPatchDTO,
  type MaterialPatchDTO,
  newMaterialDTOSchema,
  clientMaterialQuerySchema,
  newAnnotationDTOSchema,
  annotationPatchDTOSchema,
  materialsPatchDTOSchema,
  materialPatchDTOSchema,
} from '@domain/model/material.js';
import MaterialService from '@domain/service/MaterialService.js';

import { createSchemaPipe, Post, Body, Get, Query, Param, Delete, Patch } from './decorators.js';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Delete('/materials/:materialId/annotations/:annotationId')
  async removeAnnotation(@Param('annotationId') annotationId: string): Promise<void> {
    return await this.materialService.removeAnnotation(annotationId);
  }

  @Patch('/materials/:materialId/annotations/:annotationId')
  async updateAnnotation(
    @Param('annotationId') annotationId: string,
    @Body(createSchemaPipe(annotationPatchDTOSchema)) patch: AnnotationPatchDTO,
  ): Promise<AnnotationVO> {
    return await this.materialService.updateAnnotation(annotationId, patch);
  }

  @Post('/materials/:id/annotations')
  async createAnnotation(
    @Param('id') materialId: string,
    @Body(createSchemaPipe(newAnnotationDTOSchema)) annotation: NewAnnotationDTO,
  ): Promise<AnnotationVO> {
    return await this.materialService.createAnnotation(materialId, annotation);
  }

  @Get('/materials/:id/annotations')
  async queryAnnotations(@Param('id') materialId: string): Promise<AnnotationVO[]> {
    return await this.materialService.queryAnnotations(materialId);
  }

  @Get('/materials/:id/blob')
  async getBlob(@Param('id') materialId: string): Promise<ArrayBuffer> {
    return await this.materialService.getBlob(materialId);
  }

  @Get('/materials/:id')
  async queryOne(@Param('id') materialId: string): Promise<MaterialVO> {
    return await this.materialService.queryOne(materialId);
  }

  @Patch('/materials/:id')
  async updateOne(
    @Param('id') materialId: string,
    @Body(createSchemaPipe(materialPatchDTOSchema)) patch: MaterialPatchDTO,
  ): Promise<void> {
    return await this.materialService.updateOne(materialId, patch);
  }

  @Get('/materials')
  async query(
    @Query(createSchemaPipe(clientMaterialQuerySchema)) { parentId, to }: ClientMaterialQuery,
  ): Promise<MaterialVO[]> {
    return to ? await this.materialService.getTreeFragment(to) : await this.materialService.query({ parentId });
  }

  @Post('/materials')
  async create(@Body(createSchemaPipe(newMaterialDTOSchema)) material: NewMaterialDTO): Promise<MaterialVO> {
    return await this.materialService.create(material);
  }

  @Patch('/materials')
  async batchUpdate(
    @Body(createSchemaPipe(materialsPatchDTOSchema)) { ids, material }: MaterialsPatchDTO,
  ): Promise<void> {
    return await this.materialService.batchUpdate(ids, material);
  }
}
