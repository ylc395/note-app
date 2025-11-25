import { imageSchema } from '@milkdown/kit/preset/commonmark';
import { observable, reaction } from 'mobx';
import { $view } from '@milkdown/kit/utils';
import type { NodeViewConstructor } from '@milkdown/kit/prose/view';
import type { Node } from '@milkdown/kit/prose/model';
import { createQuery } from 'mobx-tanstack-query/preset';

import { getAppUrl, parseAppUrl, RouteTypes } from '#domain/shared/infra/url';
import container from '#utils/singletonContainer';
import { token } from '#domain/client/shared/infra/rpc';

// 把 mdast 中的 image 解释成 multimedia 节点
const multimediaNodeSchema = imageSchema.extendSchema((imageSchema) => {
  return (ctx) => {
    const baseSchema = imageSchema(ctx);

    return {
      ...baseSchema,
      // 默认渲染成一个无实质内容的标签。我们将用 node view 来进行真正的渲染
      toDOM: () => {
        return document.createElement('span');
      },
      parseDOM: [
        ...baseSchema.parseDOM!,
        {
          tag: 'video[src]',
          getAttrs: (dom) => {
            if (!(dom instanceof HTMLElement)) throw new Error(dom);

            return {
              src: dom.getAttribute('src') || '',
              alt: dom.getAttribute('alt') || '',
              title: dom.getAttribute('title') || dom.getAttribute('alt') || '',
            };
          },
        },
      ],
    };
  };
});

const multimediaNodeView = $view(multimediaNodeSchema.node, (): NodeViewConstructor => {
  const remote = container.resolve(token);

  const getFileId = (node: Node) => {
    const parsed = parseAppUrl(node.attrs.src);
    return parsed?.type === RouteTypes.File ? parsed.id : null;
  };

  return (initialNode) => {
    const abortController = new AbortController();
    const rootNode = document.createElement('span');
    const fileId = observable.box(getFileId(initialNode));

    const fileQuery = createQuery(({ queryKey: [_, { id }] }) => remote.file.queryOneById.query(id), {
      staleTime: Infinity,
      abortSignal: abortController.signal,
      options: () => ({
        enabled: Boolean(fileId.get()),
        queryKey: ['files', { id: fileId.get()! }] as const,
      }),
    });

    reaction(
      () => fileQuery.result.data,
      (result) => {
        if (!result) {
          return;
        }

        let el: HTMLImageElement | HTMLVideoElement | undefined;

        if (result.mimeType.startsWith('image')) {
          el = document.createElement('img');
          el.alt = initialNode.attrs.alt;
        }

        if (result.mimeType.startsWith('video')) {
          el = document.createElement('video');
          el.controls = true;
        }

        if (!el) {
          return;
        }

        el.src = getAppUrl(RouteTypes.File, fileId.get()!);
        el.title = initialNode.attrs.title;

        rootNode.replaceChildren(el);
      },
      { signal: abortController.signal, fireImmediately: true },
    );

    // https://prosemirror.net/docs/ref/#view.NodeView
    return {
      dom: rootNode,
      update: (node) => {
        fileId.set(getFileId(node));
        return true;
      },
      destroy: () => {
        abortController.abort();
      },
    };
  };
});

export const multimedia = [...multimediaNodeSchema, multimediaNodeView];
