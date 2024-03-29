import { container } from 'tsyringe';
import type { UploadOptions } from '@milkdown/plugin-upload';
import { Decoration } from '@milkdown/prose/view';

import { getUrlFromFileId } from '@shared/domain/infra/markdown/utils';
import MarkdownService from '@domain/app/service/MarkdownService';

import { NODE_NAME as MULTIMEDIA_NODE_NAME } from './multimedia';

export const uploadOptions: UploadOptions = {
  enableHtmlFileUploader: true,
  async uploader(files, schema) {
    const markdownService = container.resolve(MarkdownService);
    const updatedFiles = await markdownService.uploadFiles(Array.from(files));
    const multimediaNode = schema.nodes[MULTIMEDIA_NODE_NAME]!;

    return updatedFiles.map((file) => {
      const node = multimediaNode.createAndFill({
        src: getUrlFromFileId(file.id),
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
