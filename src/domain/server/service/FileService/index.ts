import fs from 'fs-extra';
import assert from 'node:assert';

import { getHash, toArrayBuffer } from '#utils/file.js';
import type { FileVO, FileDTO, NewFileTextRecord } from '#domain/server/model/file.js';

import BaseService from '../BaseService.js';
import EntityService from '../EntityService.js';
import JobQueue from './textExtractor/JobQueue.js';

export default class FileService extends BaseService {
  constructor() {
    super();
    this.runtime.ready().then(this.resumeTextExtractor.bind(this));
  }

  private readonly textExtractJobQueue = new JobQueue();

  public async createFile(file: FileDTO) {
    assert(!(file.path && file.data), 'can not use both path and data');

    const data = typeof file.path === 'string' ? toArrayBuffer(await fs.readFile(file.path)) : file.data;
    assert(data, 'no file data');

    const hash = await getHash(data);
    const existingFile = await this.repo.files.findOneByHash(hash);

    if (existingFile) {
      return existingFile;
    }

    const params = {
      mimeType: file.mimeType,
      lang: file.lang || [],
      data,
    };

    const textExtractor = JobQueue.getExtractor(params);
    const fileVO = await this.repo.files.create({
      id: EntityService.generateId(),
      ...params,
      hash,
      size: data.byteLength,
      textUnitLength: textExtractor ? await textExtractor.getTextUnitLength(data) : 0,
    });

    this.textExtractJobQueue.addJob({
      fileId: fileVO.id,
      lang: params.lang,
      mimeType: params.mimeType,
      getData: this.repo.files.findBlobById,
      onExtract: this.handleTextExtracted.bind(this),
    });

    return fileVO;
  }

  public async queryFileBlobById(id: FileVO['id']) {
    const data = await this.repo.files.findBlobById(id);
    assert(data);

    return data;
  }

  private async resumeTextExtractor() {
    const unfinishedFiles = await this.repo.files.findUnfinishedFile(JobQueue.SUPPORT_MIME_TYPES);

    if (unfinishedFiles.length === 0) {
      return;
    }

    const textRecords = Object.groupBy(
      await this.repo.files.findAllFileTextRecords(unfinishedFiles.map(({ id }) => id)),
      ({ fileId }) => fileId,
    );

    for (const { id, mimeType, lang } of unfinishedFiles) {
      this.textExtractJobQueue.addJob({
        fileId: id,
        mimeType,
        lang,
        getData: this.repo.files.findBlobById,
        locationsToSkip: textRecords[id]?.map(({ location }) => location),
        onExtract: this.handleTextExtracted.bind(this),
      });
    }
  }

  private async handleTextExtracted(record: NewFileTextRecord) {
    // todo: 把提取的文本存在数据库以外的地方。因为归根结底这是冗余数据
    await this.repo.files.createTextRecord(record);
  }

  public async assertId(id: string) {
    const file = await this.repo.files.findOneById(id);
    assert(file, 'invalid id');
  }
}
