import type { Uploader } from '@milkdown/kit/plugin/upload';

import container from '#utils/singletonContainer';
import { token } from '#domain/client/shared/infra/rpc';
import { getAppUrl, RouteTypes } from '#domain/shared/infra/url';

export const uploader: Uploader = async (files, schema) => {
  const remote = container.resolve(token);

  const nodes = await Promise.all(
    Array.from(files).map(async (file) => {
      const { id } = await remote.file.upload.mutate({
        mimeType: file.type,
        data: await file.arrayBuffer(),
      });

      const attrs = {
        src: getAppUrl(RouteTypes.File, id),
        alt: file.name,
      };

      // image schema 已经被扩展为 multimedia schema，用于表示任何文件
      return schema.nodes.image!.create(attrs)!;
    }),
  );

  return nodes;
};
