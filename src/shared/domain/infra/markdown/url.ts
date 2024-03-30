import { EntityTypes, type EntityLocator } from '../../model/entity.js';
import { APP_NAME } from '../constants.js';
import type { FileVO } from '../../model/file.js';

export const PROTOCOL = APP_NAME;

const URL_PREFIX = `${PROTOCOL}://`;

function parseAppUrl(url: string) {
  if (!URL.canParse(url)) {
    return null;
  }

  // @see https://github.com/nodejs/node/issues/52276
  const { pathname, hash, protocol, host } = new URL(url);

  if (protocol.slice(0, -1) !== PROTOCOL) {
    return null;
  }

  const [_type, id] = pathname.replace('//', '').split('/');
  const type = _type || host;

  if (type && id) {
    return { type, id, hash: hash.slice(1) };
  }

  return null;
}

export function fileIdToUrl(id: FileVO['id']) {
  return `${URL_PREFIX}files/${id}`;
}

export function urlToFileId(url: string) {
  const parsed = parseAppUrl(url);

  if (parsed?.type === 'files') {
    return parsed.id;
  }

  return null;
}

const NOTES_PATH = 'notes';
const MATERIALS_PATH = 'materials';
const MEMOS_PATH = 'memos';
const ANNOTATIONS_PATH = 'annotations';

export function entityIdToUrl({ entityId, entityType }: EntityLocator) {
  const mapping = {
    [EntityTypes.Note]: NOTES_PATH,
    [EntityTypes.Material]: MATERIALS_PATH,
    [EntityTypes.Memo]: MEMOS_PATH,
    [EntityTypes.Annotation]: ANNOTATIONS_PATH,
  }[entityType];

  return `${URL_PREFIX}${mapping[entityType]}/${entityId}`;
}

export function urlToEntity(url: string) {
  const parsed = parseAppUrl(url);
  const mapping = {
    [NOTES_PATH]: EntityTypes.Note,
    [MATERIALS_PATH]: EntityTypes.Material,
    [MEMOS_PATH]: EntityTypes.Memo,
    [ANNOTATIONS_PATH]: EntityTypes.Annotation,
  };

  if (parsed && parsed.type in mapping) {
    return {
      entityId: parsed.id,
      fragmentId: parsed.hash,
      type: mapping[parsed.type as keyof typeof mapping],
    };
  }

  return null;
}
