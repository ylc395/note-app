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
import { EntityTypes } from 'interface/entity';

@Injectable()
export default class MaterialService extends BaseService {
  @Inject(forwardRef(() => RecyclableService)) private readonly recyclableService!: RecyclableService;
  async create({ text, sourceUrl, file, ...info }: MaterialDTO) {
    if ((text || sourceUrl || file) && !info.parentId) {
      throw new Error('empty parentId');
    }

    if (file && !file.data && !file.path) {
      throw new Error('invalid file');
    }

    if (info.parentId) {
      const parent = await this.materials.findOneById(info.parentId);

      if (!parent || !isDirectory(parent)) {
        throw new Error('invalid parentId');
      }
    }

    if (text) {
      return this.materials.createEntity({ text, sourceUrl, ...info });
    }

    if (file) {
      if (file.mimeType.startsWith('text') && typeof file.data !== 'string') {
        throw new Error('invalid text');
      }

      return this.materials.createEntity({ file, sourceUrl, ...info });
    }

    return this.materials.createDirectory(info);
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

    if (annotation.type === AnnotationTypes.HtmlElement) {
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
}
