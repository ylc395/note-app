import { container, singleton } from 'tsyringe';

import { type FileUrl, type FilesDTO, isUrls, type FileUploadResponse, FileVO } from 'interface/File';
import { token as remoteToken } from 'infra/Remote';

@singleton()
export default class MarkdownService {
  private readonly remote = container.resolve(remoteToken);

  uploadFiles(files: File[]): Promise<FileVO[]>;
  uploadFiles(files: FileUrl[]): Promise<FileUploadResponse>;
  async uploadFiles(files: File[] | FileUrl[]) {
    const _files = isUrls(files)
      ? files
      : await Promise.all(
          files.map(async (file) => {
            return { name: file.name, data: await file.arrayBuffer(), mimeType: file.type };
          }),
        );

    const { body: fileVOs } = await this.remote.post<FilesDTO, FileUploadResponse>('/files', {
      files: _files,
    });

    return fileVOs;
  }
}
