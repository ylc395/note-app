import { container, singleton } from 'tsyringe';
import { token as rpcToken } from '@domain/common/infra/rpc';

@singleton()
export default class MarkdownService {
  protected readonly remote = container.resolve(rpcToken);
  async uploadFiles(files: File[]) {
    const _files = await Promise.all(
      files.map(async (file) => {
        return { path: file.path, mimeType: file.type, lang: 'chi_sim' };
      }),
    );

    return await Promise.all(_files.map((file) => this.remote.file.upload.mutate(file)));
  }
}
