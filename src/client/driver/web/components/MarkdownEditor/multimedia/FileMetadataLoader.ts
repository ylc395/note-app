import type { FileVO, WebFileMetadataVO } from 'interface/file';
import { singleton, container } from 'tsyringe';

import { token as remoteToken } from 'infra/remote';
import { getFileIdFromUrl } from 'utils/url';

@singleton()
export default class FileMetadataLoader {
  private readonly remote = container.resolve(remoteToken);

  load = async (url: string) => {
    const fileId = getFileIdFromUrl(url);

    if (fileId) {
      const { body } = await this.remote.get<void, FileVO>(`/files/${fileId}`);
      return body;
    }

    const { body } = await this.remote.get<void, WebFileMetadataVO>(`/web-files/${encodeURIComponent(url)}`);
    return body;
  };
}
