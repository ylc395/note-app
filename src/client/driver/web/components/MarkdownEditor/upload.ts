import { container } from 'tsyringe';
import type { UploadOptions } from '@milkdown/plugin-upload';
import { Decoration } from '@milkdown/prose/view';

import { appFileProtocol } from 'infra/protocol';
import MarkdownService from 'service/MarkdownService';

import { NODE_NAME as MULTIMEDIA_NODE_NAME } from './multimedia';

const uploadOptions: UploadOptions = {
  enableHtmlFileUploader: true,
  async uploader(files, schema) {
    const markdownService = container.resolve(MarkdownService);
    const updatedFiles = await markdownService.uploadFiles(Array.from(files));
    const multimediaNode = schema.nodes[MULTIMEDIA_NODE_NAME];

    if (!multimediaNode) {
      throw new Error('schema no multimediaNode');
    }

    return updatedFiles.map((file) => {
      const node = multimediaNode.createAndFill({
        src: `${appFileProtocol}:///${file.id}`,
        alt: file.name,
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

export default uploadOptions;
