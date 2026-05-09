import { compile, match } from 'path-to-regexp';
import { mapValues } from 'lodash-es';
import { APP_NAME } from './constants';
import { EntityTypes } from '../model/entity';

export const PROTOCOL = APP_NAME;

const HOST_NAME = 'app'; // 这个没什么意义，纯占位符。随便给一个值

export enum RouteTypes {
  File = 'file',
  Note = 'note',
  Memo = 'memo',
  Annotation = 'annotation',
  Static = 'static',
}

const routes = {
  [RouteTypes.File]: '/files/:id',
  [RouteTypes.Note]: '/notes/:id',
  [RouteTypes.Memo]: '/memos/:id',
  [RouteTypes.Annotation]: '/annotations/:id',
  [RouteTypes.Static]: '/static/*path',
};

export const matcher = mapValues(routes, (v) => match(v, { decode: false }));

const generator = mapValues(routes, (v) => compile(v, { encode: false }));

export function getAppUrl(type: keyof typeof generator | EntityTypes, id: string) {
  return `${PROTOCOL}://${HOST_NAME}${generator[typeof type === 'number' ? toRouteType(type) : type]({
    id,
  })}`;
}

export type AppUrlParams = NonNullable<ReturnType<typeof parseAppUrl>>;

function toRouteType(type: EntityTypes) {
  return {
    [EntityTypes.Annotation]: RouteTypes.Annotation,
    [EntityTypes.Memo]: RouteTypes.Memo,
    [EntityTypes.Note]: RouteTypes.Note,
  }[type];
}

export function toEntityType(type: RouteTypes) {
  const map: Partial<Record<RouteTypes, EntityTypes>> = {
    [RouteTypes.Annotation]: EntityTypes.Annotation,
    [RouteTypes.Memo]: EntityTypes.Memo,
    [RouteTypes.Note]: EntityTypes.Note,
  };

  return map[type];
}

export function parseAppUrl(url: string) {
  if (!URL.canParse(url)) {
    return null;
  }

  const parsed = new URL(url);

  if (parsed.protocol !== `${PROTOCOL}:` || parsed.hostname !== HOST_NAME) {
    return null;
  }

  const { pathname, hash, searchParams } = parsed;

  for (const [type, matchFn] of Object.entries(matcher)) {
    const matchResult = matchFn(pathname);

    if (matchResult && typeof matchResult.params.id === 'string') {
      return {
        type: type as RouteTypes,
        id: matchResult.params.id,
        hash,
        query: searchParams,
      };
    }
  }

  return null;
}
