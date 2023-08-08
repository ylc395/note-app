import uniq from 'lodash/uniq';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  type AnnotationDTO,
  type MaterialDTO,
  type MaterialQuery,
  type MaterialVO,
  type AnnotationVO,
  type AnnotationPatchDTO,
  AnnotationTypes,
  isDirectory,
} from 'interface/material';

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

    if (info.parentId && !(await this.areAvailableDirectory([info.parentId]))) {
      throw new Error('invalid parent id');
    }

    if (file || fileId) {
      return this.materials.createEntity({ file, fileId, ...info });
    }

    return this.materials.createDirectory(info);
  }

  private async areAvailableDirectory(parentIds: MaterialVO['id'][]) {
    const uniqueIds = uniq(parentIds);
    const materials = await this.materials.findAll({ ids: uniqueIds });

    if (materials.length !== uniqueIds.length) {
      return false;
    }

    return materials.every(isDirectory);
  }

  query(q: MaterialQuery) {
    return this.materials.findAll(q);
  }

  async queryById(materialId: MaterialVO['id']) {
    const material = await this.materials.findOneById(materialId);

    if (!material) {
      throw new Error('no material');
    }

    return material;
  }

  async getBlob(materialId: MaterialVO['id']) {
    const blob = await this.materials.findBlobById(materialId);

    if (blob === null) {
      throw new Error('no file');
    }

    return blob;
  }

  async createAnnotation(materialId: MaterialVO['id'], annotation: AnnotationDTO) {
    if (annotation.type === AnnotationTypes.PdfRange || annotation.type === AnnotationTypes.PdfArea) {
      await this.assertMaterial(materialId, 'application/pdf');
    }

    if (annotation.type === AnnotationTypes.HtmlRange) {
      await this.assertMaterial(materialId, 'text/html');
    }

    return await this.materials.createAnnotation(materialId, annotation);
  }

  async queryAnnotations(materialId: MaterialVO['id']) {
    await this.assertMaterial(materialId);
    return await this.materials.findAllAnnotations(materialId);
  }

  private async assertMaterial(materialId: MaterialVO['id'], mimeType?: string) {
    const material = await this.materials.findOneById(materialId);

    if (!material || isDirectory(material) || (mimeType && material.mimeType !== mimeType)) {
      throw new Error('invalid material id');
    }
  }

  async removeAnnotation(annotationId: AnnotationVO['id']) {
    const result = await this.materials.removeAnnotation(annotationId);

    if (!result) {
      throw new Error('invalid annotation');
    }
  }

  async updateAnnotation(annotationId: AnnotationVO['id'], patch: AnnotationPatchDTO) {
    const annotation = await this.materials.findAnnotationById(annotationId);

    if (!annotation) {
      throw new Error('invalid annotation id');
    }

    const updated = await this.materials.updateAnnotation(annotationId, patch);

    if (!updated) {
      throw new Error('invalid id');
    }

    return updated;
  }

  async areAvailable(ids: MaterialVO['id'][]) {
    const rows = await this.materials.findAll({ ids });

    if (rows.length !== ids.length) {
      return false;
    }

    return true;
  }

  async getTreeFragment(id: MaterialVO['id']) {
    return [];
  }
}
