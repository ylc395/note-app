import type { UnistNode } from 'unist-util-visit/lib';
import { match } from 'path-to-regexp';
import { parse } from 'node:url';

import { EntityTypes } from '../../model/entity';
import { URL_PREFIX } from './constants';

export function is<T extends UnistNode>(node: UnistNode, type: string): node is T {
  return node.type === type;
}

const fileUrlMatcher = match<{ id: string }>('/files/:id');

export function getFileIdFromUrl(url: string) {
  const { host, path, protocol } = parse(url);

  if (protocol && !URL_PREFIX.startsWith(protocol)) {
    return null;
  }

  const result = fileUrlMatcher(`/${host}${path}`);

  if (!result) {
    return null;
  }

  return result.params.id;
}

export function getUrlFromFileId(id: string) {
  return `${URL_PREFIX}files/${id}`;
}

const routes = [
  { type: EntityTypes.Note, matcher: match<{ id: string }>('/notes/:id') },
  { type: EntityTypes.MaterialAnnotation, matcher: match<{ id: string }>('/materials/annotations/:id') },
  { type: EntityTypes.Memo, matcher: match<{ id: string }>('/memos/:id') },
  { type: EntityTypes.Material, matcher: match<{ id: string }>('/materials/:id') },
  { type: EntityTypes.File, matcher: match<{ id: string }>('/files/:id') },
];

export function parseUrl(url: string) {
  try {
    const { protocol, host, path, hash } = parse(url);

    if (protocol && !URL_PREFIX.startsWith(protocol)) {
      return null;
    }

    for (const { type, matcher } of routes) {
      const result = matcher(`/${host}${path}`);

      if (result) {
        return { entityType: type, entityId: result.params.id, fragmentId: hash?.slice(1) || '' };
      }
    }

    return null;
  } catch {
    return null;
  }
}
