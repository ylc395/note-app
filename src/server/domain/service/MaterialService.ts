import {
  type AnnotationDTO,
  type MaterialDTO,
  type MaterialQuery,
  type MaterialVO,
  AnnotationTypes,
  isDirectory,
} from 'interface/material';

import BaseService from './BaseService';

export default class MaterialService extends BaseService {
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

    if (!blob) {
      throw new Error('no file');
    }

    return blob;
  }

  async createAnnotations(materialId: MaterialVO['id'], annotation: AnnotationDTO) {
    if (annotation.type === AnnotationTypes.Highlight) {
      await this.assertMaterial(materialId, 'application/pdf');
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
}
