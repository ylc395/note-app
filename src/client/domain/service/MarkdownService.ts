import { container, singleton } from 'tsyringe';

import { token as remoteToken } from 'infra/remote';
import type { FileVO, FilesDTO } from 'model/file';

@singleton()
export default class MarkdownService {
  private readonly remote = container.resolve(remoteToken);
  async uploadFiles(files: File[] | string[]) {
    const _files = await Promise.all(
      files.map(async (file) => {
        return typeof file === 'string'
          ? file
          : { name: file.name, data: await file.arrayBuffer(), mimeType: file.type };
      }),
    );

    const { body: fileVOs } = await this.remote.patch<FilesDTO, FileVO[]>('/files', _files);
    return fileVOs;
  }
}
