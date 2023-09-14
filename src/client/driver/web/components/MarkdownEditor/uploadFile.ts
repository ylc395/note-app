import { container } from 'tsyringe';
import type { UploadOptions } from '@milkdown/plugin-upload';
import { Decoration } from '@milkdown/prose/view';
import { $prose } from '@milkdown/utils';
import { Plugin } from '@milkdown/prose/state';

import { getUrlFromFileId } from 'infra/markdown/utils';
import MarkdownService from 'service/MarkdownService';

import { NODE_NAME as MULTIMEDIA_NODE_NAME } from './multimedia';

export const uploadOptions: UploadOptions = {
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

// paste html & transform online url to app url
export const htmlUpload = $prose(() => {
  return new Plugin({
    props: {
      handlePaste(view, event) {
        const { clipboardData } = event;
        const editable = view.props.editable?.(view.state);

        if (!editable || !clipboardData) return false;

        const currentNode = view.state.selection.$from.node();
        if (currentNode.type.spec.code) return false;

        const html = clipboardData.getData('text/html');

        if (!html) {
          return false;
        }

        const template = document.createElement('template');
        template.innerHTML = html;

        const treeWalker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
        let node = treeWalker.nextNode();
        const mediaElements: (HTMLImageElement | HTMLVideoElement | HTMLAudioElement)[] = [];

        while (node) {
          if (
            node instanceof HTMLImageElement ||
            node instanceof HTMLVideoElement ||
            node instanceof HTMLAudioElement
          ) {
            mediaElements.push(node);
          }

          node = treeWalker.nextNode();
        }

        if (mediaElements.length === 0) {
          return false;
        }

        const markdownService = container.resolve(MarkdownService);

        markdownService.uploadFiles(mediaElements.map((el) => el.src)).then((results) => {
          for (const [index, result] of results.entries()) {
            if (typeof result === 'string') {
              continue;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            mediaElements[index]!.src = getUrlFromFileId(result.id);
          }

          const dataTransfer = new DataTransfer();
          dataTransfer.setData('text/html', template.innerHTML);
          view.dom.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dataTransfer }));
        });

        return true;
      },
    },
  });
});
