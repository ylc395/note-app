import { container, singleton } from 'tsyringe';

import {
  type ResourceUrl,
  type ResourcesDTO,
  isUrls,
  type ResourceUploadResponse,
  ResourceVO,
} from 'interface/resource';
import { token as remoteToken } from 'infra/Remote';

@singleton()
export default class MarkdownService {
  private readonly remote = container.resolve(remoteToken);

  uploadFiles(files: File[]): Promise<ResourceVO[]>;
  uploadFiles(files: ResourceUrl[]): Promise<ResourceUploadResponse>;
  async uploadFiles(files: File[] | ResourceUrl[]) {
    const _files = isUrls(files)
      ? files
      : await Promise.all(
          files.map(async (file) => {
            return { name: file.name, data: await file.arrayBuffer(), mimeType: file.type };
          }),
        );

    const { body: fileVOs } = await this.remote.post<ResourcesDTO, ResourceUploadResponse>('/resources', {
      files: _files,
    });

    return fileVOs;
  }
}
