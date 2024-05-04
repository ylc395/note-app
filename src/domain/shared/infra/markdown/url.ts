import type { EntityId } from '../../model/entity.js';
import { APP_NAME } from '../constants.js';

export const PROTOCOL = APP_NAME;

const URL_PREFIX = `${PROTOCOL}://`;

export function parseAppUrl(url: string) {
  if (!URL.canParse(url)) {
    return null;
  }

  const { pathname, hash, protocol, host } = new URL(url);

  if (protocol.slice(0, -1) !== PROTOCOL) {
    return null;
  }

  // browser's whatwg-url implement is not the same as electron (FYI, electron is correct)
  // @see https://github.com/nodejs/node/issues/52276
  const id = pathname.replace('//', '') || host;

  if (id) {
    return { id, hash: hash.slice(1) };
  }

  return null;
}

export function fromEntityId(entityId: EntityId) {
  return `${URL_PREFIX}${entityId}`;
}
