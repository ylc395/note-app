import type { ResourceVO } from 'interface/resource';
import { appFileProtocol } from 'infra/electronProtocol';

export function getFileUrlById(fileId: ResourceVO['id']) {
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
