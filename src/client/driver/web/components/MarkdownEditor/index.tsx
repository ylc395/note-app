import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { gfm } from '@milkdown/preset-gfm';
import { commonmark } from '@milkdown/preset-commonmark';
import { Editor, rootCtx, editorViewCtx, parserCtx, EditorStatus, editorViewOptionsCtx } from '@milkdown/core';
import { Node, Slice } from '@milkdown/prose/model';
import '@milkdown/prose/view/style/prosemirror.css';
import '@milkdown/prose/tables/style/tables.css';
import { listenerCtx, listener } from '@milkdown/plugin-listener';
import { history } from '@milkdown/plugin-history';
import { upload, uploadConfig } from '@milkdown/plugin-upload';
import { cursor } from '@milkdown/plugin-cursor';
import { clipboard } from '@milkdown/plugin-clipboard';

import { uploadOptions, htmlUpload } from './uploadFile';
import multimedia from './multimedia';
import iconLink from './iconLink';
import search from './search';

interface Props {
  onChange?: (content: string) => void;
  readonly?: boolean;
  autoFocus?: boolean;
}

export interface EditorRef {
  updateContent: (content: string, emitEvent?: boolean) => void;
}

export default forwardRef<EditorRef, Props>(function MarkdownEditor({ onChange, readonly, autoFocus }, ref) {
  const rootRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor>();
  const isInitialRef = useRef(false);

  const focus = useCallback(() => {
    const editor = editorRef.current;

    if (!editor) {
      throw new Error('not init');
    }

    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);

      if (!view.hasFocus()) {
        view.focus();
      }
    });
  }, []);

  useEffect(() => {
    if (!rootRef.current) {
      throw new Error('no root');
    }

    const editor = Editor.make()
      .use(commonmark)
      .use(gfm)
      .use(multimedia)
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
              if (isInitialRef.current) {
                isInitialRef.current = false;
                return;
              }

              if (typeof pre === 'string') {
                console.log('emit');

                onChange(markdown);
              }
            });
          }
        });
    }

    editor.create().then(() => {
      if (autoFocus) {
        focus();
      }
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
    };
  }, [autoFocus, focus, onChange, readonly]);

  useImperativeHandle(ref, () => ({
    updateContent: async (content: string, isInitial = true) => {
      const editor = editorRef.current;

      if (!editor) {
        throw new Error('not init');
      }

      const update = () => {
        isInitialRef.current = isInitial;
        editor.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          const parser = ctx.get(parserCtx);
          const doc = parser(content);
          const state = view.state;

          if (!doc) {
            return;
          }
          view.dispatch(state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)));
        });
      };

      if (editor.status === EditorStatus.Created) {
        update();
      } else {
        editor.onStatusChange((status) => {
          if (status === EditorStatus.Created) {
            update();
          }
        });
      }
    },
  }));

  return <div className="relative h-full overflow-auto" onClick={focus} ref={rootRef} spellCheck={false}></div>;
});
