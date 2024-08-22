import { groupBy } from 'lodash-es';
import { container, singleton } from 'tsyringe';
import fs from 'fs-extra';
import assert from 'node:assert';

import { getHash } from '@utils/file.js';
import type { FileVO, FileDTO } from '@domain/server/model/file.js';
import BaseService from '../BaseService.js';
import { type JobResult, token as textExtractorToken } from './TextExtractor.js';
import EntityService from '../EntityService.js';

@singleton()
export default class FileService extends BaseService {
  private readonly textExtractor = container.resolve(textExtractorToken);

  constructor() {
    super();
    this.textExtractor.onExtracted(this.handleTextExtracted.bind(this));
    this.resumeTextExtractor();
  }

  public async createFile(file: FileDTO) {
    const data = typeof file.path === 'string' ? await fs.readFile(file.path) : file.data;
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
      lang: file.lang,
      data,
      size: data.byteLength,
    });

    this.textExtractor.addJob({
      fileId: fileVO.id,
      lang: fileVO.lang,
      getData: this.repo.files.findBlobById,
      mimeType: file.mimeType,
    });

    return fileVO;
  }

  public async queryFileById(id: FileVO['id']) {
    const file = await this.repo.files.findOneById(id);
    assert(file, 'invalid file id');

    return file;
  }

  public async queryFileBlobById(id: FileVO['id']) {
    const data = this.repo.files.findBlobById(id);
    assert(data);

    return data;
  }

  private async resumeTextExtractor() {
    const unfinishedFiles = await this.repo.files.findUnfinishedFile();
    const textRecordLocations = groupBy(
      await this.repo.files.findAllTextRecordLocations(unfinishedFiles.map(({ id }) => id)),
      ({ fileId }) => fileId,
    );

    for (const { id, mimeType, lang } of unfinishedFiles) {
      const extractedLocations = textRecordLocations[id]?.map(({ location }) => location);

      this.textExtractor.addJob({
        fileId: id,
        mimeType,
        lang,
        getData: this.repo.files.findBlobById,
        locationsToSkip: extractedLocations,
      });
    }
  }

  @BaseService.transaction()
  private async handleTextExtracted({ isFinished, location, text, fileId }: JobResult) {
    if (location && typeof text === 'string') {
      await this.repo.files.createTextRecord({
        location: location,
        text: text,
        fileId: fileId,
      });
    }

    if (isFinished) {
      await this.repo.files.updateOne(fileId, { isTextExtracted: true });
    }
  }
}
