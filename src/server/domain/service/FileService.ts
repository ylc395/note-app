import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import type { FileDTO, FileVO } from 'interface/File';
import { Events, type FileAddedEvent } from 'model/File';
import { InvalidInputError } from 'model/Error';

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
  async create({ sourceUrl, mimeType, isTemp = false }: FileDTO) {
    const path = sourceUrl.match(/^file:\/\/(.+)/)?.[1];

    if (!path) {
      throw new InvalidInputError({ sourceUrl: `invalid sourceUrl ${sourceUrl}` });
    }

    const deviceName = this.localClient?.getDeviceName() || '';
    let fileInfo: Awaited<ReturnType<FileReader['read']>>;

    try {
      fileInfo = await this.fileReader.read(path);
    } catch (error) {
      throw new Error(`fail to open file ${path}`, { cause: error });
    }

    const { data, hash } = fileInfo;
    const sameFile = await this.repository.findOne({ hash });

    const fileId = await this.repository.create({
      data,
      mimeType,
      deviceName,
      sourceUrl,
      hash,
      isTemp,
      size: data.byteLength,
    });

    if (!isTemp) {
      const event: FileAddedEvent = { fileId };
      this.eventEmitter.emit(Events.Added, event);
    }

    return {
      id: fileId,
      sourceUrl,
      isDuplicated: Boolean(sameFile && !sameFile.isTemp),
    };
  }

  @OnEvent(Events.Added, { async: true })
  async ocr({ fileId }: FileAddedEvent) {
    await this.repository.updateTextContent(fileId, 'aaaaa');
  }

  async getBlob(fileId: FileVO['id']) {
    const blob = await this.repository.findData({ id: fileId });

    if (!blob) {
      throw new InvalidInputError({ id: `invalid id ${fileId}` });
    }

    return blob;
  }
}
