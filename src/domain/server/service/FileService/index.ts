import assert from 'node:assert';

import { getHash, toArrayBuffer, toText } from '#utils/file.js';
import { type FileVO, type FileDTO, type NewFileTextRecord } from '#domain/server/model/file.js';
import { token as downloaderToken } from '#domain/server/infra/downloader.js';
import container from '#utils/singletonContainer.js';

import BaseService from '../BaseService.js';
import EntityService from '../EntityService.js';
import JobQueue from './textExtractor/JobQueue.js';

export default class FileService extends BaseService {
  constructor() {
    super();
    this.runtime.ready().then(this.resumeTextExtractor.bind(this));
  }

  private readonly downloader = container.resolve(downloaderToken);

  private readonly textExtractJobQueue = new JobQueue();

  public async createFile(file: FileDTO) {
    const hash = await getHash(file.data);
    const existingFile = await this.repo.files.findOneByHash(hash);

    if (existingFile) {
      return existingFile;
    }

    const params = {
      mimeType: file.mimeType,
      lang: file.lang || [],
      data: file.data,
    };

    const textExtractor = JobQueue.getExtractor(params);
    const fileVO = await this.repo.files.create({
      id: EntityService.generateId(),
      ...params,
      hash,
      size: file.data.byteLength,
      textUnitLength: textExtractor ? await textExtractor.getTextUnitLength(file.data) : 0,
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

  public async queryFileByHash(hash: string) {
    const file = await this.repo.files.findOneByHash(hash);
    return file;
  }

  public async queryFileBlobById(id: FileVO['id']) {
    const data = await this.repo.files.findBlobById(id);
    assert(data);

    return data;
  }

  public async queryFileById(id: FileVO['id']) {
    const data = await this.repo.files.findOneById(id);
    assert(data);

    return data;
  }

  public download(url: string) {
    return this.downloader.download(url);
  }

  public queryRemoteMetadata(url: string) {
    return this.downloader.getMetadata(url);
  }

  public async inlineHtml({ html, url }: { html: ArrayBuffer; url: string }) {
    const inlined = await this.downloader.inlineHtml(html, url);
    return toArrayBuffer(inlined);
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
    await this.repo.files.createTextRecord(record);
  }

  public async assertId(id: string, mimeType?: string | ((mimeType: string) => boolean)) {
    const file = await this.queryFileById(id);

    if (mimeType) {
      if (typeof mimeType === 'string') {
        assert(file.mimeType === mimeType);
      } else {
        assert(mimeType(file.mimeType));
      }
    }
  }
}
