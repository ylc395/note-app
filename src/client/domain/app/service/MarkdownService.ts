import { container, singleton } from 'tsyringe';

import { token as remoteToken } from '@domain/common/infra/remote';
import type { FileVO, FilesDTO } from '@shared/domain/model/file';

@singleton()
export default class MarkdownService {
  private readonly remote = container.resolve(remoteToken);
  async uploadFiles(files: File[]) {
    const _files = await Promise.all(
      files.map(async (file) => {
        return { data: await file.arrayBuffer(), mimeType: file.type, lang: 'chi_sim' };
      }),
    );

    const { body: fileVOs } = await this.remote.patch<FilesDTO, FileVO[]>('/files', _files);
    return fileVOs;
  }
}
