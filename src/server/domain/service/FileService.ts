import { Inject, Injectable } from '@nestjs/common';
import compact from 'lodash/compact';
import map from 'lodash/map';
import { getDocument } from 'pdfjs-dist';

import { type FileVO, type FilesDTO, type FileTextRecord, type CreatedFile, isFileUrl } from 'model/file';
import { token as fileReaderToken, FileReader } from 'infra/fileReader';

import BaseService from './BaseService';

@Injectable()
export default class FileService extends BaseService {
  @Inject(fileReaderToken) private readonly fileReader!: FileReader;

  async createFiles(files: FilesDTO) {
    const tasks = files.map(async (file) => {
      if (isFileUrl(file)) {
        return this.fileReader.readRemoteFile(file.url);
      }

      if (file.data) {
        return {
          data: file.data,
          mimeType: file.mimeType,
        };
      }

      if (file.path) {
        const localFile = await this.fileReader.readLocalFile(file.path);
        return localFile && { ...localFile, mimeType: file.mimeType };
      }

      throw new Error('invalid file');
    });

    const loadedFiles = await Promise.all(tasks);
    const fileVOs = await this.repo.files.batchCreate(compact(loadedFiles));
    const haveText = await this.repo.files.haveText(map(fileVOs, 'id'));
    const result: (FileVO | null)[] = loadedFiles.map(() => null);
    const createdFiles: CreatedFile[] = [];

    let j = 0;
    for (let i = 0; i < loadedFiles.length; i++) {
      if (loadedFiles[i]) {
        result[i] = fileVOs[j]!;
        createdFiles.push({ ...loadedFiles[i]!, id: fileVOs[j]!.id });
        j += 1;
      }
    }

    createdFiles.filter(({ id }) => !haveText[id]).forEach(this.extractText);

    return result;
  }

  async queryFileById(id: FileVO['id']) {
    const file = await this.repo.files.findOneById(id);
    const data = await this.repo.files.findBlobById(id);

    if (!file || !data) {
      throw new Error('invalid id');
    }

    return { mimeType: file.mimeType, data };
  }

  async fetchRemoteFile(url: string) {
    const file = await this.fileReader.readRemoteFile(url);

    if (!file) {
      throw new Error('can not request file');
    }

    return file;
  }

  private extractText = async ({ data, mimeType, id }: CreatedFile) => {
    let records: FileTextRecord[] | undefined;

    if (mimeType === 'application/pdf') {
      records = await this.extractPdfText(data);
    }

    if (!records) {
      return;
    }

    this.repo.files.createText({ records, fileId: id });
  };

  private async extractPdfText(data: ArrayBuffer) {
    const doc = await getDocument(new Uint8Array(data)).promise;
    const records: FileTextRecord[] = [];

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let text = '';

      for (const item of textContent.items) {
        if ('str' in item) {
          text += item.str;
        }
      }

      text && records.push({ text, position: String(pageNum) });
    }

    return records;
  }
}
