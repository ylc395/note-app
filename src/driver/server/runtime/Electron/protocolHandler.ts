import { app, net } from 'electron';
import { resolve } from 'node:path';

import FileService from '#domain/server/service/FileService';
import { container } from '#domain/shared/infra/singletons';
import { parseAppUrl, RouteTypes } from '#domain/shared/infra/url';

async function queryFileBlob(id: string) {
  const fileService = container.resolve(FileService);
  const data = await fileService.queryFileBlobById(id);
  return new Response(data);
}

async function loadStatic(fileName: string) {
  const path = resolve(app.getAppPath(), '../../../../static', fileName);
  return net.fetch(`file://${path}`);
}

export default function protocolHandler(req: Request) {
  const match = parseAppUrl(req.url);

  switch (match?.type) {
    case RouteTypes.File:
      return queryFileBlob(match.id);
    case RouteTypes.Static:
      return loadStatic(match.id);
    default:
      return new Response(null, { status: 404 });
  }
}
