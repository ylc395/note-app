import { HighlightDTO, MaterialDTO, MaterialQuery, MaterialVO, isDirectory } from 'interface/material';

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

  async createHighlight(materialId: MaterialVO['id'], highlight: HighlightDTO) {
    const material = await this.materials.findOneById(materialId);

    if (!material || isDirectory(material) || material.mimeType !== 'application/pdf') {
      throw new Error('invalid material id');
    }

    return await this.materials.createHighlight(materialId, highlight);
  }
}
