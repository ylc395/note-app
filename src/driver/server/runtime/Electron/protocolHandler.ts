import { app, net } from 'electron';
import { resolve } from 'node:path';
import { match } from 'path-to-regexp';

import FileService from '#domain/server/service/FileService';
import container from '#utils/singletonContainer';
import { parseAppUrl, parseUrl, RouteTypes } from '#domain/shared/infra/url';

const matchStatic = match('/static/*path', { decode: false });

async function queryFileBlob(id: string) {
  const fileService = container.resolve(FileService);
  const data = await fileService.queryFileBlobById(id);
  return new Response(data);
}

async function loadStatic(p: string) {
  const path = resolve(app.getAppPath(), '../../../../static', p);
  return net.fetch(`file://${path}`);
}

function parseStaticUrl(url: string) {
  const parsed = parseUrl(url);

  if (!parsed) {
    return;
  }

  const result = matchStatic(parsed.pathname);

  if (result && typeof result.params.path === 'string') {
    return result.params.path;
  }

  return null;
}

export default function protocolHandler(req: Request) {
  const staticPath = parseStaticUrl(req.url);

  if (staticPath) {
    return loadStatic(staticPath);
  }

  const match = parseAppUrl(req.url);

  if (match?.type === RouteTypes.File) {
    // 只有 file 会被网络请求的形式获取（例如 iconPicker 中获取自定义图标）
    return queryFileBlob(match.id);
  }

  return new Response(null, { status: 404 });
}
