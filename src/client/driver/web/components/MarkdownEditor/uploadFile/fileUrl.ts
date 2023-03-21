import type { FileVO } from 'interface/File';
import { appFileProtocol } from 'infra/electronProtocol';

export function getFileUrlById(fileId: FileVO['id']) {
  if (__PLATFORM__ === 'electron') {
    return `${appFileProtocol}:///${fileId}`;
  }

  throw new Error('undefined url');
}

export function isInternalFileUrl(url: string) {
  if (__PLATFORM__ === 'electron') {
    return url.startsWith(appFileProtocol);
  }

  return false;
}
