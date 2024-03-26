import { container, singleton } from 'tsyringe';
import fs from 'fs-extra';
import assert from 'node:assert';

import { getHash } from '@utils/file.js';
import type { FileVO, FileDTO } from '@domain/model/file.js';
import BaseService, { transaction } from '../BaseService.js';
import { Result, token as textExtractorToken } from './TextExtractor.js';

@singleton()
export default class FileService extends BaseService {
  public readonly textExtractor = container.resolve(textExtractorToken);

  constructor() {
    super();
    this.textExtractor.onExtracted(this.handleTextExtracted.bind(this));
    this.resumeTextExtractor();
  }

  private async resumeTextExtractor() {
    const unfinishedFiles = await this.repo.files.findTextExtractedLocationOfUnfinished();

    for (const file of unfinishedFiles) {
      this.textExtractor.addJob({
        ...file,
        getData: this.repo.files.findBlobById,
        skipLocations: file.locations,
      });
    }
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
    const [file, data] = await Promise.all([this.repo.files.findOneById(id), this.repo.files.findBlobById(id)]);
    assert(file && data, 'invalid file id');

    return { ...file, data };
  }

  @transaction
  private async handleTextExtracted({ isFinished, ...textRecord }: Result) {
    await this.repo.files.createText(textRecord);

    if (isFinished) {
      await this.repo.files.markTextExtracted(textRecord.fileId);
    }
  }
}
