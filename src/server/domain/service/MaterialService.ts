import { Injectable, Inject } from '@nestjs/common';
import pick from 'lodash/pick';

import { type FileReader, token as fileReaderToken } from 'infra/FileReader';
import { type LocalClient, token as localClientToken } from 'infra/LocalClient';
import { token as materialRepositoryToken, type MaterialRepository } from 'service/repository/MaterialRepository';
import type { Material, File } from 'model/Material';

@Injectable()
export default class MaterialService {
  constructor(
    @Inject(fileReaderToken) private readonly fileReader: FileReader,
    @Inject(materialRepositoryToken) private readonly materialRepository: MaterialRepository,
    @Inject(localClientToken) private readonly localClient?: LocalClient,
  ) {}

  async create(materials: Partial<Material>[]): Promise<Required<Material>[]> {
    const deviceName = this.localClient?.getDeviceName() || '';
    const files: File[] = await Promise.all(
      materials.map(async ({ sourceUrl, mimeType = '' }) => {
        const path = sourceUrl?.match(/^file:\/\/(.+)/)?.[1];

        if (!path) {
          throw new Error('invalid sourceUrl');
        }

        const { data, name, hash } = await this.fileReader.read(path);

        return { data, name, mimeType, deviceName, sourceUrl, hash };
      }),
    );

    const createdMaterials = await this.materialRepository.createByFiles(files);
    const result = createdMaterials.map((material, i) => ({
      ...material,
      ...pick(files[i], ['sourceUrl', 'mimeType', 'deviceName']),
    }));

    return result;
  }
}
