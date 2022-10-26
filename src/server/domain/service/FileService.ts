import { Injectable, Inject } from '@nestjs/common';

import type { File } from 'model/File';
import { token as fileRepositoryToken, type FileRepository } from 'service/repository/FileRepository';
import { type FileReader, token as fileReaderToken } from 'infra/FileReader';
import { type LocalClient, token as localClientToken } from 'infra/LocalClient';

@Injectable()
export default class FileService {
  constructor(
    @Inject(fileRepositoryToken) private readonly repository: FileRepository,
    @Inject(fileReaderToken) private readonly fileReader: FileReader,
    @Inject(localClientToken) private readonly localClient?: LocalClient,
  ) {}
  async create({ sourceUrl, mimeType }: Partial<File>) {
    const path = sourceUrl?.match(/^file:\/\/(.+)/)?.[1];

    if (!path) {
      throw new Error('invalid sourceUrl');
    }

    const deviceName = this.localClient?.getDeviceName();
    const { data, hash } = await this.fileReader.read(path);
    const file = { data, mimeType, deviceName, sourceUrl, hash };

    return await this.repository.create(file);
  }
}
