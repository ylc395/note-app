import type { MaterialDTO, MaterialQuery } from 'interface/material';

import BaseService from './BaseService';

export default class MaterialService extends BaseService {
  async create({ text, sourceUrl, file, ...info }: MaterialDTO) {
    if ((text || sourceUrl || file) && !info.parentId) {
      throw new Error('empty parentId');
    }

    if (text) {
      return this.materials.createEntity({ text, sourceUrl, ...info });
    }

    if (file) {
      return this.materials.createEntity({ file, sourceUrl, ...info });
    }

    if (sourceUrl) {
      const file = await this.downloader.downloadFile(sourceUrl);

      if (file) {
        return this.materials.createEntity({ ...info, sourceUrl, file });
      }

      throw new Error('can not download');
    }

    return this.materials.createDirectory(info);
  }

  query(q: MaterialQuery) {
    return this.materials.findAll(q);
  }
}
