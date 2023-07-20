import { gfm } from '@milkdown/preset-gfm';
import { commonmark } from '@milkdown/preset-commonmark';
import {
  Editor as MilkdownEditor,
  EditorStatus,
  rootCtx,
  editorViewCtx,
  parserCtx,
  editorViewOptionsCtx,
  commandsCtx,
} from '@milkdown/core';
import { Slice } from '@milkdown/prose/model';
import { listenerCtx, listener } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { upload, uploadConfig } from '@milkdown/plugin-upload';
import { cursor } from '@milkdown/plugin-cursor';
import { clipboard } from '@milkdown/plugin-clipboard';
import '@milkdown/prose/view/style/prosemirror.css';
import '@milkdown/prose/tables/style/tables.css';

import { uploadOptions, htmlUpload } from './uploadFile';
import multimedia from './multimedia';
import search, { enableSearchCommand } from './search';

interface State {
  scrollTop?: number;
  cursor?: number;
}

export interface Options {
  onChange?: (content: string) => void; // won't fire when calling updateContent
  readonly?: boolean;
  autoFocus?: boolean;
  defaultValue?: string;
  onInitialized?: (editor: Editor) => void;
  onDestroy?: () => void;
  onUIStateChange?: (state: State) => void;
  root: HTMLElement;
}

export default class Editor {
  private readonly editor: MilkdownEditor;

  constructor(private readonly options: Options) {
    this.editor = this.init();
  }

  private isUpdating = false;

  private init() {
    const editor = MilkdownEditor.make()
      .use(multimedia) // order attention!
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .use(search)
      .config((ctx) => ctx.set(rootCtx, this.options.root));

    if (!this.options.readonly) {
      editor
        .use(history)
        .use(upload) // upload 插件在前, 先处理粘贴文件的情况
        .use(htmlUpload)
        .use(clipboard)
        .use(cursor)
        .config((ctx) => {
          ctx.set(uploadConfig.key, uploadOptions);

          if (this.options.onChange) {
            ctx.get(listenerCtx).markdownUpdated((_, markdown, pre) => {
              if (typeof pre === 'string' && !this.isUpdating) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.options.onChange!(markdown);
              }
            });
          }
        });
    } else {
      editor.config((ctx) => {
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          editable: () => false,
        }));
      });
    }

    editor.create().then(() => {
      if (this.options.autoFocus) {
        focus();
      }

      if (typeof this.options.defaultValue === 'string') {
        this.updateContent(this.options.defaultValue);
      }

      this.options.onInitialized?.(this);

      if (this.options.onUIStateChange) {
        this.options.root.addEventListener('scroll', this.handleScroll);
      }
    });

    return editor;
  }

  private readonly handleScroll = (e: Event) => {
    const { scrollTop } = e.target as HTMLElement;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.options.onUIStateChange!({ scrollTop });
  };

  enableSearch() {
    this.editor.action((ctx) => {
      const commandManager = ctx.get(commandsCtx);
      commandManager.call(enableSearchCommand.key);
    });
  }

  focus() {
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);

      if (!this.options.readonly && !view.hasFocus()) {
        view.focus();
      }
    });
  }

  setReadonly(isReadonly: boolean) {
    this.editor.ctx.update(editorViewOptionsCtx, (prev) => ({
      ...prev,
      editable: () => !isReadonly,
    }));
  }

  updateContent(content: string) {
    const { ctx } = this.editor;
    const view = ctx.get(editorViewCtx);
    const parser = ctx.get(parserCtx);
    const doc = parser(content);
    const state = view.state;

    if (!doc) {
      return;
    }

    this.isUpdating = true;
    view.dispatch(state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)));
    this.isUpdating = false;
  }

  destroy() {
    this.editor.destroy();
    this.options.onDestroy?.();

    if (this.options.onUIStateChange) {
      this.options.root.removeEventListener('scroll', this.handleScroll);
    }
  }

  get isReady() {
    return this.editor.status === EditorStatus.Created;
  }

  applyState(state: State) {
    if (state.scrollTop) {
      this.options.root.scrollTop = state.scrollTop;
    }

    if (state.cursor) {
      this.editor.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const viewState = view.state;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        view.dispatch(viewState.tr.replace(state.cursor!));
      });
    }
  }
}
