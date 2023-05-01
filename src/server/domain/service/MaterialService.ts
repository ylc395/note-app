import type { MaterialDTO, MaterialQuery } from 'interface/material';

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
      const parent = await this.materials.findOneDirectoryById(info.parentId);

      if (!parent) {
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
}
