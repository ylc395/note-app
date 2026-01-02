import { imageSchema } from '@milkdown/kit/preset/commonmark';
import { $view } from '@milkdown/kit/utils';
import type { NodeViewConstructor } from '@milkdown/kit/prose/view';
import { expectDomTypeError } from '@milkdown/exception';
import { omit } from 'lodash-es';
import { render } from 'solid-js/web';
import { createComponent, createSignal } from 'solid-js';
import View from './View';

const DATA_TYPE = 'multimedia';

// 把 mdast 中的 image 在 prosemirror 层面解释成 multimedia 节点
export const multimediaNodeSchema = imageSchema.extendSchema((imageSchema) => {
  return (ctx) => {
    const baseSchema = imageSchema(ctx);

    return {
      ...baseSchema,
      // 默认渲染成一个无实质内容的标签。我们将用 node view 来进行真正的渲染
      // 但这个标签里必须包含足够的信息，以供 prosemirror 可能的反序列化（复制到某个文档里触发 parseDOM）
      toDOM: (node) => {
        const span = document.createElement('span');

        Object.assign(span.dataset, {
          ...node.attrs,
          [DATA_TYPE]: true,
        });

        return span;
      },
      parseDOM: [
        ...baseSchema.parseDOM!,
        {
          tag: 'video[src]',
          getAttrs: (dom) => {
            if (!(dom instanceof HTMLElement)) throw expectDomTypeError(dom);

            return {
              src: dom.getAttribute('src') || '',
              alt: dom.getAttribute('alt') || '',
              title: dom.getAttribute('title') || dom.getAttribute('alt') || '',
            };
          },
        },
        {
          tag: `span[data-${DATA_TYPE}"]`,
          getAttrs: (dom) => {
            return omit(dom.dataset, ['type']);
          },
        },
      ],
    };
  };
});

export const multimediaNodeView = $view(multimediaNodeSchema.node, (): NodeViewConstructor => {
  return (initialNode, editorView, getNodePos) => {
    const rootNode = document.createElement('span');
    rootNode.className = 'mx-stack-xs';

    const [attrs, setAttrs] = createSignal(initialNode.attrs);
    const props = {
      editorView,
      get attrs() {
        return attrs();
      },
      get nodePos() {
        return getNodePos();
      },
    };

    const dispose = render(() => createComponent(View, props), rootNode);

    return {
      dom: rootNode,
      update: (_node) => {
        setAttrs(_node.attrs);
        return true;
      },
      destroy: () => {
        dispose();
        rootNode.remove();
      },
    };
  };
});
