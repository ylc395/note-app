import type { MaterialDTO } from 'interface/material';

import BaseService from './BaseService';

export const DIRECTORY_MIME_TYPE = 'directory';

export default class MaterialService extends BaseService {
  async create({ content, ...info }: MaterialDTO) {
    const newMaterial = await this.materials.create({
      ...info,
      ...(content ? { mimeType: content.mimeType, content: content.data } : { mimeType: DIRECTORY_MIME_TYPE }),
    });

    return newMaterial;
  }
}
