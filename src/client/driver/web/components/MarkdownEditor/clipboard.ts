/* fork from https://github.com/Milkdown/milkdown/blob/6919ff0c4f8742244deff8468164bf944da32b45/packages/plugin-clipboard/src/index.ts */
import { editorViewOptionsCtx, parserCtx, schemaCtx, serializerCtx } from '@milkdown/core';
import { getNodeFromSchema } from '@milkdown/prose';
import type { Node } from '@milkdown/prose/model';
import { DOMParser, DOMSerializer } from '@milkdown/prose/model';
import { Plugin, PluginKey, TextSelection } from '@milkdown/prose/state';
import { $prose } from '@milkdown/utils';
import { container } from 'tsyringe';

import MarkdownService from 'service/MarkdownService';
import { appFileProtocol } from 'infra/protocol';

type UnknownRecord = Record<string, unknown>;
const isPureText = (content: UnknownRecord | UnknownRecord[] | undefined | null): boolean => {
  if (!content) return false;
  if (Array.isArray(content)) {
    if (content.length > 1) return false;
    return isPureText(content[0]);
  }

  const child = content.content;
  if (child) return isPureText(child as UnknownRecord[]);

  return content.type === 'text';
};

/// The prosemirror plugin for clipboard.
export const clipboard = $prose((ctx) => {
  const schema = ctx.get(schemaCtx);

  // Set editable props for https://github.com/Milkdown/milkdown/issues/190
  ctx.update(editorViewOptionsCtx, (prev) => ({
    ...prev,
    editable: prev.editable ?? (() => true),
  }));

  const key = new PluginKey('MILKDOWN_CLIPBOARD');
  const plugin = new Plugin({
    key,
    props: {
      handlePaste: (view, event) => {
        const parser = ctx.get(parserCtx);
        const editable = view.props.editable?.(view.state);
        const { clipboardData } = event;
        if (!editable || !clipboardData) return false;

        const currentNode = view.state.selection.$from.node();
        if (currentNode.type.spec.code) return false;

        const text = clipboardData.getData('text/plain');

        // if is copied from vscode, try to create a code block
        const vscodeData = clipboardData.getData('vscode-editor-data');
        if (vscodeData) {
          const data = JSON.parse(vscodeData);
          const language = data?.mode;
          if (text && language) {
            const { tr } = view.state;
            const codeBlock = getNodeFromSchema('code_block', schema);

            tr.replaceSelectionWith(codeBlock.create({ language }))
              .setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, tr.selection.from - 2))))
              .insertText(text.replace(/\r\n?/g, '\n'));

            view.dispatch(tr);
            return true;
          }
        }

        const html = clipboardData.getData('text/html');
        if (html.length === 0 && text.length === 0) return false;

        const domParser = DOMParser.fromSchema(schema);
        let dom: HTMLElement | DocumentFragment;
        if (html.length === 0) {
          const slice = parser(text);
          if (!slice || typeof slice === 'string') return false;

          // https://github.com/Milkdown/milkdown/pull/936#issuecomment-1468084298
          dom = DOMSerializer.fromSchema(schema).serializeFragment(slice.content);
          view.dispatch(view.state.tr.replaceSelection(domParser.parseSlice(dom)));
        } else {
          const template = document.createElement('template');
          template.innerHTML = html;
          dom = template.content.cloneNode(true) as HTMLElement;
          template.remove();

          const treeWalker = document.createTreeWalker(dom, NodeFilter.SHOW_ELEMENT);
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

          if (mediaElements.length > 0) {
            const markdownService = container.resolve(MarkdownService);
            markdownService.uploadFiles(mediaElements.map((el) => el.src)).then((results) => {
              for (const [index, result] of results.entries()) {
                if (typeof result === 'string') {
                  continue;
                }
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                mediaElements[index]!.src = `${appFileProtocol}:///${result.id}`;
              }
              // todo: what if uploading lasts too long? use placeholder ?
              view.dispatch(view.state.tr.replaceSelection(domParser.parseSlice(dom)));
            });
          } else {
            view.dispatch(view.state.tr.replaceSelection(domParser.parseSlice(dom)));
          }
        }

        return true;
      },
      clipboardTextSerializer: (slice) => {
        const serializer = ctx.get(serializerCtx);
        const isText = isPureText(slice.content.toJSON());
        if (isText) return (slice.content as unknown as Node).textBetween(0, slice.content.size, '\n\n');

        const doc = schema.topNodeType.createAndFill(undefined, slice.content);
        if (!doc) return '';
        const value = serializer(doc);
        return value;
      },
    },
  });

  return plugin;
});
