import { EntityTypes, type EntityId } from '../../model/entity.js';
import type { FragmentSelector } from '../../model/annotation.js';
import { APP_NAME } from '../constants.js';

export const PROTOCOL = APP_NAME;

const URL_PREFIX = `${PROTOCOL}://`;

type Type = 'notes' | 'materials' | 'memos' | 'annotations' | 'files';

// App's inner url looks like: note-app://notes/abcdefg
type AppUrl = `${typeof URL_PREFIX}${Type}/${string}`;

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

export function parseHash(hash: string): FragmentSelector | null {
  return null;
}

export function getAppUrl(entityId: EntityId, entityType?: EntityTypes): AppUrl {
  const types: Record<EntityTypes, Type> = {
    [EntityTypes.Note]: 'notes',
    [EntityTypes.Material]: 'materials',
    [EntityTypes.Annotation]: 'annotations',
    [EntityTypes.Memo]: 'memos',
  };

  const type = entityType ? types[entityType] : 'files';

  return `${URL_PREFIX}${type}/${entityId}`;
}
