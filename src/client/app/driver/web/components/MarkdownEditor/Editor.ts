import { gfm } from '@milkdown/preset-gfm';
import { commonmark } from '@milkdown/preset-commonmark';
import { forceUpdate, replaceAll } from '@milkdown/utils';
import {
  Editor as MilkdownEditor,
  rootCtx,
  editorViewCtx,
  editorViewOptionsCtx,
  commandsCtx,
  defaultValueCtx,
  EditorStatus,
} from '@milkdown/core';
import { listenerCtx, listener } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { upload, uploadConfig } from '@milkdown/plugin-upload';
import { cursor } from '@milkdown/plugin-cursor';
import { clipboard } from '@milkdown/plugin-clipboard';
import uniqueId from 'lodash/uniqueId';
import '@milkdown/prose/view/style/prosemirror.css';
import '@milkdown/prose/tables/style/tables.css';

import { uploadOptions } from './uploadFile';
import multimedia from './multimedia';
import topic from './topic';
import search, { enableSearchCommand } from './search';

interface UIState {
  scrollTop?: number;
  cursor?: number;
}

export interface Options {
  root: HTMLElement;
  defaultValue?: string;
  autoFocus?: boolean;
  onUIStateChange?: (state: UIState) => void;
  onChange?: (content: string) => void;
  onReady?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export default class Editor {
  private readonly milkdown: MilkdownEditor;
  private readonly id = uniqueId('milkdown-'); // for debugging
  private isReadonly = false;
  constructor(private readonly options: Options) {
    console.debug(`create editor-${this.id}`);
    this.milkdown = this.init();
  }

  private init() {
    const editor = MilkdownEditor.make()
      .use(commonmark)
      .use(gfm)
      .use(multimedia)
      .use(topic)
      .use(listener)
      .use(search)
      .use(history)
      .use(upload) // upload 插件在前, 先处理粘贴文件的情况
      .use(clipboard)
      .use(cursor)
      .config((ctx) => {
        const { onChange, onUIStateChange, onBlur, onFocus, root, defaultValue } = this.options;
        const listener = ctx.get(listenerCtx);

        ctx.set(uploadConfig.key, uploadOptions);
        ctx.set(rootCtx, root);
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          editable: () => !this.isReadonly,
        }));

        if (typeof defaultValue === 'string') {
          // this won't trigger event
          ctx.set(defaultValueCtx, defaultValue);
        }

        if (onChange) {
          listener.markdownUpdated((_, markdown) => {
            this.milkdown.status === EditorStatus.Created && onChange(markdown);
          });
        }

        if (onUIStateChange) {
          listener
            .mounted(() => this.options.root.addEventListener('scroll', this.handleScroll))
            .destroy(() => this.options.root.removeEventListener('scroll', this.handleScroll));
        }

        onBlur && listener.blur(onBlur);
        onFocus && listener.focus(onFocus);
      });

    editor.create().then(() => {
      this.options.autoFocus && this.focus();
      this.options.onReady?.();
    });

    return editor;
  }

  private readonly handleScroll = (e: Event) => {
    const { scrollTop } = e.target as HTMLElement;

    this.options.onUIStateChange!({ scrollTop });
  };

  toggleSearch(enabled = false) {
    this.milkdown.action((ctx) => {
      const commandManager = ctx.get(commandsCtx);
      enabled && commandManager.call(enableSearchCommand.key);
    });
  }

  readonly focus = () => {
    this.milkdown.action((ctx) => {
      const view = ctx.get(editorViewCtx);

      if (!view.hasFocus()) {
        view.focus();
      }
    });
  };

  setReadonly(isReadonly: boolean) {
    this.isReadonly = isReadonly;
    this.milkdown.action(forceUpdate());
  }

  setContent(content: string) {
    if (this.milkdown.status !== EditorStatus.Created) {
      return;
    }

    console.debug(`setContent ${this.id}`);
    this.milkdown.action(replaceAll(content));
  }

  destroy() {
    console.debug(`destroy editor-${this.id}`);
    this.milkdown.destroy(true);
  }

  applyUIState(state: UIState) {
    if (state.scrollTop) {
      this.options.root.scrollTop = state.scrollTop;
    }

    if (state.cursor) {
      this.milkdown.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const viewState = view.state;

        view.dispatch(viewState.tr.replace(state.cursor!));
      });
    }
  }
}
