import { app, net } from 'electron';
import { resolve } from 'node:path';

import FileService from '#domain/server/service/FileService';
import container from '#utils/singletonContainer';
import { parseAppUrl, parseStaticUrl, RouteTypes } from '#domain/shared/infra/url';

async function queryFileBlob(id: string) {
  const fileService = container.resolve(FileService);
  const data = await fileService.queryFileBlobById(id);
  return new Response(data);
}

async function loadStatic(p: string) {
  const path = resolve(app.getAppPath(), '../../../../static', p);
  return net.fetch(`file://${path}`);
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
