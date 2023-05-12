import type { ResourceVO } from 'interface/resource';
import { APP_FILE_PROTOCOL } from 'infra/constants';

export function getFileUrlById(fileId: ResourceVO['id']) {
  if (__PLATFORM__ === 'electron') {
    return `${APP_FILE_PROTOCOL}:///${fileId}`;
  }

  throw new Error('undefined url');
}

export function isInternalFileUrl(url: string) {
  if (__PLATFORM__ === 'electron') {
    return url.startsWith(APP_FILE_PROTOCOL);
  }

  return false;
}
