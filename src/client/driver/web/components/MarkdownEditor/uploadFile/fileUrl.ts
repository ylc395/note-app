import type { FileVO } from 'interface/file';
import { APP_PROTOCOL } from 'infra/constants';

export function getFileUrlById(fileId: FileVO['id']) {
  if (__PLATFORM__ === 'electron') {
    return `${APP_PROTOCOL}://files/${fileId}`;
  }

  throw new Error('undefined url');
}

export function isInternalFileUrl(url: string) {
  if (__PLATFORM__ === 'electron') {
    return url.startsWith(APP_PROTOCOL);
  }

  return false;
}
