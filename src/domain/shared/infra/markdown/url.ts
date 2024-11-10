import type { EntityId } from '../../model/entity.js';
import { APP_NAME } from '../constants.js';

export const PROTOCOL = APP_NAME;

const URL_PREFIX = `${PROTOCOL}://`;

type Type = 'notes' | 'materials' | 'memos' | 'annotations' | 'files';

// App's inner url looks like: note-app://notes/abcdefg
type AppUrl = `${typeof URL_PREFIX}${Type}/${string}`;

export function getAppUrl(entityId: EntityId, type: Type): AppUrl {
  return `${URL_PREFIX}${type}/${entityId}`;
}

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
  const [_type, id] = pathname.replace('//', '').split('/');
  const type = _type || host;

  if (id && ['notes', 'materials', 'annotations', 'memos', 'files'].includes(type)) {
    return { id, type: type as Type, hash: hash.slice(1) };
  }

  return null;
}
