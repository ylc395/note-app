import type { MatchFunction } from 'path-to-regexp';
import { app, net } from 'electron';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

import FileService from '#domain/server/service/FileService';
import container from '#utils/singletonContainer';
import { matcher, RouteTypes } from '#domain/shared/infra/url';

async function queryFileBlob(id: string) {
  const fileService = container.resolve(FileService);
  const data = await fileService.queryFileBlobById(id);
  return new Response(data);
}

async function loadStatic(p: string) {
  const path = join(app.getAppPath(), 'static', p);
  return net.fetch(pathToFileURL(path).toString());
}

const routers: Array<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  matcher: MatchFunction<any>;
  handler: (params: { params: Record<string, string>; query: URLSearchParams }) => Promise<Response>;
}> = [
  { matcher: matcher[RouteTypes.File], handler: ({ params: { id } }) => queryFileBlob(id!) },
  { matcher: matcher[RouteTypes.Static], handler: ({ params: { path } }) => loadStatic(path!) },
];

export default function protocolHandler(req: Request) {
  const { pathname, searchParams } = new URL(req.url);

  for (const { matcher, handler } of routers) {
    const matched = matcher(pathname);

    if (matched) {
      return handler({ params: matched.params, query: searchParams });
    }
  }

  return new Response(null, { status: 404 });
}
