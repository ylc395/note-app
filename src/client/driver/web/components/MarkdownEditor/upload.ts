import { container } from 'tsyringe';
import type { UploadOptions } from '@milkdown/plugin-upload';
import { Decoration } from '@milkdown/prose/view';

import { fileProtocol } from 'infra/protocol';
import MarkdownService from 'service/MarkdownService';

const uploadOptions: UploadOptions = {
  enableHtmlFileUploader: true,
  async uploader(files, schema) {
    const markdownService = container.resolve(MarkdownService);
    const updatedFiles = await markdownService.uploadFiles(Array.from(files));
    const { image } = schema.nodes;

    if (!image) {
      throw new Error('schema no image');
    }

    return updatedFiles.map((file) => {
      // if (file.mimeType.startsWith('image')) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return image.createAndFill({ src: `${fileProtocol}:///${file.id}`, alt: file.name })!;
      // }
    });
  },
  uploadWidgetFactory: (pos, spec) => {
    const widgetDOM = document.createElement('span');
    widgetDOM.textContent = 'Upload in progress...';
    return Decoration.widget(pos, widgetDOM, spec);
  },
};

export default uploadOptions;
