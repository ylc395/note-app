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
} from '@milkdown/core';
import { listenerCtx, listener } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { upload, uploadConfig } from '@milkdown/plugin-upload';
import { cursor } from '@milkdown/plugin-cursor';
import { clipboard } from '@milkdown/plugin-clipboard';
import uniqueId from 'lodash/uniqueId';
import '@milkdown/prose/view/style/prosemirror.css';
import '@milkdown/prose/tables/style/tables.css';

import { uploadOptions, htmlUpload } from './uploadFile';
import multimedia from './multimedia';
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
  onChange?: (content: string) => void; // won't fire when calling setContent
  onReady?: () => void;
}

export default class Editor {
  private readonly milkdown: MilkdownEditor;
  readonly id = uniqueId(); // for debugging
  private isReadonly = false;
  constructor(private readonly options: Options) {
    this.milkdown = this.init();
  }

  private isUpdating = false;

  private init() {
    const editor = MilkdownEditor.make()
      .use(multimedia) // order attention!
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .use(search)
      .use(history)
      .use(upload) // upload 插件在前, 先处理粘贴文件的情况
      .use(htmlUpload)
      .use(clipboard)
      .use(cursor)
      .config((ctx) => {
        const { onChange, onUIStateChange, root, defaultValue } = this.options;

        ctx.set(uploadConfig.key, uploadOptions);
        ctx.set(rootCtx, root);
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          editable: () => !this.isReadonly,
        }));

        if (typeof defaultValue === 'string') {
          ctx.set(defaultValueCtx, defaultValue);
        }

        if (onChange) {
          ctx.get(listenerCtx).markdownUpdated((_, markdown, pre) => {
            if (typeof pre === 'string' && !this.isUpdating) {
              onChange(markdown);
            }
          });
        }

        if (onUIStateChange) {
          ctx.get(listenerCtx).mounted(() => {
            this.options.root.addEventListener('scroll', this.handleScroll);
          });
          ctx.get(listenerCtx).destroy(() => {
            this.options.root.removeEventListener('scroll', this.handleScroll);
          });
        }
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

  focus() {
    this.milkdown.action((ctx) => {
      const view = ctx.get(editorViewCtx);

      if (!view.hasFocus()) {
        view.focus();
      }
    });
  }

  setReadonly(isReadonly: boolean) {
    this.isReadonly = isReadonly;
    this.milkdown.action(forceUpdate());
  }

  setContent(content: string) {
    console.debug(`setContent editor-${this.id}`);

    this.isUpdating = true;
    this.milkdown.action(replaceAll(content));
    this.isUpdating = false;
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
