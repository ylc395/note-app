import uniq from 'lodash/uniq';
import negate from 'lodash/negate';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  type AnnotationDTO,
  type MaterialDTO,
  type ClientMaterialQuery,
  type MaterialVO,
  type AnnotationVO,
  type AnnotationPatchDTO,
  AnnotationTypes,
  isDirectory,
  MaterialTypes,
  isEntityMaterial,
} from 'model/material';
import { EntityTypes } from 'model/entity';

import BaseService from './BaseService';
import RecyclableService from './RecyclableService';

@Injectable()
export default class MaterialService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;

  async create({ file, fileId, ...info }: MaterialDTO) {
    if (file && fileId) {
      throw new Error('invalid material');
    }

    if ((file || fileId) && !info.parentId) {
      throw new Error('empty parentId');
    }

    if (file && !file.data && !file.path) {
      throw new Error('invalid file');
    }

    if (info.parentId && !(await this.areAvailable([info.parentId], MaterialTypes.Directory))) {
      throw new Error('invalid parent id');
    }

    if (file || fileId) {
      return this.materials.createEntity({ file, fileId, ...info });
    }

    return this.materials.createDirectory(info);
  }

  async query(q: ClientMaterialQuery): Promise<MaterialVO[]>;
  async query(q: MaterialVO['id']): Promise<MaterialVO>;
  async query(q: ClientMaterialQuery | MaterialVO['id']): Promise<MaterialVO[] | MaterialVO> {
    const rows = await this.materials.findAll(typeof q === 'string' ? { id: [q] } : q);
    const availableMaterials = await this.recyclableService.filter(EntityTypes.Material, rows);
    const result = typeof q === 'string' ? availableMaterials[0] : availableMaterials;

    if (!result) {
      throw new Error('no result');
    }

    return result;
  }

  async getBlob(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    const blob = await this.materials.findBlobById(materialId);

    if (blob === null) {
      throw new Error('no file');
    }

    return blob;
  }

  async createAnnotation(materialId: MaterialVO['id'], annotation: AnnotationDTO) {
    if (annotation.type === AnnotationTypes.PdfRange || annotation.type === AnnotationTypes.PdfArea) {
      await this.assertEntityMaterial(materialId, 'application/pdf');
    }

    if (annotation.type === AnnotationTypes.HtmlRange) {
      await this.assertEntityMaterial(materialId, 'text/html');
    }

    return await this.materials.createAnnotation(materialId, annotation);
  }

  async queryAnnotations(materialId: MaterialVO['id']) {
    await this.assertEntityMaterial(materialId);
    return await this.materials.findAllAnnotations(materialId);
  }

  async removeAnnotation(annotationId: AnnotationVO['id']) {
    await this.assertValidAnnotation(annotationId);
    const result = await this.materials.removeAnnotation(annotationId);

    if (!result) {
      throw new Error('invalid annotation');
    }
  }

  async updateAnnotation(annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    await this.assertValidAnnotation(annotationId);
    const updated = await this.materials.updateAnnotation(annotationId, patch);

    if (!updated) {
      throw new Error('invalid id');
    }

    return updated;
  }

  async areAvailable(ids: MaterialVO['id'][], type?: MaterialTypes) {
    const uniqueIds = uniq(ids);
    const rows = await this.materials.findAll({ id: uniqueIds });

    if (rows.length !== ids.length) {
      return false;
    }

    if ((await this.recyclableService.filter(EntityTypes.Material, rows)).length !== rows.length) {
      return false;
    }

    if (type) {
      return rows.every(type === MaterialTypes.Directory ? isDirectory : negate(isDirectory));
    }

    return true;
  }

  private async assertEntityMaterial(materialId: MaterialVO['id'], mimeType?: string) {
    const material = await this.query(materialId);

    if (!isEntityMaterial(material) || (mimeType && material.mimeType !== mimeType)) {
      throw new Error('invalid material id');
    }
  }

  private async assertValidAnnotation(annotationId: AnnotationVO['id']) {
    const annotation = await this.materials.findAnnotationById(annotationId);

    if (!annotation) {
      throw new Error('invalid annotation id');
    }

    await this.assertEntityMaterial(annotation.materialId);
  }

  async getTreeFragment(id: MaterialVO['id']) {
    if (!(await this.areAvailable([id]))) {
      throw new Error('invalid id');
    }

    return [];
  }
}
