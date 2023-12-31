import { gfm } from '@milkdown/preset-gfm';
import { commonmark } from '@milkdown/preset-commonmark';
import { $prose, forceUpdate, replaceAll } from '@milkdown/utils';
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
import { Plugin, Selection } from '@milkdown/prose/state';
import { uniqueId, after } from 'lodash-es';
import '@milkdown/prose/view/style/prosemirror.css';
import '@milkdown/prose/tables/style/tables.css';

import { uploadOptions } from './uploadFile';
import multimedia from './multimedia';
import topic from './topic';
import search, { enableSearchCommand } from './search';

interface UIState {
  scrollTop?: number;
  selection?: ReturnType<Selection['toJSON']>;
}

export interface Options {
  defaultValue?: string;
  autoFocus?: boolean;
  initialUIState?: Partial<UIState>;
  onUIStateChange?: (state: UIState) => void;
  onChange?: (content: string) => void; // first time not included and only when focused
  onBlur?: () => void;
  onFocus?: () => void;
}

export default class Editor {
  private readonly milkdown: MilkdownEditor;
  readonly id = uniqueId('milkdown-'); // for debugging
  private isReadonly = false;
  private isFocused = false;
  private root?: HTMLElement;
  private contentToSet?: string;

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
      .use(cursor);

    if (this.options.onUIStateChange) {
      const plugin = $prose(
        () =>
          new Plugin({
            view: () => ({
              update: (editorView) => {
                if (editorView.hasFocus()) {
                  this.options.onUIStateChange!({ selection: editorView.state.selection.toJSON() });
                }
              },
            }),
          }),
      );
      editor.use(plugin);
    }

    editor.config((ctx) => {
      const { onChange, onUIStateChange, onBlur, onFocus, defaultValue } = this.options;
      const listener = ctx.get(listenerCtx);

      ctx.set(uploadConfig.key, uploadOptions);
      ctx.update(editorViewOptionsCtx, (prev) => ({
        ...prev,
        editable: () => !this.isReadonly,
      }));

      if (typeof defaultValue === 'string') {
        // this won't trigger event
        ctx.set(defaultValueCtx, defaultValue);
      }

      if (onChange) {
        listener.markdownUpdated(after(2, (_, markdown) => this.isFocused && onChange(markdown)));
      }

      if (onUIStateChange) {
        listener
          .mounted(() => this.root!.addEventListener('scroll', this.handleScroll))
          .destroy(() => this.root!.removeEventListener('scroll', this.handleScroll));
      }

      listener
        .blur(() => {
          if (document.hasFocus()) {
            this.isFocused = false;
            onBlur?.();
          }
        })
        .focus(() => {
          if (!this.isFocused) {
            this.isFocused = true;
            onFocus?.();
          }
        });
    });

    editor.onStatusChange((status) => {
      if (status === EditorStatus.Created) {
        if (this.contentToSet) {
          this.setContent(this.contentToSet);
        }

        this.options.autoFocus && this.focus();
        this.options.initialUIState && this.applyUIState(this.options.initialUIState);
        this.setReadonly(this.isReadonly);
      }
    });

    return editor;
  }

  mount(root: HTMLElement) {
    this.root = root;
    this.milkdown.config((ctx) => ctx.set(rootCtx, root)).create();
  }

  private readonly handleScroll = (e: Event) => {
    const { scrollTop } = e.target as HTMLElement;

    this.options.onUIStateChange!({ scrollTop });
  };

  toggleSearch(enabled: boolean) {
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

    if (this.milkdown.status !== EditorStatus.Created) {
      return;
    }

    this.milkdown.action(forceUpdate());
  }

  setContent(content: string) {
    if (this.milkdown.status !== EditorStatus.Created) {
      this.contentToSet = content;
      return;
    }

    this.contentToSet = undefined;
    console.debug(`setContent ${this.id}`);
    this.milkdown.action(replaceAll(content));
  }

  destroy() {
    console.debug(`destroy editor-${this.id}`);
    this.milkdown.destroy(true);
  }

  private applyUIState(state: UIState) {
    if (state.scrollTop) {
      this.root!.scrollTop = state.scrollTop;
    }

    if (state.selection) {
      this.milkdown.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const viewState = view.state;

        try {
          view.dispatch(viewState.tr.setSelection(Selection.fromJSON(viewState.doc, state.selection!)));
        } catch (error) {
          console.warn(error);
        }
      });
    }
  }
}
