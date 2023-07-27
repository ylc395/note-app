import type { FileVO } from 'interface/file';
import { APP_PROTOCOL, IS_ELECTRON } from 'infra/constants';

export function getFileUrlById(fileId: FileVO['id']) {
  if (IS_ELECTRON) {
    return `${APP_PROTOCOL}://files/${fileId}`;
  }

  throw new Error('undefined url');
}

export function isInternalFileUrl(url: string) {
  if (IS_ELECTRON) {
    return url.startsWith(APP_PROTOCOL);
  }

  return false;
}
