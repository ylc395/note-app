import { Controller } from '@nestjs/common';

import {
  type NewMaterialDTO,
  type MaterialVO,
  type ClientMaterialQuery,
  type AnnotationVO,
  type AnnotationPatchDTO,
  type NewAnnotationDTO,
  type MaterialsPatchDTO,
  newMaterialDirectoryDTOSchema,
  clientMaterialQuerySchema,
  newAnnotationDTOSchema,
  annotationPatchDTOSchema,
  materialsPatchDTOSchema,
} from 'model/material';
import type { MaterialTreeVO } from 'model/material/Tree';
import MaterialService from 'service/MaterialService';

import { createSchemaPipe, Post, Body, Get, Query, Param, Delete, Patch } from './decorators';

@Controller()
export default class MaterialsController {
  constructor(private readonly materialService: MaterialService) {}

  @Get('/materials/:id/blob')
  async getBlob(@Param('id') materialId: string): Promise<ArrayBuffer> {
    return await this.materialService.getBlob(materialId);
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

  @Get('/materials/:id/tree')
  async queryTree(
    @Param('id') materialId: string,
    @Query(createSchemaPipe(clientMaterialQuerySchema)) query: ClientMaterialQuery,
  ): Promise<MaterialTreeVO> {
    return await this.materialService.getTreeFragment(materialId, query.type);
  }

  @Delete('/materials/annotations/:annotationId')
  async removeAnnotation(@Param('annotationId') annotationId: string): Promise<void> {
    return await this.materialService.removeAnnotation(annotationId);
  }

  @Patch('/materials/annotations/:annotationId')
  async updateAnnotation(
    @Param('annotationId') annotationId: string,
    @Body(createSchemaPipe(annotationPatchDTOSchema)) patch: AnnotationPatchDTO,
  ): Promise<AnnotationVO> {
    return await this.materialService.updateAnnotation(annotationId, patch);
  }

  @Get('/materials/:id')
  async queryOne(@Param('id') materialId: string): Promise<MaterialVO> {
    return await this.materialService.queryVO(materialId);
  }

  @Post('/materials')
  async create(@Body(createSchemaPipe(newMaterialDirectoryDTOSchema)) material: NewMaterialDTO): Promise<MaterialVO> {
    return await this.materialService.create(material);
  }

  @Patch('/materials')
  async batchUpdate(
    @Body(createSchemaPipe(materialsPatchDTOSchema)) { ids, material }: MaterialsPatchDTO,
  ): Promise<MaterialVO[]> {
    return await this.materialService.batchUpdate(ids, material);
  }

  @Get('/materials')
  async query(@Query(createSchemaPipe(clientMaterialQuerySchema)) query: ClientMaterialQuery): Promise<MaterialVO[]> {
    return await this.materialService.queryVO({ parentId: null, ...query });
  }
}
