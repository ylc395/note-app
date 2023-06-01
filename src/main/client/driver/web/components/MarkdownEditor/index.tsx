import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { gfm } from '@milkdown/preset-gfm';
import { commonmark } from '@milkdown/preset-commonmark';
import {
  Editor as MilkdownEditor,
  rootCtx,
  editorViewCtx,
  parserCtx,
  editorViewOptionsCtx,
  editorStateCtx,
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
import iconLink from './iconLink';
import search, { enableSearchCommand } from './search';

interface Props {
  onChange?: (content: string) => void; // won't fire when calling updateContent
  readonly?: boolean;
  autoFocus?: boolean;
  defaultValue?: string;
}

export interface EditorView {
  updateContent: (content: string) => void;
  setReadonly: (isReadonly: boolean) => void;
  focus: () => void;
  enableSearch: () => void;
}

export default forwardRef<EditorView, Props>(function MarkdownEditor(
  { onChange, readonly, autoFocus, defaultValue },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MilkdownEditor>();
  const isUpdatingContentRef = useRef(false);
  const creatingRef = useRef<Promise<void>>();

  const focus = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      throw new Error('not init');
    }

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);

      if (!readonly && !view.hasFocus()) {
        view.focus();
      }
    });
  }, [readonly]);

  const updateContent = useCallback((content: string) => {
    const editor = editorRef.current;

    if (!editor) {
      throw new Error('not init');
    }

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const parser = ctx.get(parserCtx);
      const doc = parser(content);
      const state = view.state;

      if (!doc) {
        return;
      }
      isUpdatingContentRef.current = true;
      view.dispatch(state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)));
    });
  }, []);

  const setReadonly = useCallback(
    (isReadonly: boolean) => {
      const editor = editorRef.current;

      if (!editor) {
        throw new Error('not init');
      }

      if (typeof readonly === 'boolean') {
        throw new Error('can not set `readonly` prop if using setReadonly');
      }

      const editorView = editor.ctx.get(editorViewCtx);
      const editorState = editor.ctx.get(editorStateCtx);
      editorView.update({ state: editorState, editable: () => !isReadonly });
    },
    [readonly],
  );

  useEffect(() => {
    if (!rootRef.current) {
      throw new Error('no root');
    }

    const editor = MilkdownEditor.make()
      .use(multimedia) // order attention!
      .use(commonmark)
      .use(gfm)
      .use(iconLink)
      .use(listener)
      .use(search)
      .config((ctx) => {
        ctx.set(rootCtx, rootRef.current);

        if (readonly) {
          ctx.update(editorViewOptionsCtx, (prev) => ({
            ...prev,
            editable: () => false,
          }));
        }
      });

    if (!readonly) {
      editor
        .use(history)
        .use(upload) // upload 插件在前, 先处理粘贴文件的情况
        .use(htmlUpload)
        .use(clipboard)
        .use(cursor)
        .config((ctx) => {
          ctx.set(uploadConfig.key, uploadOptions);

          if (onChange) {
            ctx.get(listenerCtx).markdownUpdated((_, markdown, pre) => {
              if (isUpdatingContentRef.current) {
                isUpdatingContentRef.current = false;
                return;
              }

              if (typeof pre === 'string') {
                onChange(markdown);
              }
            });
          }
        });
    }

    creatingRef.current = editor.create().then(() => {
      if (autoFocus) {
        focus();
      }

      if (typeof defaultValue === 'string') {
        updateContent(defaultValue);
      }
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
    };
  }, [autoFocus, defaultValue, focus, onChange, readonly, updateContent]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapHandle = (method: (...args: any[]) => void) => {
    return (...args: unknown[]) => {
      if (!creatingRef.current) {
        throw new Error('no creatingRef');
      }

      creatingRef.current.then(() => method(...args));
    };
  };

  const enableSearch = () => {
    const editor = editorRef.current;

    if (!editor) {
      throw new Error('not init');
    }

    editor.action((ctx) => {
      const commandManager = ctx.get(commandsCtx);
      commandManager.call(enableSearchCommand.key);
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      setReadonly: wrapHandle(setReadonly),
      updateContent: wrapHandle(updateContent),
      focus: wrapHandle(focus),
      enableSearch,
    }),
    [setReadonly, updateContent, focus],
  );

  return (
    <div className="relative h-full select-text overflow-auto" onClick={focus} ref={rootRef} spellCheck={false}></div>
  );
});