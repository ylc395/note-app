import type { DirectoryDTO } from 'interface/material';

import BaseService from './BaseService';

export const DIRECTORY_MIME_TYPE = 'directory';

export default class MaterialService extends BaseService {
  async createDirectory(directory: DirectoryDTO) {
    const { id, name, icon, parentId } = await this.materials.create({ ...directory, mimeType: DIRECTORY_MIME_TYPE });

    return { id, name, icon, parentId };
  }
}
