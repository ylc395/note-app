import { without } from 'lodash-es';
import {
  defaultValueCtx,
  EditorStatus,
  editorViewCtx,
  editorViewOptionsCtx,
  Editor as MilkdownEditor,
  rootCtx,
} from '@milkdown/kit/core';
import { commonmark, keymap as commonmarkKeymap } from '@milkdown/kit/preset/commonmark';
import { gfm, keymap as gfmKeymap } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';
import { listener, listenerCtx, type ListenerManager } from '@milkdown/kit/plugin/listener';
import { replaceAll } from '@milkdown/kit/utils';
import { upload, uploadConfig } from '@milkdown/kit/plugin/upload';
import { cursor } from '@milkdown/kit/plugin/cursor';

import { deleteEmptyNode } from './deleteEmptyNode';
import multimedia from './multimedia';
import { uploader } from './uploader';
import './index.css';

/** 一些关于 milkdown 的知识
 *
 * 1. milkdown 是基于 prosemirror 的封装，它提供了很多 node schema（这是 prosemirror 的概念，见 https://prosemirror.net/docs/guide/#schema）
 * 每一个 node schema 描述了一个文档节点的类型和能力，包括该节点实例的内部状态、逻辑、和其它类型的节点的嵌套关系等，
 * 以及如何将一个 prosemirror node 转化成 DOM node 以及反向转化（例如用户往编辑器里粘贴 HTML 时，需要将 HTML 反向解析成 prosemirror node tree）
 *
 * milkdown 提供的 node schema 通常是和 markdown 文档有关的元素，例如段落、引用、列表、强调、表格等等。
 *
 * 2. milkdown 提供了将 markdown 文本序列化到 prosemirror node tree的能力，做法是将 markdown 文本用 remark 解析成 mdast，再映射到 prosemirror node tree
 * 这个行为通常只发生在：1. 编辑器被提供了初始值时 2. 编辑器被 replaceAll 全文替换时。总之可以认为只发生在某种“初始化”操作的过程中。
 * 用户在编辑器中的输入操作，不涉及这一行为，而完全只涉及 prosemirror 的相关能力（使用 automd 插件时是个例外，但我们不特别介绍该插件）
 *
 * 3. 把 prosemirror node tree 映射到 mdast 再转化为 markdown 文本的能力（与 2 的方向相反）也不在话下。该行为仅发生于程序员显式要求获取 markdown 文本时。同样地，用户在编辑器中的输入操作不涉及这一行为
 *
 * 综上，当需要自定义扩展一个 node type 时，需要为该 node type 提供以上 3 个能力的实现，即：prosemirror node schema 的定义 / remark 序列化/ 反序列化相关实现
 *
 * 其它部分的能力基本上是纯 prosemirror 扩展机制，而与 remark 无关。
 * 例如，作为主要卖点之一的 input rule 机制（即用户输入某些字符后，编辑器自动创建对应节点，如输入 ##空格后，编辑器自动创建标题节点），只是在 prosemirror 得到用户输入后匹配正则，随后创建对应节点。这与 markdown ast 无任何关系
 * 至于各个节点如何展示，同样也是通过为每个 node type 提供对应的 prosemirror node view（https://prosemirror.net/docs/guide/#view.node_views）来实现
 */
export default class Editor {
  private readonly core: MilkdownEditor;

  constructor(props: { editable?: boolean; root: HTMLElement; defaultValue?: string }) {
    this.core = MilkdownEditor.make()
      .use(without(commonmark, ...commonmarkKeymap)) // 不要引入快捷键。我们自己定制
      .use(without(gfm, ...gfmKeymap))
      .use(history)
      .use(deleteEmptyNode)
      .use(upload)
      .use(cursor) // 这个必须放在 upload 之后，否则 upload 插件无法处理 drop 事件了
      .use(multimedia)
      .use(listener)
      .config((ctx) => {
        ctx.set(rootCtx, props.root);
        ctx.set(defaultValueCtx, props.defaultValue || '');
        ctx.set(editorViewOptionsCtx, {
          editable: () => props.editable ?? true,
        });

        ctx.update(uploadConfig.key, (config) => ({ ...config, uploader }));
      });
  }

  public setReadonly(value: boolean) {
    this.core.action((ctx) => {
      if (this.core.status === EditorStatus.Created) {
        const view = ctx.get(editorViewCtx);
        view.setProps({
          editable: () => !value,
        });
      }
    });

    return this;
  }

  public focus() {
    this.core.action((ctx) => ctx.get(editorViewCtx).focus());
  }

  public on(fn: (api: ListenerManager) => void) {
    if (this.core.status !== EditorStatus.Created) {
      this.core.config((ctx) => {
        const listener = ctx.get(listenerCtx);
        fn(listener);
      });
      return this;
    }
    this.core.action((ctx) => {
      const listener = ctx.get(listenerCtx);
      fn(listener);
    });
    return this;
  }

  public replaceContent(body: string) {
    if (this.core.status === EditorStatus.Created) {
      this.core.action(replaceAll(body));
    }
  }

  public async destroy() {
    await this.core.destroy(true);
  }

  public init() {
    return this.core.create();
  }
}
