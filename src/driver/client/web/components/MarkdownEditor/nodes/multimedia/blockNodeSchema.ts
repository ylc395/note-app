import { expectDomTypeError } from '@milkdown/exception';
import { imageBlockSchema } from '@milkdown/kit/component/image-block';
import type { NodeViewConstructor } from '@milkdown/kit/prose/view';
import { $view } from '@milkdown/kit/utils';
import { createComponent, createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import View from './View';

// image-block 这个库，我们只取对 ast 的处理，不取其中的视图实现（而是由我们自己实现)
export { remarkImageBlockPlugin } from '@milkdown/kit/component/image-block';

const DATA_TYPE = 'multimedia-block';

// 把 mdast 中的 image-block 在 prosemirror 层面解释成 multimedia-block 节点
export const multimediaBlockNodeSchema = imageBlockSchema.extendSchema((originSchema) => {
  return (ctx) => {
    const baseSchema = originSchema(ctx);

    return {
      ...baseSchema,
      draggable: false,
      // 默认渲染成一个无实质内容的标签。我们将用 node view 来进行真正的渲染
      // 但这个标签里必须包含足够的信息，以供 prosemirror 可能的反序列化（复制到某个文档里触发 parseDOM）
      toDOM: (node) => {
        const div = document.createElement('div');

        Object.assign(div.dataset, {
          ...node.attrs,
          type: DATA_TYPE,
        });

        return div;
      },
      parseDOM: [
        // 从其它应用里复制过来的 HTML，一律不识别为 multiple-block（后续可以考虑解析下 figure 元素之类的），因此我们只关心 toDOM 的特征（应用内互相复制内容）
        {
          tag: `div[data-type="${DATA_TYPE}"]`,
          getAttrs: (dom) => {
            if (!(dom instanceof HTMLElement)) throw expectDomTypeError(dom);

            return {
              src: dom.getAttribute('src') || '',
              caption: dom.getAttribute('caption') || '',
              ratio: Number(dom.getAttribute('ratio') ?? 1),
            };
          },
        },
      ],
    };
  };
});

export const multimediaBlockNodeView = $view(multimediaBlockNodeSchema.node, (): NodeViewConstructor => {
  return (initialNode, editorView, getNodePos) => {
    const rootNode = document.createElement('figure');
    rootNode.className = 'flex flex-col';

    const [attrs, setAttrs] = createSignal(initialNode.attrs);
    const props = {
      editorView,
      figure: true,
      get attrs() {
        return attrs();
      },
      get nodePos() {
        return getNodePos();
      },
    };
    const dispose = render(() => createComponent(View, props), rootNode);

    // https://prosemirror.net/docs/ref/#view.NodeView
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
