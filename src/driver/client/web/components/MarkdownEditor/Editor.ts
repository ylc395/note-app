import {
  defaultValueCtx,
  EditorStatus,
  editorViewCtx,
  editorViewOptionsCtx,
  Editor as MilkdownEditor,
  rootCtx,
} from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';
import { listener, listenerCtx, type ListenerManager } from '@milkdown/kit/plugin/listener';
import { replaceAll } from '@milkdown/kit/utils';
import './index.css';

export default class Editor {
  private readonly core: MilkdownEditor;

  constructor(props: { editable?: boolean; root: HTMLElement; defaultValue?: string; editorRootClassName?: string }) {
    this.core = MilkdownEditor.make()
      .config((ctx) => {
        ctx.set(rootCtx, props.root);
        ctx.set(defaultValueCtx, props.defaultValue || '');
        ctx.set(editorViewOptionsCtx, {
          editable: () => props.editable ?? true,
          attributes: {
            class: props.editorRootClassName || '',
          },
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener);
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

  public hasFocus() {
    return this.core.ctx.get(editorViewCtx).hasFocus();
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
