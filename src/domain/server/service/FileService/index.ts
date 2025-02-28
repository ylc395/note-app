import { groupBy } from 'lodash-es';
import fs from 'fs-extra';
import assert from 'node:assert';

import { getHash, toArrayBuffer } from '#utils/file.js';
import type { FileVO, FileDTO } from '#domain/server/model/file.js';

import BaseService from '../BaseService.js';
import EntityService from '../EntityService.js';
import TextExtractor, { type JobResult } from './TextExtractor/index.js';

export default class FileService extends BaseService {
  constructor() {
    super();
    this.runtime.ready().then(this.resumeTextExtractor.bind(this));
  }

  private readonly textExtractor = new TextExtractor({
    onExtracted: this.handleTextExtracted.bind(this),
  });

  public async createFile(file: FileDTO) {
    assert(!(file.path && file.data), 'can not use both path and data');

    const data = typeof file.path === 'string' ? toArrayBuffer(await fs.readFile(file.path)) : file.data;
    assert(data, 'no file data');

    const hash = await getHash(data);
    const existingFile = await this.repo.files.findOneByHash(hash);

    if (existingFile) {
      return existingFile;
    }

    const fileVO = await this.repo.files.create({
      id: EntityService.generateId(),
      hash,
      mimeType: file.mimeType,
      lang: file.lang || [],
      data,
      size: data.byteLength,
    });

    this.textExtractor.addJob({
      fileId: fileVO.id,
      lang: fileVO.lang,
      mimeType: fileVO.mimeType,
      getData: this.repo.files.findBlobById,
    });

    return fileVO;
  }

  public async queryFileBlobById(id: FileVO['id']) {
    const data = await this.repo.files.findBlobById(id);
    assert(data);

    return data;
  }

  private async resumeTextExtractor() {
    const unfinishedFiles = await this.repo.files.findUnfinishedFile();
    const textRecords = groupBy(
      await this.repo.files.findAllFileTextRecords(unfinishedFiles.map(({ id }) => id)),
      ({ fileId }) => fileId,
    );

    for (const { id, mimeType, lang } of unfinishedFiles) {
      this.textExtractor.addJob({
        fileId: id,
        mimeType,
        lang,
        getData: this.repo.files.findBlobById,
        locationsToSkip: textRecords[id]?.map(({ location }) => location),
      });
    }
  }

  @BaseService.transaction
  private async handleTextExtracted({ isFinished, location, text, fileId }: JobResult) {
    await this.repo.files.createTextRecord({
      location: location,
      text: text,
      fileId: fileId,
    });

    if (isFinished) {
      await this.repo.files.updateOne(fileId, { isTextExtracted: true });
    }
  }

  public async assertId(id: string) {
    const file = await this.repo.files.findOneById(id);
    assert(file, 'invalid id');
  }
}
