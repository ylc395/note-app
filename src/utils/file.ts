// node modules will be polyfilled in web environment
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';

export function getHash(data: ArrayBuffer) {
  const hash = createHash('md5').update(Buffer.from(data)).digest('base64');
  return hash;
}
