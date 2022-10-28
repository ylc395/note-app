import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import type { FileDTO, FileVO } from 'dto/File';
import { Events, type FileAddedEvent } from 'model/File';

import { token as fileRepositoryToken, type FileRepository } from 'service/repository/FileRepository';
import { type FileReader, token as fileReaderToken } from 'infra/FileReader';
import { type LocalClient, token as localClientToken } from 'infra/LocalClient';

@Injectable()
export default class FileService {
  constructor(
    @Inject(fileRepositoryToken) private readonly repository: FileRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(fileReaderToken) private readonly fileReader: FileReader,
    @Inject(localClientToken) private readonly localClient?: LocalClient,
  ) {}
  async create({ sourceUrl, mimeType, isTemp }: FileDTO) {
    const path = sourceUrl?.match(/^file:\/\/(.+)/)?.[1];

    if (!path) {
      throw new Error('invalid sourceUrl');
    }

    const deviceName = this.localClient?.getDeviceName() || '';
    const { data, hash } = await this.fileReader.read(path);
    const sameFile = await this.repository.findOne({ hash });

    const fileId = await this.repository.create({
      data,
      mimeType,
      deviceName,
      sourceUrl,
      hash,
      isTemp,
    });

    if (!isTemp) {
      this.eventEmitter.emit(Events.Added, { fileId } as FileAddedEvent);
    }

    return { id: fileId, mimeType, sourceUrl, deviceName, isDuplicated: Boolean(sameFile) } as FileVO;
  }

  @OnEvent(Events.Added, { async: true })
  async ocr({ fileId }: FileAddedEvent) {
    await this.repository.updateOcrResult(fileId, 'aaaaa');
  }
}
