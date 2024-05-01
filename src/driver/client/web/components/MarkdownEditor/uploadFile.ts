import { container } from 'tsyringe';
import type { UploadOptions } from '@milkdown/plugin-upload';
import { Decoration } from '@milkdown/prose/view';

import { fileIdToUrl } from '@domain/shared/infra/markdown/url';
import { token as remoteToken } from '@domain/client/common/infra/rpc';

import { NODE_NAME as MULTIMEDIA_NODE_NAME } from './multimedia';

export const uploadOptions: UploadOptions = {
  enableHtmlFileUploader: true,
  async uploader(files, schema) {
    const remote = container.resolve(remoteToken);
    const fileDTOs = await Promise.all(
      Array.from(files).map(async (file) => ({
        data: await file.arrayBuffer(),
        mimeType: file.type,
        lang: [],
      })),
    );

    const updatedFiles = await Promise.all(fileDTOs.map((file) => remote.file.upload.mutate(file)));
    const multimediaNode = schema.nodes[MULTIMEDIA_NODE_NAME]!;

    return updatedFiles.map((file) => {
      const node = multimediaNode.createAndFill({
        src: fileIdToUrl(file.id),
        alt: file.id,
      });

      if (!node) {
        throw new Error('create node failed');
      }

      return node;
    });
  },
  uploadWidgetFactory: (pos, spec) => {
    const widgetDOM = document.createElement('span');
    widgetDOM.textContent = 'Upload in progress...';
    return Decoration.widget(pos, widgetDOM, spec);
  },
};
