import { compile, match } from 'path-to-regexp';
import { mapValues } from 'lodash-es';
import { APP_NAME } from './constants';

export const PROTOCOL = APP_NAME;

const HOST_NAME = 'localhost'; // 这个没什么意义，纯占位符。随便给一个值

export enum RouteTypes {
  Static = 'static',
  File = 'file',
  Note = 'note',
  Memo = 'memo',
  Annotation = 'annotation',
}

const routes = {
  [RouteTypes.Static]: '/static/*id', // 这里的 id 实际上是路径（包含 /）
  [RouteTypes.File]: '/files/:id',
  [RouteTypes.Note]: '/notes/:id',
  [RouteTypes.Memo]: '/memos/:id',
  [RouteTypes.Annotation]: '/annotations/:id',
};

const matcher = mapValues(routes, (v) => match(v, { decode: false }));

const generator = mapValues(routes, (v) => compile(v, { encode: false }));

export function getAppUrl(type: RouteTypes, id: string) {
  return `${PROTOCOL}://${HOST_NAME}${generator[type]({ id })}`;
}

export function parseAppUrl(url: string) {
  if (!URL.canParse(url)) {
    return null;
  }

  const { hostname, pathname, protocol, hash } = new URL(url);

  if (protocol !== `${PROTOCOL}:` || hostname !== HOST_NAME) {
    return null;
  }

  for (const [type, matchFn] of Object.entries(matcher)) {
    const matchResult = matchFn(pathname);

    if (matchResult && typeof matchResult.params.id === 'string') {
      return {
        type: type as RouteTypes,
        id: matchResult.params.id,
        hash,
      };
    }
  }

  return null;
}
