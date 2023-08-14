import { singleton, container } from 'tsyringe';

import { token as remoteToken } from 'infra/remote';
import { FILE_URL_PREFIX } from 'model/file';

@singleton()
export default class FileLoader {
  private readonly remote = container.resolve(remoteToken);

  load = async (url: string) => {
    const fileId = FileLoader.getFileIdFromUrl(url);

    const { body, headers } = await this.remote.get<void, ArrayBuffer>(
      fileId ? `/files/${fileId}` : `/files/remote/${encodeURIComponent(url)}`,
    );

    const mimeType = headers?.['Content-Type'];

    if (!mimeType) {
      throw new Error('no mimeType');
    }

    return {
      data: body,
      mimeType,
    };
  };

  private static getFileIdFromUrl(url: string) {
    const match = url.match(new RegExp(`${FILE_URL_PREFIX}(.+)`));
    return match?.[1] || null;
  }
}
