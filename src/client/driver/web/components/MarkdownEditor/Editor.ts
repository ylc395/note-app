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
import { uniqueId } from 'lodash-es';
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
  onChange?: (content: string) => void; // only when focused
}

export default class Editor {
  private readonly milkdown: MilkdownEditor;
  public readonly id = uniqueId('milkdown-'); // for debugging
  private isReadonly = false;
  private isReady = false;
  private root?: HTMLElement;
  private uiState?: UIState;

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

    editor.use(
      $prose(
        () =>
          new Plugin({
            view: () => ({
              update: (editorView) => {
                if (editorView.hasFocus()) {
                  const uiState = { selection: editorView.state.selection.toJSON() };
                  this.options.onUIStateChange?.(uiState);
                  this.uiState = uiState;
                }
              },
            }),
          }),
      ),
    );

    editor.config((ctx) => {
      const { onChange, defaultValue } = this.options;
      const listener = ctx.get(listenerCtx);

      ctx.set(uploadConfig.key, uploadOptions);
      ctx.update(editorViewOptionsCtx, (prev) => ({
        ...prev,
        editable: () => {
          // UI state can not be applied if editorView is not editable
          // so we only set real `isReadonly` when created
          return this.isReady ? !this.isReadonly : true;
        },
      }));

      if (typeof defaultValue === 'string') {
        // this won't trigger event
        ctx.set(defaultValueCtx, defaultValue);
      }

      listener
        .markdownUpdated((_, markdown) => {
          if (this.isReady && ctx.get(editorViewCtx).hasFocus()) {
            onChange?.(markdown);
          }
        })
        .mounted(() => this.root!.addEventListener('scroll', this.handleScroll))
        .destroy(() => this.root!.removeEventListener('scroll', this.handleScroll));
    });

    editor.onStatusChange((status) => {
      if (status === EditorStatus.Created) {
        this.options.autoFocus && this.focus();

        if (this.options.initialUIState) {
          this.uiState = this.options.initialUIState;
          this.applyUIState(this.options.initialUIState);
        }

        this.isReady = true;
      }
    });

    return editor;
  }

  public mount(root: HTMLElement) {
    this.root = root;
    this.milkdown.config((ctx) => ctx.set(rootCtx, root)).create();
  }

  private readonly handleScroll = (e: Event) => {
    const { scrollTop } = e.target as HTMLElement;

    this.options.onUIStateChange!({ scrollTop });
  };

  public toggleSearch(enabled: boolean) {
    this.milkdown.action((ctx) => {
      const commandManager = ctx.get(commandsCtx);
      enabled && commandManager.call(enableSearchCommand.key);
    });
  }

  public readonly focus = () => {
    this.milkdown.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      view.focus();
    });
  };

  public setReadonly(isReadonly: boolean) {
    this.isReadonly = isReadonly;

    if (!this.isReady) {
      return;
    }

    // we should apply ui state before forceUpdate
    if (this.uiState) {
      this.applyUIState(this.uiState);
    }

    this.milkdown.action(forceUpdate());

    if (!isReadonly) {
      this.focus();
    }
  }

  public setContent(content: string) {
    if (!this.isReady) {
      return;
    }

    console.debug(`setContent ${this.id}`);
    this.milkdown.action(replaceAll(content));
  }

  public destroy() {
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
